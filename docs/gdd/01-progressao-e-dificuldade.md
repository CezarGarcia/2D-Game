# 01 · Progressão e dificuldade

Objetivo: o jogador **não consegue atravessar o jogo em linha reta**. A cada capítulo ele encontra uma barreira, volta, evolui o personagem em várias frentes e então passa. O começo é rápido; a barreira cresce aos poucos.

## Nível do personagem

- Nível máximo: **60** na campanha, **80** no pós-jogo.
- Cada nível dá **3 pontos de atributo** e **1 ponto de talento**.

XP para subir do nível `L` para `L+1`:

```
xpNecessario(L) = arredonda( (0,45 + 0,085 × L^1,2) × (20 + 12 × L) )
```

| Nível | XP para o próximo | Fases do mesmo nível | Tempo aproximado |
|---:|---:|---:|---:|
| 1 | 15 | 0,5 | 2 min |
| 5 | 85 | 1,1 | 5 min |
| 10 | 250 | 1,8 | 8 min |
| 20 | 920 | 3,5 | 17 min |
| 30 | 2.085 | 5,5 | 26 min |
| 40 | 3.780 | 7,6 | 36 min |
| 50 | 6.040 | 9,7 | 46 min |
| 59 | 8.580 | 11,8 | 55 min |

## Nível da fase

As 96 fases sobem de nível em linha reta, do 1 ao 60:

```
nivelDaFase(i) = 1 + arredonda( i × 59 / 95 )      (i = 0 para a fase 1-1, 95 para a 8-12)
```

| Capítulo | Nível das fases |
|---|---|
| 1 · Mata Atlântica | 1 a 8 |
| 2 · Rios do Norte | 8 a 15 |
| 3 · Sertão | 16 a 23 |
| 4 · Cerrado em chamas | 23 a 30 |
| 5 · Selva Profunda | 31 a 38 |
| 6 · Pampa de lua cheia | 38 a 45 |
| 7 · Pantanal da Cuca | 46 a 53 |
| 8 · Terra Sem Nome | 53 a 60 |

## Recompensa de uma fase

```
xpDaFase(nivel)   = 20 + 12 × nivel
ouroDaFase(nivel) = 30 + 8 × nivel
```

- **Primeira vitória** numa fase: XP × 1,5.
- **Fase de chefão:** XP × 2.

### Redução em fase fácil

`diferenca = nível do personagem − nível da fase`

| Diferença | XP | Ouro |
|---|---:|---:|
| −3 ou menos (fase acima de você) | +10% por nível, até +30% | 100% |
| −2 a +2 | 100% | 100% |
| +3 | 85% | 100% |
| +4 | 70% | 100% |
| +5 | 55% | 90% |
| +6 | 40% | 80% |
| +7 | 25% | 70% |
| +8 ou mais | 10% | cai 10% por nível, mínimo 30% |

Regras que acompanham:

- A tela de seleção mostra a etiqueta de cada fase: **XP 100%** (verde), **XP 55%** (amarelo), **XP 10%** (cinza). O jogador sempre sabe onde vale a pena farmar.
- O ouro cai mais devagar que o XP de propósito: fases antigas continuam servindo para juntar ouro e material.
- **Drops com nome** (o item raro de uma fase específica) **não sofrem redução**. Voltar a uma fase antiga atrás de um item específico continua valendo.
- Itens genéricos caem com o nível da fase, então ficam obsoletos sozinhos.

## A barreira de cada capítulo

Cinco coisas seguram o jogador. Elas se somam.

### 1. Diferença de nível no combate

| Situação | Dano que você causa | Dano que você recebe |
|---|---:|---:|
| Cada nível **abaixo** do monstro | −4% | +4% |
| Limite (10 níveis abaixo) | −40% | +40% |
| Cada nível **acima** do monstro | +2% | −2% |
| Limite (5 níveis acima) | +10% | −10% |

Estar abaixo pesa muito. Estar acima ajuda pouco: sobrar nível não substitui desviar.

### 2. A curva de XP

Jogando cada fase uma única vez, o XP não acompanha o nível das fases a partir do Capítulo 4. Simulação com os valores acima, exigindo no máximo 1 nível abaixo da fase:

| Capítulo | Nível ao terminar, sem repetir fases | Repetições necessárias | Horas no capítulo |
|---|---:|---:|---:|
| 1 | 11 (fases vão até 8) | 0 | 1,3 |
| 2 | 18 (fases vão até 15) | 0 | 1,3 |
| 3 | 23 (fases vão até 23) | 0 | 1,3 |
| 4 | 28 (fases vão até 30) | 11 | 2,1 |
| 5 | 33 (fases vão até 38) | 27 | 3,3 |
| 6 | 37 (fases vão até 45) | 33 | 3,8 |
| 7 | 42 (fases vão até 53) | 53 | 5,3 |
| 8 | 45 (fases vão até 60) | 57 | 5,6 |

Total: cerca de 24 horas de combate, mais forja, menus e tentativas em chefões. **Meta: 30 a 35 horas até os créditos.**

Torre, missões diárias e desafios também dão XP e reduzem as repetições em cerca de um quarto. Repetir não precisa ser sempre a mesma fase.

### 3. Equipamento

Nos Capítulos 1 a 3 o nível sobra. Quem segura o jogador ali é o **chefão**, que exige equipamento:

- O baú das primeiras vitórias não dá itens suficientes para cobrir todos os slots no nível certo.
- Aprimorar e fundir pede material, que vem de repetir fases e de desmontar itens.
- Cada fase mostra o **Poder recomendado**. Abaixo de 85% dele, a etiqueta fica vermelha.

### 4. Resistência elemental

Cada capítulo tem um elemento dominante. Sem resistência a ele, o dano ambiente e os golpes do chefão ficam muito altos. A resistência vem de gemas e bônus de itens, que saem principalmente do capítulo anterior.

### 5. Chefão com tempo

Depois de 4 minutos de luta o chefão entra em fúria (+50% de dano, acumulando). Quem não tem dano suficiente não termina a tempo, mesmo desviando de tudo.

## Frentes de evolução

O que o jogador faz quando encontra a barreira, do mais barato ao mais demorado:

| Frente | Como evolui | Onde está descrito |
|---|---|---|
| Nível | XP de fases, Torre, missões | este documento |
| Atributos | 3 pontos por nível | 02 |
| Talentos | 1 ponto por nível, mais chefões e conquistas | 02 |
| Nível do item | Reforjar com material do capítulo | 04 |
| Aprimoramento | +1 a +15 com ouro e material | 04 |
| Raridade | Fundir 3 itens | 04 |
| Gemas | Engastar e fundir gemas | 04 |
| Feitiços | Subir de nível com tomos | 03 |
| Companheiro | Alimentar, evoluir de forma | 06 |

## Estrelas

Cada fase tem três:

1. Terminar.
2. Terminar sem morrer.
3. Terminar abaixo do tempo-alvo.

Estrelas acumuladas abrem baús do capítulo (em 12, 24 e 36 estrelas) com material raro e um ponto de talento no baú de 36.

## Depois do final

- **Heroica** e **Mítica:** as mesmas 96 fases com nível mais alto, elites com mais modificadores e tabelas de drop próprias. Nível máximo 80.
- **Torre dos Cem Andares:** 100 andares, ranking semanal.
- **Desafio dos Encantados:** todos os chefões em sequência, contra o relógio.

## Onde ficam os números

Todos os valores deste documento ficam num único arquivo de configuração do jogo, para ajuste sem mexer em código.
