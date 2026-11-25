# Encantados — documento de design

> Nome de trabalho. RPG de ação 2D, visto de cima, para navegador.
> Este documento é a referência para a construção. Os números são **valores iniciais**: servem para começar e vão ser ajustados jogando.

## A ideia em uma frase

Os seres do folclore brasileiro estão sendo esquecidos e viraram monstros sem cor. Você liberta um por capítulo e herda o poder de cada um.

## História

Num Brasil em que as histórias antigas são reais, os Encantados (Curupira, Iara, Saci e outros) guardavam cada canto da terra. Uma força chamada **Esquecimento** está apagando essas histórias. O que é esquecido perde a cor e vira **Assombro**: bichos, plantas e gente drenados, agressivos, cinzentos.

Você é um andarilho que ainda lembra. Em cada região, enfrenta o Encantado corrompido que a guardava. Ao vencer, ele se lembra de quem é, a cor volta à região no mapa, e ele passa a lutar ao seu lado: entrega o **elemento** dele e vira seu **Supremo**.

O fim é a Terra Sem Nome, onde está o Esquecimento.

## Pilares

1. **Habilidade e build contam os dois.** Todo perigo avisa antes; quem lê e reage vence com menos equipamento. Mas nenhuma habilidade dispensa evoluir o personagem.
2. **Sempre há algo para evoluir.** Nível, atributos, talentos, itens, raridade, feitiços, companheiro. Cada sessão termina com o personagem mais forte em pelo menos uma dessas frentes.
3. **O jogo abre aos poucos.** Um ou dois sistemas novos por capítulo.
4. **Extenso, com fim.** 8 capítulos, 96 fases, créditos. Pós-jogo finito.
5. **Justo.** Chances visíveis, azar com limite, sem sorteio pago, sem poder exclusivo de loja.

## O ciclo do jogo

```
Mapa do capítulo → escolhe a fase (vê nível, drops, estrelas, XP%)
      → 5 a 7 salas de combate (4 a 6 min) → elite ou chefão
      → baú: itens, ouro, XP, estrelas, tempo no ranking
      → acampamento: equipar, forjar, atributos, talentos, feitiços, companheiro
      → próxima fase, ou voltar a uma anterior para farmar
```

## Índice

| Documento | Conteúdo |
|---|---|
| [01 · Progressão e dificuldade](01-progressao-e-dificuldade.md) | Níveis, XP, a barreira de cada capítulo, redução de XP e ouro em fase fácil, estrelas |
| [02 · Personagem e talentos](02-personagem-e-talentos.md) | Atributos, fórmulas, as três árvores de talento |
| [03 · Combate e feitiços](03-combate-e-feiticos.md) | Controles, armas, esquiva e aparar, elementos, reações, lista de feitiços |
| [04 · Itens e forja](04-itens-e-forja.md) | Raridade, nível de item, bônus, aprimorar, fundir, reforjar, gemas, conjuntos, únicos, drops |
| [05 · Mundo, monstros e chefões](05-mundo-monstros-e-chefes.md) | Capítulos, arquétipos de monstro, elites, estrutura de chefão, Curupira detalhado |
| [06 · Companheiros](06-companheiros.md) | Como se obtém, formas, habilidades |
| [07 · Online e economia](07-online-e-economia.md) | Rankings, mercado, loja, temporadas |
| [08 · Arte e técnica](08-arte-e-tecnica.md) | Direção de arte, tecnologia, ordem de construção |
| [09 · O Sonho e a rejogabilidade](09-sonho-e-rejogabilidade.md) | Etapa 4: modo roguelite, padrinhos, Despertar, Roda do Saci, Presságios, Aldeia, Almanaque, conveniências |
| [10 · Plano da etapa 4](10-plano-da-etapa-4.md) | Como construir a etapa 4: fases, arquivos, testes, calibração, conteúdo |
| [11 · Afinidades elementais](11-afinidades-elementais.md) | Monstros com fraqueza e resistência, Casca elemental, o que a fase avisa, os itens de elemento e as Garrafadas |
| [12 · Online](12-online.md) | Etapa 5: contas, save na nuvem, rankings verificados refazendo a partida, fantasmas, cruzes e recados, onde hospedar |

## Glossário

- **Assombro:** qualquer inimigo comum. Algo que foi esquecido e perdeu a cor.
- **Encantado:** ser do folclore. Chefão de capítulo e, depois de libertado, o seu Supremo.
- **Supremo:** habilidade máxima, uma por elemento. O Encantado aparece e luta por alguns segundos.
- **Elite:** monstro comum com um ou dois modificadores e mais vida.
- **Poder:** número único que resume nível e equipamento. Cada fase mostra o Poder recomendado.
- **Nível da fase:** nível dos monstros da fase. Define dificuldade e recompensas.

## Decisões em aberto

- Nome definitivo do jogo e do repositório.
- Quantas fases do Capítulo 1 entram na primeira versão jogável (proposta: as 12).
- Personalização do herói (aparência, nome) na criação: sim ou não na primeira versão.
- Co-op: fora do escopo até a campanha estar completa.
