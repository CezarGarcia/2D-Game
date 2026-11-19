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

O código Java atual não é reaproveitado. Fica no histórico do repositório.

## Ordem de construção

| Etapa | Entrega | Critério para seguir |
|---|---|---|
| 1 · Sensação | Uma sala: herói com movimento, ataque, esquiva e um feitiço; três Assombros e um elite | Controlar o herói é gostoso |
| 2 · Fatia vertical | Capítulo 1 completo: 12 fases, Curupira, 2 armas, 5 feitiços de Natureza, 2 companheiros, loot, inventário, ferreiro (aprimorar e fundir), atributos, árvore Bravura | Alguém de fora joga 1 hora sem pedir ajuda |
| 3 · Campanha | Capítulos 2 a 8, todas as armas, elementos, talentos, conjuntos, únicos, Torre | Créditos alcançáveis, curva de dificuldade ajustada |
| 4 · Online | Contas, save na nuvem, servidor decidindo drops, rankings | Rankings confiáveis |
| 5 · Mercado | Compra e venda com ouro | Economia estável |
| 6 · Loja e temporadas | Loja direta, passe, primeira temporada | — |

## Referência de arte

`docs/arte/referencia-capitulo-1.html` guarda o código de desenho aprovado como ponto de partida: herói, capivara, Saúva-Cinza, Queixada Sombria, Tronco-Oco, Cuspidor, Curupira e a cena da Mata. Abra no navegador para ver. As funções de desenho desse arquivo são a base das do jogo.
