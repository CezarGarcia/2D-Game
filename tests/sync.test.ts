import { describe, expect, it } from 'vitest';
import { nicknameProblem, type Account, type Backend, type CloudSave } from '../src/online/backend';
import { CloudSync, deviceLabel, isFresh, type KeyStore, type ProfileLike } from '../src/online/sync';

/** Servidor falso: um save por conta, com revisão, igual à função salvar_solo do banco. */
class FakeCloud {
  save: CloudSave | null = null;
  offline = false;
  backend(acc: Account): Backend {
    const cloud = this;
    const net = () => { if (cloud.offline) throw new Error('sem rede'); };
    return {
      async account() { net(); return acc; },
      async signInGoogle() {}, async signInEmail() {}, async signOut() {},
      async setNickname(a) { acc.apelido = a; return null; },
      async getSave() { net(); return cloud.save ? JSON.parse(JSON.stringify(cloud.save)) : null; },
      async putSave(perfil, base, meta) {
        net();
        const cur = cloud.save?.rev ?? 0;
        if (cur !== base) return { ok: false, rev: cur };
        cloud.save = { rev: cur + 1, perfil: JSON.parse(JSON.stringify(perfil)), nivel: meta.nivel, tempoJogo: meta.tempoJogo, aparelho: meta.aparelho, atualizadoEm: '2026-11-25T12:00:00Z' };
        return { ok: true, rev: cur + 1 };
      },
      async deleteAccount() { cloud.save = null; },
      onAuthChange() {},
    };
  }
}

/** Um navegador: o perfil em memória e o armazenamento local. */
class Browser {
  profile: ProfileLike;
  mem = new Map<string, string>();
  inStage = false;
  store: KeyStore = { get: (k) => this.mem.get(k) ?? null, set: (k, v) => { this.mem.set(k, v); }, remove: (k) => { this.mem.delete(k); } };
  sync: CloudSync;
  constructor(cloud: FakeCloud, level: number, acc: Account) {
    this.profile = { version: 6, level, stages: level > 1 ? { '1-1': {} } : {}, life: { seconds: level * 100 } };
    this.sync = new CloudSync(cloud.backend(acc), {
      getProfile: () => this.profile,
      replaceProfile: (p) => { this.profile = JSON.parse(JSON.stringify(p)); },
      canReplace: () => !this.inStage,
    }, this.store);
  }
  play(levels = 1): void { this.profile = { ...this.profile, level: this.profile.level + levels }; }
}

const ACC = (): Account => ({ id: 'u1', email: 'a@b.c', apelido: 'Saci' });

describe('save na nuvem', () => {
  it('o primeiro navegador sobe; um navegador novo desce sem perguntar', async () => {
    const cloud = new FakeCloud(), acc = ACC(), pc = new Browser(cloud, 12, acc);
    await pc.sync.refresh();
    expect(pc.sync.status).toBe('em-dia');
    expect(cloud.save?.rev).toBe(1);
    const phone = new Browser(cloud, 1, acc);
    await phone.sync.refresh();
    expect(phone.sync.status).toBe('em-dia');
    expect(phone.profile.level).toBe(12);
  });

  it('joga num aparelho, continua no outro', async () => {
    const cloud = new FakeCloud(), acc = ACC(), pc = new Browser(cloud, 12, acc), phone = new Browser(cloud, 1, acc);
    await pc.sync.refresh(); await phone.sync.refresh();
    phone.play(3); await phone.sync.syncNow();
    expect(cloud.save?.rev).toBe(2);
    await pc.sync.syncNow();
    expect(pc.sync.status).toBe('em-dia');
    expect(pc.profile.level).toBe(15);
    /* nada mudou: não sobe de novo */
    await pc.sync.syncNow();
    expect(cloud.save?.rev).toBe(2);
  });

  it('os dois jogaram sem sincronizar: conflito, e o jogador escolhe', async () => {
    const cloud = new FakeCloud(), acc = ACC(), pc = new Browser(cloud, 12, acc), phone = new Browser(cloud, 1, acc);
    await pc.sync.refresh(); await phone.sync.refresh();
    phone.play(2); await phone.sync.syncNow();
    pc.play(5);
    await pc.sync.syncNow();
    expect(pc.sync.status).toBe('conflito');
    expect(pc.sync.conflict?.local.nivel).toBe(17);
    expect(pc.sync.conflict?.cloud.nivel).toBe(14);
    await pc.sync.resolve('local');
    expect(pc.sync.status).toBe('em-dia');
    expect((cloud.save?.perfil as ProfileLike).level).toBe(17);
    /* o celular agora recebe o do computador */
    await phone.sync.syncNow();
    expect(phone.profile.level).toBe(17);
  });

  it('escolher o da nuvem troca o perfil do navegador', async () => {
    const cloud = new FakeCloud(), acc = ACC(), pc = new Browser(cloud, 12, acc), phone = new Browser(cloud, 1, acc);
    await pc.sync.refresh(); await phone.sync.refresh();
    phone.play(8); await phone.sync.syncNow();
    pc.play(1); await pc.sync.syncNow();
    await pc.sync.resolve('nuvem');
    expect(pc.profile.level).toBe(20);
    await pc.sync.syncNow();
    expect(pc.sync.status).toBe('em-dia');
  });

  it('no meio de uma fase não troca o perfil; sem rede, espera', async () => {
    const cloud = new FakeCloud(), acc = ACC(), pc = new Browser(cloud, 12, acc), phone = new Browser(cloud, 1, acc);
    await pc.sync.refresh(); await phone.sync.refresh();
    phone.play(1); await phone.sync.syncNow();
    pc.inStage = true;
    await pc.sync.syncNow();
    expect(pc.sync.status).toBe('pendente');
    expect(pc.profile.level).toBe(12);
    pc.inStage = false; cloud.offline = true;
    await pc.sync.syncNow();
    expect(pc.sync.status).toBe('sem-rede');
    cloud.offline = false;
    await pc.sync.syncNow();
    expect(pc.profile.level).toBe(13);
  });

  it('sem apelido não sincroniza; com apelido, sim', async () => {
    const cloud = new FakeCloud(), acc = { ...ACC(), apelido: null }, pc = new Browser(cloud, 5, acc);
    await pc.sync.refresh();
    expect(pc.sync.status).toBe('sem-apelido');
    expect(cloud.save).toBeNull();
    expect(await pc.sync.setNickname('Boto')).toBeNull();
    expect(cloud.save?.rev).toBe(1);
  });
});

describe('apelido e aparelho', () => {
  it('regras do apelido', () => {
    expect(nicknameProblem('Caipora_7')).toBeNull();
    expect(nicknameProblem('Mãe-do-Ouro')).not.toBeNull();
    expect(nicknameProblem('ab')).not.toBeNull();
    expect(nicknameProblem(' Iara')).not.toBeNull();
    expect(nicknameProblem('Puta Velha')).not.toBeNull();
    expect(isFresh({ version: 6, level: 1, stages: {} })).toBe(true);
  });
  it('nome do aparelho', () => {
    expect(deviceLabel('Mozilla/5.0 (Windows NT 10.0) AppleWebKit Chrome/131 Safari/537')).toBe('Chrome no Windows');
    expect(deviceLabel('Mozilla/5.0 (Linux; Android 14) Chrome/131 Mobile Safari')).toBe('Chrome no Android');
    expect(deviceLabel('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Version/17 Mobile Safari/604')).toBe('Safari no iPhone');
  });
});
