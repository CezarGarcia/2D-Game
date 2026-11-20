# 02 · Personagem e talentos

Não existe classe fixa. A build é a soma de: arma, armadura, atributos, talentos, três feitiços, um Supremo e um companheiro.

## Atributos

Todos começam em 5. Cada nível dá 3 pontos para distribuir (177 pontos no nível 60). Redistribuir é grátis até o nível 15; depois custa ouro.

| Atributo | Efeito por ponto |
|---|---|
| **Força** | +1,2% de dano com facão, borduna e zagaia |
| **Agilidade** | +1,2% de dano com peixeiras e arco; +0,4% de velocidade de ataque; +0,15% de chance de crítico |
| **Inteligência** | +1,2% de dano de feitiço e de cajado |
| **Vitalidade** | +12 de vida; +0,2 de defesa |
| **Espírito** | +3 de mana; +0,5% de recarga de feitiços (limite 40%) |
| **Sorte** | +0,3% de chance de raridade maior nos drops; +0,2% de ouro (limite 30 pontos efetivos acima do nível) |

A zagaia divide: metade Força, metade Agilidade.

## Valores derivados

```
Dano do golpe  = danoDaArma × (1 + 0,012 × atributoDaArma) × (1 + bônus%) × crítico
Redução de dano = defesa / (defesa + 50 + 10 × nívelDoInimigo)     (limite 75%)
Crítico         = 5% de base; dano crítico 150%
Resistência     = 0 a 75% por elemento
```

A fórmula de defesa tem retorno decrescente: empilhar só defesa nunca chega à imunidade.

**Poder** é um número calculado a partir de dano por segundo, vida efetiva e nível. Serve para o jogador comparar itens e para a etiqueta de cada fase.

## Talentos

### Formato decidido: uma teia só, a partir do centro

Em vez de três árvores separadas, os talentos formam **uma única teia radial**, no formato mais comum do gênero:

- **Centro:** seis raízes, uma por atributo (Força, Agilidade, Inteligência, Vitalidade, Espírito, Sorte). O primeiro ponto vai numa raiz.
- **Caminhos para fora:** de cada raiz saem ramos com nós comuns e nós-chave. Um nó só pode receber ponto se estiver ligado a um nó que já tem ponto.
- **Anel de ligação:** nós grandes num anel conectam setores vizinhos. Quem começou em Força pode atravessar para Vitalidade ou Agilidade sem voltar ao centro.
- **Pontas:** os Dons ficam nas extremidades dos ramos.
- A regra de "pontos gastos por fileira" deixa de existir; a distância até o centro faz esse papel.

**Estado atual (etapa 3):** a teia do jogo tem 78 nós e está em `src/data/talents.ts`, que é a fonte da verdade. Cada braço tem raiz, um tronco de cinco nós que termina num Dom, e dois galhos de dois nós; entre braços vizinhos há um elo e, depois dele, uma joia. Há talentos de XP (Sabedoria, no braço da Inteligência) e de ouro (Olho Vivo, no da Sorte). A lista abaixo é o desenho original e ficou como referência de ideias.

Os nós listados abaixo são o conteúdo inicial e serão redistribuídos na teia: Bravura ocupa os setores de Força, Vitalidade e Agilidade; Mandinga, os de Inteligência e Espírito; Companheiro, o de Sorte. A teia nasce com esses 39 nós e cresce com mais nós por setor.

Entra na etapa 2 da construção (Capítulo 1), começando pelos setores de Força, Vitalidade e Agilidade.

### Pontos e regras gerais

- **1 ponto por nível** a partir do nível 2 (59 pontos no nível 60).
- **+8** dos chefões de capítulo e **+8** de conquistas (baús de 36 estrelas). Total possível: **75**.
- Três árvores. Completar uma custa **37 pontos**; as três custariam 111. Dá para fechar duas, ou espalhar.
- Redistribuir: grátis até o nível 15, depois custa ouro.

### Regras da árvore

- Cada árvore tem 5 fileiras. As quatro primeiras têm 3 nós, um por trilha. A quinta tem um nó só, o **Dom**.
- **Nó comum:** até 5 pontos, bônus percentual por ponto.
- **Nó-chave:** 1 ponto, muda como algo funciona.
- Para liberar uma fileira é preciso ter pontos gastos nas fileiras de cima da mesma árvore: fileira 2 → 5 pontos; fileira 3 → 10; fileira 4 → 18; Dom → 28.
- Só dá para tirar um ponto se nenhum nó abaixo depender dele.
- Dentro da trilha, o nó de cima precisa ter ao menos 1 ponto.

### Bravura (armas e sobrevivência)

| Fileira | Trilha Fúria | Trilha Guarda | Trilha Passo |
|---|---|---|---|
| 1 | **Mão Pesada** · +3% de dano de arma por ponto | **Couro Curtido** · +3% de defesa por ponto | **Pé Ligeiro** · +2% de velocidade de movimento por ponto |
| 2 ★ | **Sede de Briga** · cada inimigo derrotado dá +4% de dano por 6 s, até 5 vezes | **Contragolpe** · depois de aparar, o próximo golpe causa 250% | **Rolamento Cortante** · a esquiva causa dano em quem você atravessa |
| 3 | **Golpe Certeiro** · +2% de crítico por ponto | **Fôlego** · +4% de vida por ponto | **Reflexo** · −4% na recarga da esquiva por ponto |
| 4 ★ | **Execução** · golpes em inimigos abaixo de 25% de vida são sempre críticos | **Casca de Jabuti** · uma vez por fase, um golpe fatal deixa você com 1 de vida e 2 s de invencibilidade | **Segunda Esquiva** · guarda duas cargas de esquiva |
| Dom | **Sangue Quente** · abaixo de 35% de vida, +40% de dano e de velocidade de ataque | | |

### Mandinga (feitiços)

| Fileira | Trilha Poder | Trilha Fluxo | Trilha Reação |
|---|---|---|---|
| 1 | **Palavra Forte** · +3% de dano de feitiço por ponto | **Fonte** · +5% de mana máxima por ponto | **Afinidade** · +5% de duração dos efeitos elementais por ponto |
| 2 ★ | **Eco** · 20% de chance de o feitiço sair duas vezes | **Maré** · cada golpe de arma devolve 3 de mana | **Catalisador** · reações causam +40% de dano |
| 3 | **Foco** · +2% de crítico de feitiço por ponto | **Pressa** · −3% na recarga de feitiços por ponto | **Alastrar** · +6% na área das reações por ponto |
| 4 ★ | **Sobrecarga** · segurar o botão gasta o dobro de mana e causa 80% a mais | **Reza Curta** · depois do Supremo, feitiços não custam mana por 5 s | **Reação em Cadeia** · 30% de chance de a reação reaplicar o primeiro elemento |
| Dom | **Quarto Feitiço** · um espaço de feitiço a mais | | |

### Companheiro (parceria e sorte)

| Fileira | Trilha Laço | Trilha Instinto | Trilha Fartura |
|---|---|---|---|
| 1 | **Bom Trato** · +5% de vida e dano do companheiro por ponto | **Dentes e Garras** · +4% de crítico do companheiro por ponto | **Olho Vivo** · +3% de ouro por ponto |
| 2 ★ | **Juntos** · perto do companheiro, os dois regeneram vida | **Ataque Combinado** · seu golpe carregado manda o companheiro atacar o mesmo alvo com 200% | **Farejador** · o companheiro marca baús e salas secretas |
| 3 | **Faro** · −4% na recarga da habilidade do companheiro por ponto | **Herança** · o companheiro recebe 4% dos seus atributos por ponto | **Boa Estrela** · +2% de chance de raridade maior por ponto |
| 4 ★ | **Sete Vidas** · se cair, o companheiro volta em 8 s | **Elo Elemental** · os ataques do companheiro aplicam o elemento do seu último feitiço | **Catador** · 10% de chance de material de forja em dobro |
| Dom | **Bando** · leve um segundo companheiro, só com o bônus passivo | | |

★ = nó-chave.

### Como as árvores crescem depois

- Uma quarta árvore por temporada ou expansão (por exemplo, uma árvore do elemento novo).
- Nós de **maestria de arma**: uma mini-árvore por tipo de arma, alimentada pelo uso.
