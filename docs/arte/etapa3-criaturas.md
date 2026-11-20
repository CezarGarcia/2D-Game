# Criaturas dos capítulos 3 a 8

Referência para a arte da etapa 3. Lista técnica (chaves, tipo de folha, tamanho na tela) em `src/art/roster.ts`; contrato de código em `src/art/kit.ts`.

## Regras de sempre

- Estilo "peças recortadas" cel-shaded com contorno grosso, igual a `src/art/characters.ts`, `characters2.ts` e `characters3.ts`. Use os mesmos ajudantes (`cel`, `cap`, `el`, `poly`, `ln`, `dot`, `glow`, `ik`, `seg2`).
- Desenhe virado para a **direita**, pés (ou base) em (0,0), y negativo para cima.
- **Assombros** (monstros e chefes antes de vencidos) são **cinzentos**, levemente puxados para a cor do capítulo, com **um resto de cor**: os olhos rosa brilhante (#ff3d8a, miolo #ffe0f0, com `glow`) e, quando a lista pede, um detalhe da cor original (a brasa, a folha, a pedra).
- **Encantados libertados** (`_free`) e **companheiros** são coloridos, vivos, simpáticos.
- O tamanho da lista é o maior lado do corpo **na tela**; ajuste `scale` da folha para chegar nele. Deixe folga na célula para a pose mais aberta.
- Animações padrão (a cena escolhe o quadro pelo nome, então os nomes são obrigatórios):
  - **mob**: `move` (ciclo de 6 a 8: andar, rastejar ou voar), `atk` (passagem de 4: o quadro 0 já é o começo do aviso, o último é o golpe ou o disparo), `hide` (passagem de 3, só emboscada: 0 = escondido, 2 = revelado).
  - **boss**: `idle` (ciclo 6), `move` (ciclo 8), `atk` (passagem 4, golpe físico), `cast` (passagem 4, magia ou rugido), `down` (ciclo 2: atordoado, exposto, sem fôlego), `special` (ciclo 6, o truque da lenda, descrito em cada um).
  - **free**: `idle` (ciclo 6).
  - **pet**: `idle` (ciclo 4), `walk` (ciclo 8), `act` (passagem 3, a habilidade). Quem voa: `fly` (ciclo 6) e `act`.
  - **fx**: `move` (ciclo 6).

## Capítulo 3 · Sertão (elemento Tempestade)

Terra rachada, cactos, sol forte, céu de chuva que não vem. Resto de cor dos Assombros: amarelo-relâmpago (#ffd23f) além dos olhos.

| Chave | Quem é | Como luta (o que a animação precisa mostrar) |
|---|---|---|
| `calango` | Calango-cinza, lagarto pequeno e rápido, cabeça erguida | Enxame. `move`: corrida de lagarto com o rabo serpenteando. `atk`: ergue o corpo e dá um bote curto com a boca aberta. |
| `cascavel` | Cascavel enrolada, chocalho na ponta do rabo com faíscas amarelas | Emboscada. `hide`: enterrada na areia, só o chocalho e os olhos (0) até erguida em S (2). `move`: serpenteando. `atk`: recua a cabeça e dá o bote em linha. |
| `mandacaru` | Cacto mandacaru com braços, anda arrastando as raízes | Atirador. `move`: arrasta-se balançando. `atk`: os braços se abrem e os espinhos se eriçam até disparar um leque. |
| `bode` | Bode-preto magro, chifres torcidos, barbicha | Investida. `move`: trote. `atk`: abaixa a cabeça, raspa a pata, chifres para a frente (a corrida usa o último quadro). |
| `urubu` | Urubu de asas enormes, cabeça pelada cinza, olhos rosa | Conjurador voador. `move`: planando em círculo, asas abertas. `atk`: abre as asas para cima e chama raios (faíscas nas penas). |
| `corposeco` | **Elite da fase 11.** Corpo-Seco: homem ressecado, pele de couro grudada no osso, a terra o rejeitou | `idle`/`move`: arrastado, curvado. `atk`: agarra com as duas mãos compridas. `cast`: suga a vida, uma corrente fina saindo do peito. `down`: desmonta no chão. `special`: se enterra e sai em outro lugar (ciclo: afundando na terra). |
| `saci` | **Chefão.** Saci-Pererê Assombro: menino de uma perna, gorro vermelho (o único resto de cor além dos olhos), cachimbo | `idle`: pulando num pé, cachimbo soltando fumaça. `move`: pulos. `atk`: chute giratório. `cast`: tira o gorro e o gira, raios em volta. `down`: caído, gorro torto. `special`: dentro de um redemoinho de poeira, só o gorro e os olhos aparecendo. |
| `saci_free` | O Saci libertado | Colorido, sorriso arteiro, pele escura, gorro vermelho vivo, cachimbo aceso. |
| `tatu` | Companheiro Tatu-bola | `act`: vira bola e rola. |
| `carcara` | Companheiro Carcará (voa) | `act`: mergulho com as garras à frente. |
| `poeira` | Redemoinho de poeira do cenário (fx) | Funil de areia girando, 90 px de altura, translúcido, com folhas secas. |

## Capítulo 4 · Cerrado em chamas (Fogo)

Árvores tortas de casca grossa, capim dourado, cupinzeiros, céu laranja de queimada. Resto de cor: brasa laranja (#ff8a2a).

| Chave | Quem é | Como luta |
|---|---|---|
| `formiga` | Formiga-de-fogo, cinza com o abdômen em brasa | Enxame, a menor de todas. `atk`: ergue o ferrão. |
| `seriema` | Seriema, ave de pernas longas e crista | Investida. `move`: passadas longas. `atk`: crista eriçada, corpo inclinado para a corrida. |
| `pequizeiro` | Pequizeiro torto que anda, com pequis em brasa pendurados | Atirador (arremesso em arco). `atk`: galho puxado para trás e solta um pequi. |
| `cupinzeiro` | Cupinzeiro de barro que anda, com fendas em brasa | Bruto blindado. `atk`: ergue o corpo inteiro e cai esmagando. |
| `taturana` | Taturana (lagarta) de pelos em brasa | Explosivo. `move`: rasteja ondulando. `atk`: incha e os pelos acendem até estourar. |
| `mula` | **Elite.** Mula-sem-Cabeça: mula cinza, labareda no lugar da cabeça (a cor que sobrou), ferraduras de prata | `move`: galope. `atk`: empina e dá coice. `cast`: a labareda do pescoço cresce e cospe fogo. `down`: deitada, fogo baixo. `special`: galope em chamas (rastro de fogo). |
| `boitata` | **Chefão.** Boitatá: cobra de fogo gigante. Esta folha é **só a cabeça** (o corpo é feito de `boitata_seg`) | Cabeça grande com olhos enormes. `idle`/`move`: língua de fogo. `atk`: boca escancarada. `cast`: cospe fogo. `down`: cabeça caída, chama fraca. `special`: cabeça mergulhando no chão. |
| `boitata_seg` | Um gomo do corpo do Boitatá visto de cima, 70 px | Escamas cinzentas com fogo rosa-alaranjado nas juntas. Simétrico para girar. |
| `boitata_cauda` | Ponta da cauda, 70 px, apontando para a esquerda | |
| `boitata_free` | Boitatá libertado | Cabeça colorida, fogo azul e dourado, olhos bondosos. |
| `loboguara` | Companheiro Lobo-guará | Pernas compridas, juba. `act`: corrida com rastro de fogo. |
| `tamandua` | Companheiro Tamanduá-bandeira | `act`: abraço, braços abertos. |
| `capim` | Touceira de capim seco (tex), 96 px, vista de cima | Dourado, para o chão. A cena acende por cima. |
| `chama` | Fogo no chão (fx), 64 px | Labareda que dança. |

## Capítulo 5 · Selva Profunda (Terra)

Floresta escura e úmida, raízes gigantes, musgo, pedras antigas. Pouca luz: as arenas são escuras. Resto de cor: âmbar de pedra (#d9a441).

| Chave | Quem é | Como luta |
|---|---|---|
| `morcego` | Morcego cinza | Enxame voador. `atk`: asas fechadas para o mergulho. |
| `besouro` | Besouro-rinoceronte com carapaça de pedra | Bruto blindado. `atk`: chifre para trás e golpe para a frente. |
| `aranha` | Caranguejeira peluda | Emboscada. `hide`: pendurada no escuro por um fio (0) até no chão (2). `atk`: patas da frente erguidas e bote. |
| `macaco` | Macaco-prego cinza | Atirador (arremesso em arco). `atk`: pedra erguida acima da cabeça. |
| `totem` | Totem de barro com pedra âmbar no meio | Protetor (dá escudo a quem está perto). `move`: arrasta-se. `atk`: a pedra brilha forte. |
| `capelobo` | **Elite.** Capelobo: corpo de homem peludo, focinho de anta | `atk`: salto e agarrão. `cast`: fareja e uiva. `special`: de quatro, investida. |
| `mapinguari` | **Chefão.** Mapinguari: gigante peludo, couro de pedra, um olho só e uma boca enorme na barriga | `cast` é o **rugido**: a boca da barriga se abre (é a janela de dano, deixe bem visível). `atk`: patada para baixo. `down`: de joelhos. `special`: pisões que racham o chão. |
| `mapinguari_free` | Mapinguari libertado | Colorido, pelo castanho-avermelhado, olho gentil, boca da barriga sorrindo. |
| `vagalume` | Companheiro Vaga-lume (voa) | `act`: clarão. |
| `preguica` | Companheira Preguiça | `act`: espreguiçar, bocejo. |
| `sucuri` | Companheira Sucuri | `act`: enrolar. |

## Capítulo 6 · Pampa de lua cheia (Sombra)

Campo aberto, coxilhas, cerca de pedra, lua enorme. Resto de cor: roxo-sombra (#b98cff).

| Chave | Quem é | Como luta |
|---|---|---|
| `queroquero` | Quero-quero (ave de penacho) | Enxame voador. `atk`: mergulho com o esporão da asa. |
| `boibarroso` | Boi-barroso de chifres longos | Investida pesada. |
| `almapenada` | Alma penada: vulto de lençol rasgado com correntes | Conjurador voador. `atk`: braços erguidos, marcas no chão. |
| `fatuo` | Fogo-fátuo: chama fria roxa com rosto | Explosivo voador. `atk`: incha até estourar. |
| `espantalho` | Espantalho de chapéu, com foices de mão | Atirador (lança foices girando). `atk`: braço para trás. |
| `teiniagua` | **Elite.** Teiniaguá: lagartixa-princesa com a pedra encantada na testa (resto de cor: vermelho-rubi) | `move`: rápida, rasteira. `atk`: bote. `cast`: a pedra da testa brilha. `special`: forma de moça (de pé, véu). |
| `lobisomem_h` | **Chefão, 1ª forma.** O homem: magro, poncho, encurvado | `idle`, `move`, `atk` (golpe de faca curta), `cast` = **começa a se transformar** (costas arqueando, pelo nascendo), `down`. |
| `lobisomem` | **Chefão, forma de lobo** | Lobo enorme sobre duas patas. `atk`: garras. `cast`: uivo para a lua. `special`: salto longo. `down`: caído. |
| `lobisomem_free` | Lobisomem libertado | Lobo colorido (cinza-azulado bonito com olhos dourados), postura de guardião. |
| `graxaim` | Companheiro Graxaim (raposa do campo) | `act`: bote rápido. |
| `coruja` | Companheira Coruja-buraqueira (voa) | `act`: asas abertas, olhos arregalados. |

## Capítulo 7 · Pantanal da Cuca (Encanto)

Água rasa, aguapés, árvores com ninhos, névoa colorida de feitiço. Resto de cor: verde-veneno (#7CFC9A) e magenta de feitiço.

| Chave | Quem é | Como luta |
|---|---|---|
| `ariranha` | Ariranha | Enxame. `atk`: bote. |
| `soco` | Socó (garça de pescoço dobrado) | Atirador (dispara o bico em linha). `atk`: pescoço recolhido até esticar. |
| `jararaca` | Jararaca no capim | Emboscada. `hide`: escondida no capim (0) até erguida (2). |
| `cururu` | Cururu-da-Cuca: sapo-feiticeiro com um caldeirãozinho nas costas | Conjurador (poças de feitiço). `atk`: mexe o caldeirão e joga. |
| `tracaja` | Tracajá (tartaruga) gigante | Bruto blindado. `atk`: se ergue e cai. |
| `pisadeira` | **Elite.** Pisadeira: velha magríssima, unhas enormes, cabelo desgrenhado | `atk`: salto para "pisar" (pés para baixo). `cast`: risada, mãos erguidas. `special`: agachada no alto, à espreita. |
| `cuca` | **Chefão.** Cuca: jacaroa-bruxa de cabelo loiro desgrenhado (o resto de cor: o loiro), vestido, colher de pau | `atk`: colherada. `cast`: mexe o caldeirão (use `caldeirao` como objeto separado) e joga poção. `down`: tonta. `special`: canto de ninar, notas no ar. |
| `cuca_free` | Cuca libertada | Colorida: escamas verdes, cabelo loiro, vestido estampado, cara de vovó brava mas boa. |
| `caldeirao` | Caldeirão de feitiço (tex), 70 px | Ferro preto, poção magenta borbulhando. |
| `jacarezinho` | Companheiro Jacaré (filhote colorido) | `act`: mordida. |
| `tuiuiu` | Companheiro Tuiuiú (voa) | Pescoço preto e vermelho. `act`: bate as asas. |

## Capítulo 8 · Terra Sem Nome (sem elemento)

Lugar que foi esquecido: chão de papel apagado, contornos que somem, pedaços de cenário de todos os capítulos sem cor. Assombros sem rosto: silhuetas em cinza-claro e branco, rasgos de vazio preto, olhos rosa. É o fim do jogo: estranho e bonito, não assustador.

| Chave | Quem é | Como luta |
|---|---|---|
| `vulto` | Vulto: silhueta de gente em rabisco | Enxame. |
| `vazio` | Vazio: bolha preta com borda branca | Explosivo. |
| `lembranca` | Lembrança: retrato flutuante rasgado | Atirador voador. |
| `esquecido` | Esquecido: estátua grande sem rosto | Bruto blindado. |
| `silencio` | Silêncio: figura de capuz com a mão sobre a boca | Conjurador (apaga feitiços do herói por um tempo). |
| `esquecimento` | **Chefão final.** O Esquecimento: figura enorme feita de névoa e papel apagado, um buraco no lugar do rosto, mãos que apagam | `atk`: mão que varre. `cast`: apaga (borracha de luz). `down`: se desfaz em parte. `special`: abre o vazio do rosto. |
| `mico` | Companheiro Mico-leão-dourado | `act`: pulo com cambalhota. |
| `botinho` | Companheiro Boto-cor-de-rosa (flutua numa bolha d'água, então usa `fly`) | `act`: onda. |

Os **Ecos dos Sete** (elite da fase 8-11) reusam as folhas dos chefões anteriores em versão translúcida, sem arte nova.
