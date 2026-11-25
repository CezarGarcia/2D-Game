/**
 * Conta e save na nuvem: entrar (Google ou link por e-mail), escolher o apelido, ver se está em dia,
 * sair e apagar a conta. E a janela de conflito, quando dois aparelhos jogaram sem sincronizar.
 * Quem decide é src/online/sync.ts; aqui só se mostra.
 */
import { nicknameProblem } from '../online/backend';
import type { CloudSync, SaveSummary } from '../online/sync';
import type { Ctx } from './ctx';
import { h, num, ui } from './dom';

/** "há 3 min", "hoje às 14:02", "em 12/11". */
function when(iso: string | null): string {
  if (!iso) return 'nunca';
  const t = new Date(iso), s = (Date.now() - t.getTime()) / 1000;
  if (s < 60) return 'agora há pouco';
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  const hm = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
  if (new Date().toDateString() === t.toDateString()) return `hoje às ${hm}`;
  return `em ${String(t.getDate()).padStart(2, '0')}/${String(t.getMonth() + 1).padStart(2, '0')} às ${hm}`;
}

function hours(sec: number): string {
  const hrs = Math.floor(sec / 3600), min = Math.floor((sec % 3600) / 60);
  return hrs > 0 ? `${num(hrs)}h ${min}min` : `${min}min`;
}

/** Linha de estado da nuvem, para o menu de opções e a janela da conta. */
export function syncLine(o: CloudSync): { icon: string; text: string; tone: '' | 'ok' | 'bad' | 'warn' } {
  switch (o.status) {
    case 'em-dia': return { icon: 'check', text: `Salvo na nuvem ${when(o.lastSync)}`, tone: 'ok' };
    case 'sincronizando': return { icon: 'conta', text: 'Sincronizando…', tone: '' };
    case 'pendente': return { icon: 'relogio', text: 'Vai sincronizar ao voltar ao acampamento', tone: 'warn' };
    case 'sem-rede': return { icon: 'fechar', text: 'Sem conexão: o jogo continua salvo neste navegador', tone: 'bad' };
    case 'conflito': return { icon: 'caveira', text: 'Dois saves diferentes: escolha um', tone: 'bad' };
    case 'sem-apelido': return { icon: 'heroi', text: 'Escolha um apelido para terminar', tone: 'warn' };
    default: return { icon: 'conta', text: 'Entre para guardar o progresso na nuvem', tone: '' };
  }
}

export function accountModal(c: Ctx, o: CloudSync): HTMLElement {
  const close = () => { c.st.account = false; c.redraw('opcoes'); };
  const acc = o.account, line = syncLine(o);
  let body: (HTMLElement | null)[];

  if (!acc) {
    const email = h('input', { type: 'email', class: 'acc-input', placeholder: 'seu@email.com', 'aria-label': 'E-mail', autocomplete: 'email' });
    const msg = h('div', 'acc-msg');
    body = [
      h('div', 'modal-text', 'Guarde o progresso na nuvem, jogue em outro aparelho e entre nos rankings. Sem conta, o jogo continua salvo só neste navegador.'),
      h('button', { type: 'button', class: 'btn primary big acc-google', 'data-fk': 'conta-google', onclick: () => { void o.signInGoogle().catch(() => { msg.textContent = 'Não deu para abrir o login do Google.'; }); } }, h('b', 'acc-g', 'G'), 'Entrar com Google'),
      h('div', 'acc-or', 'ou receba um link por e-mail'),
      h('form', {
        class: 'acc-row', onsubmit: (e: Event) => {
          e.preventDefault();
          const v = email.value.trim();
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { msg.textContent = 'Confira o e-mail.'; return; }
          msg.textContent = 'Enviando…';
          void o.signInEmail(v).then(() => { msg.textContent = `Pronto! Abra o link que chegou em ${v}.`; }, () => { msg.textContent = 'Não deu para mandar o link agora. Tente de novo.'; });
        },
      }, email, h('button', { type: 'submit', class: 'btn', 'data-fk': 'conta-email' }, 'Enviar link')),
      msg,
      h('a', { class: 'acc-privacy', href: 'privacidade.html', target: '_blank', rel: 'noopener' }, 'Política de privacidade'),
    ];
  } else if (!acc.apelido) {
    const nick = h('input', { type: 'text', class: 'acc-input', maxlength: 16, placeholder: 'Ex.: Caipora_77', 'aria-label': 'Apelido' });
    const msg = h('div', 'acc-msg');
    body = [
      h('div', 'modal-text', 'Como você quer aparecer nos rankings? Seu e-mail nunca aparece.'),
      h('form', {
        class: 'acc-row', onsubmit: (e: Event) => {
          e.preventDefault();
          const v = nick.value, why = nicknameProblem(v);
          if (why) { msg.textContent = why; return; }
          msg.textContent = 'Salvando…';
          void o.setNickname(v).then((err) => { if (err) msg.textContent = err; else c.redraw(); });
        },
      }, nick, h('button', { type: 'submit', class: 'btn primary', 'data-fk': 'conta-apelido' }, 'Usar')),
      msg,
    ];
  } else {
    body = [
      h('div', 'acc-who', ui('heroi', 40), h('div', null, h('b', null, acc.apelido), h('span', null, acc.email ?? ''))),
      h('div', `acc-sync ${line.tone}`, ui(line.icon, 24), h('span', null, line.text)),
      o.error && o.status === 'sem-rede' ? h('div', 'acc-msg', o.error) : null,
      h('div', 'modal-actions',
        h('button', { type: 'button', class: 'btn', 'data-fk': 'conta-sync', disabled: o.status === 'sincronizando', onclick: () => { void o.syncNow(); } }, ui('conta', 24), 'Sincronizar'),
        h('button', { type: 'button', class: 'btn', 'data-fk': 'conta-sair', onclick: () => { void o.signOut(); } }, 'Sair')),
      h('button', {
        type: 'button', class: 'acc-delete', 'data-fk': 'conta-apagar',
        onclick: () => c.confirm({
          title: 'Apagar a conta?', text: 'Apaga o apelido, o save na nuvem e os rankings. O progresso deste navegador continua.', icon: 'caveira', ok: 'Apagar a conta', danger: true,
          run: () => { void o.deleteAccount().then(() => c.toast('Conta apagada'), () => c.toast('Não deu para apagar agora', 'bad')); },
        }),
      }, 'Apagar minha conta'),
    ];
  }

  return h('div', { class: 'modal-back', onclick: (e: Event) => { if (e.target === e.currentTarget) close(); } },
    h('div', { class: 'modal acc', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Conta' },
      h('button', { type: 'button', class: 'mini-btn acc-close', 'aria-label': 'Fechar', 'data-fk': 'conta-fechar', onclick: close }, ui('fechar', 18)),
      h('div', 'modal-ico', ui('conta', 64)),
      h('div', 'modal-title', acc ? 'Sua conta' : 'Entrar'),
      body));
}

function saveCard(title: string, s: SaveSummary, pick: () => void, fk: string): HTMLElement {
  return h('div', 'acc-save',
    h('b', null, title),
    h('div', 'acc-save-lv', ui('xp', 28), h('span', null, `Nível ${s.nivel}`)),
    h('div', null, ui('relogio', 20), h('span', null, `${hours(s.tempoJogo)} de luta`)),
    h('div', 'dim', s.quando ? `Salvo ${when(s.quando)}` : 'Ainda não subiu'),
    s.aparelho && h('div', 'dim', s.aparelho),
    h('button', { type: 'button', class: 'btn primary', 'data-fk': fk, onclick: pick }, 'Usar este'));
}

/** Dois aparelhos jogaram sem sincronizar: o jogador escolhe qual save fica. Nada é misturado. */
export function conflictModal(c: Ctx, o: CloudSync): HTMLElement | null {
  const k = o.conflict;
  if (!k) return null;
  const pick = (which: 'local' | 'nuvem') => () => {
    const lost = which === 'local' ? k.cloud : k.local;
    c.confirm({
      title: which === 'local' ? 'Manter o deste navegador?' : 'Usar o da nuvem?',
      text: `O outro save (nível ${lost.nivel}) será substituído.`, icon: 'conta', ok: 'Confirmar', danger: true,
      run: () => { void o.resolve(which); },
    });
  };
  return h('div', { class: 'modal-back' },
    h('div', { class: 'modal acc conflict', role: 'alertdialog', 'aria-modal': 'true', 'aria-label': 'Escolha o save' },
      h('div', 'modal-title', 'Qual save fica?'),
      h('div', 'modal-text', 'Você jogou em dois lugares sem sincronizar. Escolha um; o outro some.'),
      h('div', 'acc-saves', saveCard('Neste navegador', k.local, pick('local'), 'conflito-local'), saveCard('Na nuvem', k.cloud, pick('nuvem'), 'conflito-nuvem'))));
}
