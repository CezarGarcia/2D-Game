# 07 · Online e economia

Tudo neste documento vem **depois** de a campanha estar divertida sozinha. A ordem está em [08](08-arte-e-tecnica.md).

## Servidor

- Decide drops, resultados de forja, XP e ouro. O navegador só mostra.
- Guarda a gravação dos comandos de cada partida que entra em ranking, para conferir o resultado e para reproduzir fantasmas.

## Rankings

| Ranking | Regra |
|---|---|
| Tempo por fase | Duas categorias: **Livre** (equipamento conta) e **Padrão** (equipamento nivelado, só habilidade) |
| Torre dos Cem Andares | Andar mais alto na semana; desempate por tempo |
| Desafio dos Encantados | Todos os chefões em sequência, menor tempo |
| Nível e Poder | Permanente |
| Primeira vitória | O primeiro jogador a libertar cada Encantado em cada dificuldade fica registrado para sempre |

- Mostrar percentil ("top 12%") e posição entre amigos, além do topo.
- Fantasma: a partida do jogador logo acima pode ser reproduzida como sombra na sua tentativa.
- Temporadas de cerca de 3 meses: rankings de tempo zeram, o personagem fica.

## Ouro

**Entra:** fases, vender itens ao ferreiro, missões.
**Sai:** todas as operações de forja, redistribuir atributos e talentos, espaços de inventário, taxa do mercado.

A forja é o principal ralo. O custo de aprimorar cresce com o nível do item, para o ouro nunca sobrar no fim do jogo.

## Mercado entre jogadores (ouro do jogo)

- Liberado no Capítulo 3.
- Anúncio com preço fixo em ouro. Busca por tipo, raridade, nível e bônus. Histórico de preço.
- Taxa de 8% sobre a venda.
- Podem ser vendidos: equipamentos, gemas, tomos, materiais.
- Não podem: itens comprados na loja, Lágrimas de Encantado, companheiros.
- Limite de anúncios simultâneos, ampliável.

## Loja (dinheiro real, compra direta, sem sorteio)

| Vende | Exemplos |
|---|---|
| Visual | Aparências de arma e armadura, cores, rastros, aparência de companheiro |
| Conveniência | Abas de inventário, conjuntos salvos extras, mais anúncios no mercado |
| Passe de temporada | Trilha de recompensas fixas e visíveis |
| Expansões | Capítulo novo |

Se a loja vender equipamento com atributos, três travas: o item também cai no jogo; fica preso à conta; a loja para uma raridade abaixo do topo e nada dela vale no ranking Padrão.

Não entram: energia que limita partidas, caixas de sorteio pagas, poder exclusivo de loja.

## Retorno diário

- **Missões diárias:** três, variadas (use tal elemento, vença sem poção, repita uma fase do capítulo X).
- **Bônus de descanso:** quem fica um dia fora volta com XP em dobro nas primeiras fases. Premia voltar, sem punir quem saiu.
- **Expedições:** fases curtas que mudam a cada dia e dão material de forja.

Feito na etapa 3, local (sem servidor), na aba **Diário** do acampamento (tecla 8). O dia é o do relógio do aparelho e vira à meia-noite; números em `src/data/daily.ts`, regras em `src/meta/daily.ts`.

**Missões.** Três por dia, de grupos diferentes, sorteadas pelo dia e por uma semente fixa do perfil, só entre as que o jogador já consegue fazer:

| Missão | Alvos | Aparece quando |
|---|---|---|
| Vença N fases | 2, 3, 4 | sempre |
| Derrote N monstros | 50, 80, 120 | sempre |
| Lance N feitiços de (elemento) | 10, 16, 24 | elemento de um feitiço já aprendido |
| Lance N feitiços | 20, 35, 50 | sempre |
| Vença uma fase sem usar poção | 1 | sempre |
| Repita uma fase do capítulo X | 1, 2 | capítulo com fase vencida (só vale fase já vencida antes) |
| Faça N esquivas perfeitas | 5, 8, 12 | sempre |
| Vença uma fase com elite ou chefão | 1, 2 | há uma fase assim aberta, a Torre ou as expedições |
| Vença uma fase com 2 estrelas | 1, 2 | sempre (fases do mapa) |
| Vença levando até 8 golpes | 1 | sempre |
| Suba N andares da Torre | 3, 5, 8 | Torre aberta |
| Use o ferreiro N vezes | 2, 3 | ferreiro aberto |
| Vença N expedições | 1, 2 | expedições abertas |
| Chame o Supremo N vezes | 2, 3 | um Encantado libertado |
| Cause N reações de elementos | 5, 10, 15 | dois elementos aprendidos |
| Vença com (arma) | 1, 2 | duas armas diferentes na mochila |

O progresso vem de qualquer partida (fase, Torre ou expedição) e do ferreiro. Cada missão paga ouro (90% a 160% do ouro de uma fase no nível do jogador) e resina; algumas dão pó ou tomo. Cumprir as três abre um baú: ouro, resina, pó, tomo e uma gema.

**Troca.** Uma missão que ainda não foi cumprida pode ser trocada por outra, de um grupo que não esteja em uso. É uma troca grátis por dia, e o progresso da missão trocada se perde.

**Descanso.** Cada dia inteiro sem abrir o jogo guarda a experiência de 3 fases no nível do jogador, até 3 dias. A experiência ganha vem de novo, tirada do descanso, até ele acabar (vale para fases, Torre e expedições). Um selo roxo "x2" no HUD avisa, e a tela de resultado mostra o quanto veio do descanso.

**Expedições.** Abrem com o ferreiro (fase 1-2). Duas por dia: a **Trilha** (2 salas) e a **Travessia** (3 salas, elite no fim). Cada uma usa um capítulo com pelo menos duas fases vencidas, só com os monstros das fases já vencidas dele, no nível do jogador (sem passar da fase mais difícil já aberta), e um modificador do dia: monstros velozes, sede de sangue, estouro, campeões, cheia, correnteza, noite fechada, lua cheia, miragem, esquecimento, horda ou raízes fundas (nunca o que o terreno do capítulo já faz). As três primeiras vitórias do dia pagam ouro, resina e pó; a primeira vitória em cada expedição paga resina em dobro, um tomo e um item. Depois disso, só experiência.

## Steam (futuro)

Venda entre jogadores com dinheiro só pelo Mercado da Comunidade Steam, se o jogo for publicado lá. O saldo fica na carteira Steam.
