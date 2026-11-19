# 08 · Arte e técnica

## Direção de arte

**Ilustração recortada, 2D, vista de cima em três quartos.** Personagens são montados em peças (cabeça, tronco, braços, pernas, arma, acessórios) e animados por código.

Regras:

1. **Contorno escuro e quente**, mais grosso na silhueta e mais fino nos detalhes internos.
2. **Três tons por peça:** cor base, sombra em meia-lua do lado oposto à luz, brilho do lado da luz. A luz vem sempre de cima e da esquerda.
3. **Detalhe que conta história:** costura no couro, moedas no chapéu, musgo no tronco, cicatriz. Cada personagem tem pelo menos três detalhes que só ele tem.
4. **Assombros são cinzentos com um resto de cor.** Encantados corrompidos seguem a mesma regra; a cor volta quando são libertados.
5. **Cada capítulo tem uma cor dominante** e uma hora do dia: Mata ao meio-dia filtrado (verde), Rios ao amanhecer (azul), Sertão ao fim da tarde (laranja), Cerrado à noite com fogo (vermelho), Selva na penumbra (verde-escuro), Pampa sob a lua (violeta), Pantanal na névoa (rosa), Terra Sem Nome sem cor.
6. **Cenário em camadas:** chão com textura, objetos ordenados por profundidade, copas e neblina por cima, raios de luz.
7. **Efeitos legíveis:** cada elemento tem uma cor só dele, usada no feitiço, no efeito sobre o inimigo e no ícone.

Referência cultural: gibão e chapéu de couro do sertão, xilogravura de cordel nos contornos, fauna e flora reais de cada bioma.

## O que é feito por código e o que vem de fora

| Por código | De fora |
|---|---|
| Personagens, monstros, chefões, cenários | Efeitos sonoros e música (bibliotecas livres no começo) |
| Animação, luz, partículas, efeitos de feitiço | Ilustração de capa para divulgação |
| Toda a interface | |

## Tecnologia

- **TypeScript**, **Phaser 3** (motor 2D para navegador) e **Vite**.
- Roda no navegador, em computador e celular. Empacotável para Steam depois.
- Dados do jogo (monstros, itens, feitiços, talentos, fases, fórmulas) em arquivos de configuração, separados do código.
- Simulação determinística com passo fixo, para gravar e reproduzir partidas.
- Progresso salvo no navegador até existir conta.
- Servidor (contas, drops, rankings, mercado): decidido quando chegar a etapa 4.

- A arte é desenhada por código (Canvas 2D) e convertida em folhas de sprites na abertura do jogo (`src/art/bake.ts`). Durante a partida o Phaser só troca quadros.

O código Java antigo não é reaproveitado. Está em `legacy/java`.

### Organização do código

| Pasta | Conteúdo |
|---|---|
| `src/data` | Números do jogo: `balance.ts` (combate do protótipo) e `progression.ts` (fórmulas do documento 01) |
| `src/sim` | Regras do combate, sem Phaser e sem navegador. É o que os testes exercitam |
| `src/art` | Desenho dos personagens e do cenário, e a conversão em texturas |
| `src/game` | Cena do Phaser: comandos, sprites, efeitos, HUD e som |
| `tests` | Testes das regras (`npm test`) |

## Ordem de construção

| Etapa | Entrega | Critério para seguir |
|---|---|---|
| 1 · Sensação (**feita, em avaliação**) | Uma sala com três ondas: herói com movimento, sequência de três golpes, esquiva com esquiva perfeita e Dardo de Espinho; Saúva-Cinza, Queixada Sombria, Cuspidor e o elite Tronco-Oco | Controlar o herói é gostoso |
| 2 · Fatia vertical | Capítulo 1 completo: 12 fases, Curupira, 2 armas, 5 feitiços de Natureza, 2 companheiros, loot, inventário, ferreiro (aprimorar e fundir), atributos, árvore Bravura | Alguém de fora joga 1 hora sem pedir ajuda |
| 3 · Campanha | Capítulos 2 a 8, todas as armas, elementos, talentos, conjuntos, únicos, Torre | Créditos alcançáveis, curva de dificuldade ajustada |
| 4 · Online | Contas, save na nuvem, servidor decidindo drops, rankings | Rankings confiáveis |
| 5 · Mercado | Compra e venda com ouro | Economia estável |
| 6 · Loja e temporadas | Loja direta, passe, primeira temporada | — |

## Referência de arte

`docs/arte/referencia-capitulo-1.html` guarda o código de desenho da proposta atual, ainda em revisão: herói, capivara, Saúva-Cinza, Queixada Sombria, Tronco-Oco, Cuspidor, Curupira e a cena da Mata. Abra no navegador para ver. As funções de desenho desse arquivo são a base das do jogo.
