# 04 · Itens e forja

## Slots

Arma · Outra mão (escudo, aljava, foco) · Cabeça · Peito · Mãos · Pés · Anel 1 · Anel 2 · Amuleto.

Armas de duas mãos (borduna, zagaia, cajado) ocupam os dois primeiros.

## O que define um item

| Propriedade | Explicação |
|---|---|
| **Tipo** | Facão, couraça, anel etc. |
| **Nível do item** | O nível da fase em que caiu. Define o valor base (dano ou defesa). |
| **Raridade** | Multiplica o valor base, define quantos bônus e até onde dá para aprimorar. |
| **Bônus** | Linhas aleatórias: "+12% de dano de Fogo", "+40 de vida", "+8% de recarga". |
| **Aprimoramento** | De +0 a +15. Cada ponto dá +4% no valor base. |
| **Engastes** | 0 a 3 espaços para gemas. |

## Raridade

| Raridade | Valor base | Bônus | Aprimoramento máximo | Engastes |
|---|---:|---:|---:|---:|
| Comum | ×1,00 | 0 | +3 | 0 |
| Incomum | ×1,10 | 1 | +6 | 0 |
| Raro | ×1,22 | 2 | +9 | 1 |
| Épico | ×1,36 | 3 | +12 | 2 |
| Lendário | ×1,52 | 4 | +15 | 3 |
| Mítico | ×1,70 | 4 e um efeito único | +15 | 3 |

O teto de aprimoramento por raridade é o que dá motivo para subir a raridade de um item de que você gosta.

## O ferreiro

Cinco operações. Todas mostram chance e custo antes de confirmar.

### Aprimorar (+1 a +15)

- Custa ouro e material do capítulo do item.
- Chance: 100% até +5, depois cai até 30% no +15.
- **Falhar não destrói nem rebaixa o item.** Gasta o material e soma +5% à chance da próxima tentativa.

### Fundir (subir a raridade)

- Escolha 1 item principal e 2 itens do mesmo slot e da mesma raridade para consumir.
- O principal mantém tipo, nível e bônus, sobe uma raridade e ganha 1 bônus novo.
- Chance: Comum→Incomum 100%, →Raro 90%, →Épico 75%, →Lendário 50%, →Mítico 25% (e exige uma Lágrima de Encantado).
- Falhar consome só um dos dois itens.

### Reforjar o nível

- Traz o nível do item até o seu nível atual.
- Custa material do capítulo atual, proporcional aos níveis ganhos.
- É o que permite carregar um item único do Capítulo 2 até o fim do jogo.

### Encantar

- Sorteia de novo **um** bônus à sua escolha. Os outros ficam travados.
- O custo dobra a cada uso no mesmo item.

### Desmontar

- Transforma itens que sobraram em Pó de Assombro e material do capítulo.

## Materiais

| Material | De onde vem | Para que serve |
|---|---|---|
| Ouro | Tudo | Todas as operações |
| Material do capítulo (um por capítulo) | Fases daquele capítulo, desmontar | Aprimorar e reforjar itens daquele nível |
| Pó de Assombro | Desmontar | Encantar |
| Lágrima de Encantado | Chefões, 1 garantida na primeira vitória | Fusão para Mítico, evolução final de companheiro |
| Tomos | Elites e baús | Subir nível de feitiço |

## Gemas

- Uma por elemento. Na arma dá dano daquele elemento; na armadura dá resistência a ele.
- 6 níveis. Fundir 3 gemas iguais gera 1 do nível seguinte.
- Tirar uma gema custa ouro e não a destrói.

## Conjuntos

- Um conjunto por capítulo e dois da Torre. Seis peças cada.
- Bônus com 2, 4 e 6 peças. O de 6 muda o jeito de jogar.
- Exemplo, **Conjunto do Vaqueiro** (Sertão): 2 peças, +10% de velocidade de movimento; 4 peças, a esquiva deixa uma nuvem de poeira que cega; 6 peças, esquiva perfeita solta um redemoinho.

## Únicos

Itens com nome e um efeito que nenhum outro tem. Só caem de uma fase ou de um chefão específico.

| Item | Onde | Chance | Efeito |
|---|---|---:|---|
| Alpercatas do Redemoinho | Saci | 2% | A esquiva vira um redemoinho que puxa inimigos |
| Cachimbo do Saci | Saci | 1% | Feitiços de Tempestade têm 25% de chance de não entrar em recarga |
| Coroa de Cipó | Curupira | 2% | Inimigos presos por Natureza recebem +30% de dano |
| Escama da Iara | Iara | 2% | Ficar Molhado cura você em vez de atrapalhar |
| Peixeira do Boto | Fase 2-7 | 3% | Críticos aplicam Molhado |

## Tabela de drops

Raridade dos itens do baú, por capítulo (dificuldade normal):

| Capítulo | Comum | Incomum | Raro | Épico | Lendário |
|---|---:|---:|---:|---:|---:|
| 1 | 70% | 25% | 5% | 0 | 0 |
| 2 | 60% | 30% | 9% | 1% | 0 |
| 4 | 45% | 35% | 16% | 3,6% | 0,4% |
| 6 | 33% | 36% | 22% | 7,5% | 1,5% |
| 8 | 25% | 35% | 27% | 11% | 2% |

- Míticos: só por fusão ou nas dificuldades Heroica e Mítica.
- **Livro de drops:** cada fase lista o que pode cair e a chance.
- **Azar com limite:** a chance de um item com nome sobe 0,5 ponto a cada tentativa sem sucesso e volta ao normal quando cai.
- O servidor decide todo drop e todo resultado de forja.

## Inventário

- 40 espaços no começo; mais espaços por ouro e pela loja.
- Travar item favorito, comparar com o equipado, desmontar em lote por raridade.
- 3 conjuntos salvos de equipamento, feitiços e talentos, para trocar entre farm e chefão.

## A expandir

Anotado para uma rodada própria de design, depois do protótipo: deixar itens, aprimoramento e encantamento mais extensos. Pontos a desenvolver:

- Mais degraus e marcos no aprimoramento (por exemplo, efeitos extras em +5, +10 e +15).
- Encantamentos como sistema próprio, com tipos e níveis, além do sorteio de bônus.
- Evolução de nível do item com etapas e requisitos por capítulo.
- Mais famílias de bônus e de itens únicos por capítulo.
