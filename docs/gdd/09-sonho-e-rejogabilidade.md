# 09 · O Sonho e a rejogabilidade

> Proposta da etapa 4. Os números são **valores iniciais**, como no resto deste documento.
> O plano de construção (arquivos, ordem, testes) está em [10 · Plano da etapa 4](10-plano-da-etapa-4.md).

Três objetivos:

1. **Um modo rejogável de sessão curta**, que dá vontade de jogar "só mais uma" e rende vídeo, ranking e demo.
2. **Menos repetição cansativa na campanha**, sem tirar o controle do jogador onde o jogo é novo.
3. **Mais profundidade de build**: mais escolhas que mudam o jogo, e não só números.

O que **não** muda: o herói continua sendo controlado pelo jogador. Nada aqui transforma o Encantados em jogo idle. Os pilares do [README](README.md) valem para tudo abaixo, em especial o 5 (chances visíveis, azar com limite, sem sorteio pago, sem poder exclusivo de loja).

---

## O que aprendemos com outros jogos

| Jogo | O que faz | Por que funciona | O que levamos |
|---|---|---|---|
| **Slotbound** (2026) | Gira uma máquina 3x3 para invocar unidades; absorve as fracas nas fortes, que são promovidas por caminhos diferentes. Ondas de Julgamento; árvore com 113 melhorias; modo infinito ao zerar. | Corridas curtas e o "jackpot" de uma unidade rara. Criticado por: a sorte decide demais no começo, há um muro de atributos que obriga a repetir, falta modo de treino e não dá para salvar a corrida. | Roda do Saci, Despertar, Provação. E corrigimos o que criticaram: proteção contra azar, Terreiro de treino, salvar entre salas, e a Provação perdida não encerra a noite. |
| **Hades / Hades II** | Cada deus dá bênçãos com identidade própria; bênçãos duplas quando se tem dois deuses; dificuldade escolhida (Pacto); cartas de Arcano com orçamento (Grasp); a história avança a cada morte; a casa é o centro. | Cada corrida conta uma história e a build tem "cara". Criticado por: sistemas difíceis de ler e recompensas que às vezes não vêm quando se espera. | Padrinhos (cada altar é de um Encantado), Compadrio (bênção dupla), Presságios, Cordéis com orçamento, falas na Aldeia. Toda recompensa aparece no mapa antes. |
| **Vampire Survivors / Megabonk** | Combate simples, poder absurdo no fim; evolução por receita (arma no máximo + passivo); coleção que se completa; missões que liberam conteúdo. | O pico de poder no fim vira clipe. Streamers foram o principal motor de venda do Megabonk. | Receitas de Despertar secretas, registradas no Almanaque. Resumo da noite pronto para compartilhar. Desbloqueio por desafio. |
| **Ball x Pit** (2025) | Funde e evolui bolas no nível 3; constrói uma cidade entre corridas, e a cidade fortalece todos os heróis. | Duas camadas de progresso que se alimentam: a corrida dá recurso, a cidade dá poder. | A Aldeia. O Despertar exige a bênção no máximo. |
| **Slay the Spire 1 e 2** | Mapa ramificado com o tipo de cada nó visível; eventos com escolhas; relíquias; 20 níveis de Ascensão. | O jogador planeja o caminho e cada evento é uma pequena história. | Mapa da noite, Causos, Amuletos, Presságios em graus. |
| **Balatro** | Curingas mudam regras, não só números; regras simples com combinações enormes; retorno visual e sonoro exagerado. | Descobrir uma combinação quebrada é a graça do jogo. | Amuletos que mudam regras e o retorno visual do jackpot e do Despertar. |
| **Risk of Rain 2** | Itens empilham; itens lunares têm custo; artefatos mudam a corrida inteira. | Cada escolha arriscada é memorável. | Figas tortas (amuletos com custo) e Presságios. |
| **Dead Cells** | Plantas que caem e liberam itens novos no sorteio; células de chefe para subir a dificuldade. | O conjunto de itens cresce aos poucos, e o jogador sente que cada corrida destrava algo. | Folhetos rasgados que liberam bênçãos e amuletos novos no sorteio. |
| **Diablo IV / Path of Exile / Last Epoch** | Poço e Fenda com tempo e ranking; masmorras com modificadores escolhidos (sigilos, corrupção) que melhoram o saque; filtro de saque; builds salvas; forja previsível. | Repetir conteúdo velho vale a pena porque o jogador escolhe o risco. | Presságios também nas fases da campanha, filtro de saque, builds salvas, Torre sem fim. |
| **Mewgenics** (2026) | Gatos com traços herdados; a casa decide a criação. | Cada gato é único e o jogador se apega. | Temperamento dos companheiros (e, depois, as Crias que o [06](06-companheiros.md) já prevê). |
| **9 Kings / Sephiria** (2026) | Cartas em grade com efeito de vizinhança; inventário onde a posição importa. | Quebra-cabeça de montagem simples de entender. | Ficou de fora por ora (ver o fim deste documento). |
| **Archero 2 e jogos de celular** | Fase já vencida pode ser repetida no automático. | Tira o tédio da repetição sem tirar o desafio do conteúdo novo. | Caçada automática, só em fase com 3 estrelas. |
| **TBH: Task Bar Hero** (2026) | Jogo idle na barra de tarefas; itens vendidos no Mercado da Steam por saldo. | Mostrou que existe público para progresso em segundo plano, mas o saldo real atraiu fazendas de bots e as avaliações caíram para cerca de 50%. | Andanças dos companheiros, com limite diário. Nada que vire dinheiro de verdade dentro do jogo. |

Três lições aparecem em quase todos:

- **Duas camadas que se alimentam**: a corrida dá recurso, o recurso deixa a próxima corrida diferente (e não só mais fácil).
- **Escolhas que mudam regras** valem mais que +10% de dano.
- **Um momento de exagero** por sessão (jackpot, Despertar, número enorme) é o que o jogador conta e grava.

---

## 1. O Sonho

### A ideia

Quando o andarilho dorme, o Esquecimento o puxa para um sonho feito das lembranças que está apagando. Cada **noite** é uma tentativa. Cair é acordar. O que se traz do sonho são **Lembranças**.

Isso dá à repetição um motivo dentro da história, e as falas da Aldeia comentam o que aconteceu na noite anterior.

- **Abre** depois de vencer a Iara (fase 2-12). A primeira noite é curta (um trecho só) e serve de tutorial.
- **Duração:** 25 a 35 minutos por noite completa.
- **Nome do modo:** "O Sonho". O nome "Travessia" já é de uma expedição diária.

### Com que herói se entra

O herói entra no Sonho com:

- **o tipo de arma** escolhido e o **Aspecto** dela (ver abaixo);
- **três feitiços** já aprendidos na campanha;
- **um companheiro** já resgatado;
- **atributos e equipamento do perfil de referência do nível da noite**: os itens Incomuns do nível, levemente aprimorados, que a calibração já usa.

O inventário da campanha **não entra**. Assim o Sonho fica justo para o ranking, um jogador novo não bate num muro de equipamento, e a build da noite vem das escolhas da noite. A campanha continua importando: ela libera os padrinhos, os feitiços, os companheiros e as armas que podem entrar.

### Uma noite

Uma noite tem **3 trechos**. Cada trecho sorteia um capítulo já vencido (cenário, monstros e terreno dele) e mostra um **mapa ramificado** de 7 a 8 nós em 3 colunas, que termina num chefe. O jogador vê o tipo de cada nó e escolhe o caminho.

| Nó | O que tem | Frequência |
|---|---|---|
| **Combate** | Uma sala do capítulo do trecho | 40% |
| **Elite** | Elite com 1 ou 2 modificadores. Dá um **amuleto** | 10% |
| **Altar de padrinho** | Escolha 1 de 3 bênçãos de um Encantado. O ícone mostra qual | 15% |
| **Roda do Saci** | A roda 3x3 (ver abaixo). Abre depois que o Saci é libertado | 8% |
| **Feira** | Compra com vintém: bênção, amuleto, cura, troca de opções, retirar uma bênção | 8% |
| **Causo** | Uma cena do folclore com 2 ou 3 escolhas | 10% |
| **Fonte** | Cura 40% da vida e devolve as poções; ou sobe uma bênção de nível | 6% |
| **Provação** | Sala com regra especial e recompensa dobrada. Opcional, marcada no mapa | 3% |
| **Chefe** | Fim do trecho | sempre 1 |

Regras do mapa:

- O primeiro nó de cada trecho é sempre um combate e o penúltimo, uma Fonte ou uma Feira.
- Há pelo menos um altar em todo caminho possível.
- Nenhum caminho tem dois Causos seguidos nem duas Provações no mesmo trecho.

**Nível dos monstros:** começa no nível do herói menos 2 e sobe 1 por trecho. Como o herói usa o perfil de referência, a calibração atual serve de régua.

**Vintém:** moeda da noite, cai dos monstros e de baús, e se perde ao acordar. Paga a Feira e a Roda.

**Ao acordar**, vencendo ou não, o jogador recebe:

| O quê | Quanto |
|---|---|
| Lembranças | 4 por sala, 15 por chefe, 25 por Provação, multiplicadas pelos Presságios |
| XP e ouro da campanha | 60% do valor de uma fase do nível do herói por trecho completo |
| Primeira noite completa com cada arma | 1 ponto de talento (6 no total) |

Salvar: a noite é salva **entre nós** do mapa. Fechar o jogo no meio de uma sala perde só aquela sala.

### Padrinhos e bênçãos

Os sete Encantados libertados viram **padrinhos**. Cada altar é de um padrinho, e só aparecem os que a campanha já libertou. Isso liga os dois modos: avançar na campanha abre bênçãos novas no Sonho.

| Padrinho | Elemento | Estilo das bênçãos | Exemplos |
|---|---|---|---|
| Curupira | Natureza | Prender, espinhos, enganar | **Pegadas Trocadas:** a esquiva deixa um rastro que confunde quem passa por cima. **Couro de Ouriço** (já existe). |
| Iara | Água | Cura, encanto, puxar | **Canto da Iara:** o primeiro golpe em cada inimigo o deixa encantado por 1 s. **Fruta Madura** (já existe). |
| Saci | Tempestade | Velocidade, esquiva, redemoinho | **Pé de Vento** e **Fôlego de Onça** (já existem). **Redemoinho:** a esquiva perfeita solta um pequeno redemoinho. |
| Boitatá | Fogo | Queimar, explodir | **Estouro** (já existe). **Rastro Aceso:** correr deixa fogo no chão. |
| Mapinguari | Terra | Defesa, quebrar armadura, golpe carregado | **Couro Duro** (já existe). **Pisada:** o golpe carregado atordoa em área. |
| Lobisomem | Sombra | Crítico, roubo de vida, abates | **Olho de Gavião** e **Sanguessuga** (já existem). **Faro:** inimigos com pouca vida recebem +30% de dano. |
| Cuca | Encanto | Feitiços, recarga, ilusão | **Mandinga Forte** e **Reza Ligeira** (já existem). **Caldeirão:** cada feitiço tem 15% de chance de não gastar mana. |

As 30 bênçãos de hoje são distribuídas entre os padrinhos. Algumas ficam **neutras**, como as de ouro, XP e atributo, que aparecem em Feiras e Causos. A meta na estreia do Sonho é **8 por padrinho mais 8 neutras (64)**.

Na campanha nada muda para o jogador: o altar das fases continua oferecendo 3 bênçãos quaisquer, mas cada uma passa a mostrar o ícone do seu padrinho e conta para as sinergias.

**Raridades:** Comum, Rara, Épica (como hoje) e **Lendária**, que só sai do jackpot da Roda, de Compadrio ou de Causo raro.

**Azar com limite nos altares** (hoje não existe): se dois altares seguidos não oferecem nada raro ou melhor, o próximo oferece pelo menos uma rara. Vale no Sonho e na campanha.

### Sinergia de padrinho

Ter várias bênçãos do mesmo padrinho dá um bônus por faixa, mostrado no HUD como as sinergias de um auto-battler. O companheiro do mesmo elemento conta como +1.

| Bênçãos | Exemplo: Saci |
|---|---|
| 3 | +1 esquiva guardada |
| 5 | A esquiva perfeita solta um redemoinho que arrasta inimigos |
| 7 | Durante 3 s depois de cada esquiva, ataques são 40% mais rápidos |

Vale no Sonho e na campanha (onde chegar a 5 é raro e chegar a 7, quase impossível; isso é de propósito).

### Despertar

Quando uma bênção chega ao **máximo**, o próximo altar daquele padrinho oferece, no lugar de uma das três opções, o **Despertar**: a bênção vira uma de **duas formas** à escolha.

| Bênção (máximo) | Forma A | Forma B |
|---|---|---|
| Fúria (5) | **Fúria do Mapinguari:** golpes carregados racham armadura em área | **Fúria Cega:** +60% de dano de arma e −30% de defesa |
| Pé de Vento (3) | **Corisco:** correr 2 s seguidos dá um golpe elétrico no próximo inimigo tocado | **Assobio do Saci:** +1 esquiva guardada e a esquiva atravessa projéteis |
| Mandinga Forte (5) | **Feitiçaria:** feitiços de área ficam 40% maiores | **Reza Brava:** feitiços de alvo único causam o dobro em quem tem efeito de elemento |

Há também **Despertares secretos**, feitos por receita: bênção no máximo + um amuleto específico. Exemplo: Estouro + Cabaça de Pólvora vira **Fogueira de São João**, em que cada inimigo derrotado deixa uma fogueira que queima por 4 s. Quem descobre uma receita a vê no Almanaque para sempre.

Meta na estreia: um Despertar com duas formas para cada bênção que tem máximo maior que 1, e 6 receitas secretas.

### Compadrio

Com **pelo menos 2 bênçãos de cada um de dois padrinhos**, o altar de qualquer um deles pode oferecer uma bênção de **Compadrio**, que só existe para aquele par. Elas se apoiam nas reações de elemento que o jogo já tem.

| Par | Compadrio |
|---|---|
| Iara e Boitatá | **Vapor:** a reação de Molhado com Queimado deixa uma névoa que cega por 2 s |
| Saci e Curupira | **Molecagem:** a esquiva deixa um sósia que atrai os inimigos por 2 s |
| Lobisomem e Cuca | **Pesadelo:** críticos em inimigos com efeito de Encanto os fazem fugir |
| Mapinguari e Boitatá | **Magma:** o chão rachado pelo golpe carregado pega fogo |
| Iara e Curupira | **Igarapé:** a cura também solta raízes em volta |
| Saci e Lobisomem | **Lua Ventosa:** cada abate dá +5% de velocidade por 4 s, acumulando até 5 vezes |
| Cuca e Iara | **Acalanto:** inimigos encantados ficam lentos depois que o encanto acaba |

São 21 pares possíveis. Começamos com 7 (cada padrinho em pelo menos dois) e completamos depois.

### Roda do Saci

Um nó do mapa que aparece depois que o Saci é libertado. Ele "deve uma" ao andarilho.

- **A grade:** 3x3 com símbolos dos padrinhos já libertados, mais o **Gorro** (curinga), o **Vintém** e o **Olho do Esquecimento**.
- **As linhas:** 3 horizontais, 3 verticais e 2 diagonais. Três iguais numa linha pagam.

| Linha | Paga |
|---|---|
| 3 de um padrinho | Uma bênção daquele padrinho (rara se forem 2 linhas, épica se forem 3 ou mais) |
| 3 Vinténs | Vintém igual a 4 vezes o custo do giro |
| 3 Olhos do Esquecimento | Uma **maldição** até o fim do trecho (um Presságio temporário) e Lembranças dobradas no trecho |
| Grade inteira igual (jackpot) | Bênção **Lendária**, ou Despertar imediato de uma bênção à escolha |

- **Custo:** o primeiro giro de cada Roda é grátis; depois custa 20, 40 e 80 vintém. São no máximo 4 giros por Roda.
- **Manipular:** **Pulo** gira de novo uma coluna. **Assobio** troca um símbolo por um Gorro. As cargas vêm de amuletos, Cordéis e da Aldeia. Na estreia: 1 Pulo por Roda e nenhum Assobio.
- **Chances visíveis:** um painel mostra a chance de cada símbolo e de cada tipo de linha.
- **Os pesos puxam a build:** cada bênção que o jogador já tem de um padrinho aumenta em 15% o peso do símbolo dele.
- **Azar com limite:** depois de 3 giros seguidos sem linha (na mesma noite), o próximo garante uma.
- Nada disso usa dinheiro real, e a Roda não existe fora do Sonho.

### Amuletos

Relíquias que valem a noite toda. Saem de elites, Feiras, Causos e chefes. A **meta na estreia é 40**, em três raridades, mais as **Figas tortas**, que dão muito e cobram um preço. Os melhores mudam regras em vez de só somar números.

| Amuleto | Efeito |
|---|---|
| **Muiraquitã** (lendário) | Toda cura que passar da vida máxima vira escudo |
| **Carranca** | Inimigos com mais de 90% de vida recebem +30% de dano |
| **Cabaça do Saci** | +1 Pulo em cada Roda |
| **Moeda Furada** | Toda Roda tem 2 giros grátis |
| **Rede de Dormir** | As Fontes curam 100% |
| **Chapéu de Couro** | As Provações pagam o triplo, mas você entra nelas com 70% da vida |
| **Galho de Arruda** | O primeiro Olho do Esquecimento de cada giro vira Gorro |
| **Moringa** | A primeira poção de cada sala é grátis |
| **Sanfona** | A cada 10 abates, uma onda empurra todos os inimigos |
| **Cabaça de Pólvora** | Abates têm 10% de chance de explodir (e entra numa receita secreta) |
| **Figa Torta** | +40% de dano, mas as Fontes não curam |
| **Ferradura Virada** | Bênçãos comuns sobem 2 níveis de uma vez, mas raras e épicas não aparecem mais nos altares |

### Causos

Pequenas cenas do folclore com 2 ou 3 escolhas, num quadro com ilustração e texto. São baratos de produzir (texto e uma imagem) e são onde o folclore do jogo mais aparece. A **meta na estreia é 20**.

| Causo | Escolhas |
|---|---|
| **Matinta Perera** | Um assobio na noite pede café e fumo. **Dar 30 vintém:** ela abençoa (uma bênção rara à escolha). **Recusar:** o assobio volta (uma maldição leve até o fim do trecho), mas você guarda o vintém. |
| **Comadre Fulozinha** | A dona da mata pede que você não fira os bichos do próximo combate (só vencer com feitiços). **Aceitar e cumprir:** bênção épica do Curupira. **Recusar:** nada. |
| **O Boto na festa** | Um moço de chapéu branco chama para dançar. **Dançar:** um companheiro extra até o fim do trecho. **Recusar:** cura de 30%. |
| **Pisadeira no telhado** | **Dormir:** cura total, mas o próximo combate começa com você atordoado por 2 s. **Vigiar:** +1 nível numa bênção à escolha. |

Cada causo vencido entra no Almanaque com um parágrafo sobre a lenda.

### Provações

Nó opcional, marcado no mapa com o Olho do Esquecimento. É uma sala com uma regra:

- derrotar 40 inimigos em 60 s;
- vencer levando no máximo 3 golpes;
- enfrentar uma elite com 3 modificadores;
- vencer sem usar feitiços.

Vencer dá um amuleto raro e Lembranças em dobro naquela sala. **Perder não encerra a noite** (ao contrário do Slotbound): o jogador perde metade da vida atual e a recompensa. Encerrar a noite ao perder é um Presságio (Juízo), para quem quer o risco.

### Chefes

O fim de cada trecho é um chefe do capítulo sorteado para ele: o Encantado corrompido (o da fase 12) ou o elite da fase 11. Os 16 chefes que já existem servem. No terceiro trecho:

- se a campanha já terminou, o chefe é um **Eco** do Esquecimento com o padrão de dois chefes misturado (pós-jogo, novo);
- senão, é o chefe mais difícil já vencido, com +1 modificador.

### Noite Funda (sem fim)

Ao vencer uma noite com o herói no nível 60, abre um **quarto trecho sem fim**: salas e chefes continuam, a dificuldade sobe 4% por sala e o jogador para quando quiser (ou quando cair). O ranking é por profundidade. A opção de velocidade 2x vale ali.

### Presságios

A dificuldade escolhida antes de entrar, como o Pacto do Hades, a Ascensão do Slay the Spire e os sigilos do Diablo IV. São **12 Presságios**, cada um com 1 a 3 graus, e cada grau pesa de 1 a 3 pontos. O **Peso** total multiplica as Lembranças (+8% por ponto, até +200%) e abre enfeites nos marcos de 8, 16, 24 e 32.

| Presságio | Por grau | Peso por grau |
|---|---|---|
| Lua Cheia | +20% de vida dos monstros | 1 |
| Fome | +15% de dano dos monstros | 2 |
| Mão Pesada | Monstros atacam 10% mais rápido | 1 |
| Bando | Elites ganham +1 modificador | 2 |
| Chefe Teimoso | Chefes ganham uma fase a mais (só 1 grau) | 3 |
| Poucas Velas | Uma Fonte a menos por trecho | 1 |
| Feira Cara | Preços +30% | 1 |
| Roda Viciada | Um símbolo de padrinho a menos na Roda (só 1 grau) | 2 |
| Sem Padrinho | O primeiro altar de cada trecho some (só 1 grau) | 2 |
| Pressa | Tempo-limite por trecho: 12, 10 e 8 min | 1 |
| Esquecimento | A cada trecho, um feitiço fica bloqueado (só 1 grau) | 3 |
| Juízo | Perder uma Provação encerra a noite (só 1 grau) | 2 |

**Na campanha**, os Presságios também podem ser ligados em **fases já vencidas com 3 estrelas**, com no máximo 10 pontos. Cada ponto dá +4% de chance de raridade maior nos drops e +3% de ouro. É isso que dá sentido a repetir uma fase antiga: o jogador escolhe o risco e melhora o saque.

### Progressão entre noites

**Lembranças** são a moeda que se traz do Sonho. Pagam Cordéis, Aspectos e as construções da Aldeia.

**Cordéis** funcionam como os Arcanos do Hades II. São folhetos que o jogador equipa antes da noite, cada um com um custo, e o total não pode passar do **Fôlego**. O Fôlego começa em 5 e chega a 20 com a Aldeia. A **meta na estreia é 20 folhetos**, cada um com 3 níveis.

| Cordel | Custo | Efeito no nível 1 |
|---|---:|---|
| A Peleja do Andarilho | 1 | +1 esquiva guardada |
| O Romance da Feira | 2 | Preços da Feira −15% |
| O Pavão Misterioso | 3 | A primeira bênção de cada trecho é no mínimo rara |
| A Moça que Virou Vento | 2 | +1 Pulo em cada Roda |
| Peleja do Vaqueiro com a Onça | 4 | A primeira vez que você cairia em cada trecho, fica com 30% da vida |
| O Fiado do Saci | 5 | Na Feira, um item por visita pode ser levado agora e pago na próxima |

Equipar Cordéis com custos 1, 2, 3, 4 e 5 ao mesmo tempo ativa o **Cordel Completo** (+10% de Lembranças), como o Centauro do Hades II. É um quebra-cabeça pequeno e opcional.

**Folhetos rasgados** são como as plantas do Dead Cells. Nem todas as bênçãos, amuletos e causos entram no sorteio desde o começo. Elites e chefes do Sonho deixam folhetos rasgados, e cada um libera um item novo no sorteio. A coleção cresce aos poucos e toda noite pode trazer algo inédito.

**Aspectos de arma.** Cada uma das 6 armas ganha 3 Aspectos: o padrão e mais dois que se compram com Lembranças. Eles mudam o golpe próprio da arma e valem **também na campanha**. Na estreia são 12 aspectos novos.

| Arma | Aspecto | O que muda |
|---|---|---|
| Facão | **do Curupira** | Aparar com o escudo devolve espinhos em volta |
| Facão | **do Vaqueiro** | Aparar dá uma investida curta na direção da mira |
| Arco | **da Iara** | O tiro carregado molha em área |
| Borduna | **do Mapinguari** | O golpe carregado abre uma fenda que atordoa em linha |
| Zagaia | **do Boitatá** | A estocada deixa um rastro de fogo |
| Peixeiras | **do Saci** | A esquiva perfeita deixa um redemoinho onde você estava |
| Cajado | **da Cuca** | O ataque básico alterna entre os elementos dos três feitiços equipados |

**Falas.** Ao voltar de uma noite, um Encantado da Aldeia comenta o que aconteceu: quem derrotou você, a bênção que você despertou, o causo que viu. São 1 ou 2 frases escolhidas por condição. É texto barato que faz a repetição parecer história.

---

## 2. A Aldeia

O acampamento vira uma **aldeia** que os Encantados libertados e os companheiros resgatados vão povoando. Cada construção devolve **cor** a um pedaço do cenário (o tema do jogo) e **abre ou melhora um sistema**. É assim que o jogo continua abrindo aos poucos, como pede o pilar 3.

As construções custam Lembranças e materiais da campanha. Cada uma tem 3 níveis.

| Construção | Nível 1 | Níveis 2 e 3 |
|---|---|---|
| **Terreiro de Treino** | O campo de treino (ver abaixo). Já vem construído | Bonecos de elite e de chefe; medidor de reações |
| **Barraca do Saci** | A Roda do Saci aparece no Sonho | +1 Pulo; depois +1 Assobio |
| **Casa de Cordel** | Libera os Cordéis, com Fôlego 5 | Fôlego até 20, em passos |
| **Viveiro** | As Andanças dos companheiros, com 1 vaga | 2 e depois 3 vagas |
| **Forja do Boitatá** | O ferreiro passa a reforjar **uma** linha de bônus escolhida, mantendo as outras | Mais chance de linhas altas |
| **Casa de Farinha** | +10% de ouro das fases da campanha | +20% e depois +30% |
| **Mural do Almanaque** | Abre o Almanaque | Mostra as receitas de Despertar que faltam, por padrinho |
| **Coreto** | Toca as músicas dos capítulos já vencidos e abre os enfeites | Enfeites do herói e dos companheiros |

Com os Cordéis e os Aspectos, são cerca de 100 melhorias permanentes, o mesmo tamanho da árvore do Slotbound, mas espalhadas por sistemas que o jogador vê.

---

## 3. Almanaque e Conquistas

**Almanaque do Folclore**, com uma aba para cada grupo e um contador de completude:

- **Bestiário:** cada monstro com o número de abates, fraquezas e um texto curto sobre a lenda;
- **Encantados:** a história de cada um, que se completa ao libertar;
- **Bênçãos e Despertares:** os descobertos, e as receitas secretas encontradas;
- **Amuletos, Causos, Itens únicos e Companheiros.**

**Conhecer o inimigo:** 100 abates de um tipo de monstro dão +3% de dano contra ele; 500 abates, +6%. O bônus é pequeno de propósito e faz parte do pilar "sempre há algo para evoluir".

**Conquistas:** cerca de **60 na estreia**, em cinco grupos (Campanha, Combate, Sonho, Coleção e Segredos, este escondido). Cada uma tem um identificador fixo, pronto para virar conquista da Steam.

- **Recompensas:** Lembranças, enfeites e títulos. Nunca poder grande.
- **Promessas:** as conquistas longas aparecem como uma lista de objetivos com recompensa, como a Lista de Profecias do Hades. Exemplo: "Desperte uma bênção de cada padrinho" libera um Cordel.

---

## 4. Menos repetição na campanha

**Caçada automática.** Em fase com **3 estrelas**, um botão "Automático" deixa o herói ser guiado pelo mesmo jogador automático que a calibração usa (o perfil "humano", que erra como gente).

- **Velocidade:** 1x, 2x ou 3x.
- **Fila:** até 10 repetições seguidas. Para se a mochila encher ou o herói cair.
- **Rendimento:** igual ao de jogar na mão; a regra de redução de XP em fase fácil já existe.
- **Pode perder.** É simulação de verdade, e quem está fraco para a fase vai cair.
- **Nunca automático:** fase não vencida, fase 12 de capítulo, Torre e Sonho.

**Filtro de saque.** Regras simples por raridade, nível e tipo:

- "desmontar Comuns e Incomuns automaticamente";
- "guardar sempre itens de conjunto e únicos".

O material vem como se o item fosse desmontado na mão.

**Builds salvas.** Três conjuntos de equipamento, talentos, feitiços, companheiro e Cordéis. Trocar é grátis; redistribuir talentos continua com o custo de sempre na primeira vez que a build é montada.

**Campo de treino (Terreiro).** Uma sala com bonecos parados e um medidor de dano por segundo, de dano por elemento e de reações causadas. Os bonecos podem ser postos como elite ou como chefe e com o elemento escolhido. Não dá nada; serve para testar a build. Foi pedido direto nas avaliações do Slotbound.

**Diário.** Uma troca de missão grátis por dia.

---

## 5. Companheiros: Andanças e Temperamento

**Andanças.** Os companheiros que não estão em uso saem por 1, 4 ou 8 horas para um capítulo já vencido e voltam com material, alimento, ouro e às vezes um folheto rasgado ou uma gema.

- As vagas vêm do Viveiro: 1 a 3.
- Contam com o relógio, inclusive com o jogo fechado.
- **Limite:** o total por dia rende no máximo o equivalente a 2 fases no nível do jogador. É um motivo para voltar, e não um jeito de jogar sem jogar.

**Temperamento.** Cada companheiro, ao ser resgatado, sorteia um de 8 temperamentos. Pode ser trocado na Aldeia com rapadura, um material raro das Andanças.

| Temperamento | Efeito |
|---|---|
| Brabo | +15% de dano, −10% de vida |
| Manso | +20% de vida, −10% de dano |
| Ligeiro | Habilidade recarrega 15% mais rápido |
| Guloso | +50% de alimento nas Andanças |
| Curioso | Mais chance de folheto e gema nas Andanças |
| Leal | +5% do bônus passivo |
| Sortudo | +3% de chance de raridade maior quando está com você |
| Medroso | Foge do perigo (perde menos vida), mas causa −10% de dano |

**Laço.** Usar um companheiro sobe o Laço dele de 1 a 5. Cada nível dá uma fala nova, um enfeite e +2% no bônus passivo.

---

## 6. Torre sem fim e desafios

- **Profundezas da Torre:** depois do andar 100, os andares continuam sem fim, com a dificuldade subindo 3% por andar, e um ranking semanal por andar alcançado, como o Poço do Diablo IV.
- **Noite da Semana:** uma noite do Sonho com semente e Presságios fixos, igual para todos, uma por semana, com ranking. Por enquanto é local; vira online junto com os rankings do [07](07-online-e-economia.md).
- **Desafio dos Encantados** (todos os chefes seguidos, contra o relógio): já previsto no [01](01-progressao-e-dificuldade.md), entra junto.

---

## 7. Momentos de exagero

São os momentos que viram clipe e propaganda.

- **Jackpot da Roda, Despertar e bênção Lendária:** a tela escurece, uma luz desce, toca um som próprio e o nome aparece em letras grandes. Duram 1,5 s e podem ser pulados.
- **Resumo da noite:** uma tela final com o maior golpe, as bênçãos, os amuletos, a sinergia mais alta, o tempo e o Peso dos Presságios. Um botão salva o resumo como imagem, pronta para compartilhar.
- **Números grandes** no fim da noite: com Despertares e sinergias no máximo, o dano tem que ficar visivelmente absurdo nos últimos trechos. Isso é calibrado de propósito, como no Megabonk.

---

## Ideias que ficaram de fora

| Ideia | Por quê |
|---|---|
| Virar jogo idle | Troca o controle do herói, que é o que o jogo tem de mais forte |
| Mercado com dinheiro real dentro do jogo | O TBH mostrou o problema dos bots; o [07](07-online-e-economia.md) já deixa isso para o Mercado da Steam |
| Inventário por posição (Sephiria, 9 Kings) | É outro jogo de quebra-cabeça. Pode voltar como um amuleto específico |
| Morte permanente de companheiro (Mewgenics) | Conflita com a coleção e com o pilar de jogo justo |
| Qualquer sorteio pago | Pilar 5 |

## Decisões em aberto

1. **Itens da campanha no Sonho.** Proposta: não contam (perfil de referência do nível). Armas, Aspectos, feitiços e companheiros contam.
2. **Quando o Sonho abre.** Proposta: depois da fase 2-12.
3. **Rendimento da Caçada automática.** Proposta: 100%. A alternativa é 80%, para jogar na mão ainda valer mais.
4. **Nome do modo.** Proposta: "O Sonho", e "noite" para cada tentativa.
