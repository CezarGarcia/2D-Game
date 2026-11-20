// @ts-nocheck
/**
 * Projéteis e efeitos da etapa 3 (feitiços dos elementos novos, armas novas e ataques dos monstros).
 * Cada textura aponta para a DIREITA (a cena gira na direção do voo) e é centrada no quadro.
 * PROVISÓRIO: formas simples até a arte final entrar.
 */
export const FX: Record<string, { w: number; h: number; color: string; desc: string }> = {
  p_faisca: { w: 46, h: 18, color: '#ffe066', desc: 'Faísca de Tempestade: raio curto em zigue-zague, amarelo-branco' },
  p_brasa: { w: 40, h: 22, color: '#ff7a2a', desc: 'Brasa: bola de fogo com rastro' },
  p_pedra: { w: 30, h: 28, color: '#b08a5a', desc: 'Pedrada: pedra lascada' },
  p_garra: { w: 44, h: 30, color: '#9a6aff', desc: 'Garra Sombria: três riscos roxos curvos' },
  p_sussurro: { w: 40, h: 26, color: '#ff7ad9', desc: 'Sussurro: espiral rosa com notas' },
  p_cajado: { w: 36, h: 20, color: '#fff1b0', desc: 'Disparo do cajado: orbe claro com rastro (a cena tinge pela cor do elemento)' },
  orb_fatuo: { w: 30, h: 30, color: '#7ad0ff', desc: 'Fogo-Fátuo do herói: chama azulada que gira em volta dele' },
  estaca: { w: 50, h: 70, color: '#8a6a4a', desc: 'Estaca: torre de pedra pontuda com um olho âmbar, vista 3/4, base embaixo' },
  muralha: { w: 64, h: 64, color: '#7a6a5a', desc: 'Muralha: bloco de pedra que brota do chão, base embaixo' },
  nuvem: { w: 96, h: 60, color: '#6a7a9a', desc: 'Nuvem Carregada: nuvem escura com faíscas' },
  sapinho: { w: 40, h: 34, color: '#7ac85a', desc: 'Sapinho (Supremo da Cuca): sapinho verde bobo, base embaixo' },
  e_espinho: { w: 36, h: 10, color: '#c9c4bd', desc: 'Espinho de mandacaru, cinza com ponta rosa' },
  e_pequi: { w: 26, h: 26, color: '#ff8a2a', desc: 'Pequi em brasa' },
  e_pedra: { w: 22, h: 22, color: '#9a948a', desc: 'Pedra do macaco' },
  e_foice: { w: 40, h: 40, color: '#c9c4bd', desc: 'Foice girando (a cena gira a textura)' },
  e_bico: { w: 40, h: 12, color: '#d9d4cc', desc: 'Bico do socó, lança fina' },
  e_sombra: { w: 34, h: 18, color: '#7a5aaa', desc: 'Projétil de sombra genérico' },
  e_caco: { w: 30, h: 16, color: '#e9e4d8', desc: 'Caco de retrato (Lembrança)' },
  e_pocao: { w: 26, h: 30, color: '#ff4ad0', desc: 'Frasco de poção magenta (Cuca e Cururu), arremessado em arco' },
};

export function bakeFx(kit) {
  for (const [key, f] of Object.entries(FX)) {
    kit.image(key, f.w, f.h, (c) => {
      c.fillStyle = f.color; c.strokeStyle = '#22100a'; c.lineWidth = 2;
      c.beginPath(); c.ellipse(f.w / 2, f.h / 2, f.w / 2 - 2, f.h / 2 - 2, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    });
  }
}
