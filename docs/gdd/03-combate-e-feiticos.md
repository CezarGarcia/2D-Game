# 03 · Combate e feitiços

## Controles

| Ação | Teclado e mouse | Celular |
|---|---|---|
| Mover | WASD | analógico esquerdo |
| Mirar | mouse | automático no alvo mais próximo, ajustável arrastando |
| Atacar | botão esquerdo | botão de ataque |
| Golpe próprio da arma | botão direito | segurar o ataque |
| Esquiva | espaço | botão de esquiva |
| Feitiços | Q, E, R | três botões |
| Supremo | T | botão que acende quando carregado |
| Companheiro | F | botão |
| Poção | 1 | botão |

## Regras de leitura

- **Todo golpe perigoso avisa.** Marca vermelha no chão com a forma do golpe (círculo, cone, linha), que se preenche até o impacto.
- O tempo de aviso começa em 1,4 s no Capítulo 1 e chega a 0,7 s no 8.
- Golpes que não podem ser aparados têm marca roxa.

## Esquiva e aparar

- **Esquiva:** deslocamento curto com 0,25 s de invencibilidade no começo. Recarga de 1,2 s.
- **Esquiva perfeita:** esquivar nos últimos 0,2 s antes do impacto. O próximo golpe causa +50% e a recarga da esquiva zera.
- **Aparar** (só com escudo): levantar a defesa até 0,2 s antes do impacto anula o dano e atordoa o atacante por 1,5 s. Defender fora desse instante reduz o dano em 60% e gasta fôlego.
- Armadura pesada encurta a distância da esquiva em 20%.

## Armas

| Arma | Atributo | Ritmo | Golpe próprio |
|---|---|---|---|
| **Facão e escudo** | Força | Sequência de 3 golpes, médio | Aparar |
| **Borduna** | Força | Sequência de 2, lenta, em arco largo | Golpe carregado: quebra a armadura de elites e chefões |
| **Peixeiras duplas** | Agilidade | Sequência de 5, muito rápida, curta | Depois de uma esquiva perfeita, o próximo golpe é crítico |
| **Zagaia** | Força e Agilidade | Sequência de 3, alcance longo | Estocada que atravessa quem estiver em linha |
| **Arco** | Agilidade | Disparo à distância | Tiro carregado: mais dano quanto mais segura, mas você fica parado |
| **Cajado** | Inteligência | Projétil mágico fraco | Feitiços recarregam 20% mais rápido; o ataque básico carrega o último elemento usado |

Dano base da arma: `8 + 3 × nívelDoItem`, multiplicado pela raridade e ajustado pelo tipo (borduna ×1,6 e lenta; peixeiras ×0,55 e rápidas).

## Elementos e efeitos

Cada elemento aplica um efeito ao acertar:

| Elemento | Efeito | O que faz |
|---|---|---|
| Natureza | **Envenenado** | Dano contínuo; cura recebida pelo inimigo cai 50% |
| Água | **Molhado** | Sem dano; prepara reações |
| Tempestade | **Carregado** | O próximo golpe recebido solta uma faísca em inimigos próximos |
| Fogo | **Queimando** | Dano contínuo forte e curto |
| Terra | **Rachado** | Armadura reduzida |
| Sombra | **Amaldiçoado** | Recebe +15% de dano de todas as fontes |
| Encanto | **Confuso** | Chance de errar o alvo |

## Reações

Aplicar um segundo elemento em quem já tem um efeito consome o efeito e causa a reação.

| Primeiro | Segundo | Reação | Resultado |
|---|---|---|---|
| Água | Tempestade | **Eletrocutar** | O raio salta entre todos os molhados |
| Natureza | Fogo | **Queimada** | Explosão em área; o fogo passa para vizinhos envenenados |
| Água | Terra | **Lama** | Prende no lugar por 3 s |
| Fogo | Água | **Vapor** | Nuvem que cega inimigos por 4 s |
| Tempestade | Fogo | **Redemoinho de Fogo** | Puxa inimigos e queima em área |
| Terra | Tempestade | **Estilhaço** | Lascas de pedra em todas as direções |
| Natureza | Água | **Brotar** | Vinhas crescem e curam você ao redor do alvo |
| Sombra | Encanto | **Pesadelo** | Os inimigos atacam uns aos outros por 4 s |
| Sombra | Fogo | **Fogo-Fátuo** | A maldição passa para o inimigo mais próximo ao morrer |
| Encanto | Terra | **Estátua** | Petrifica por 2 s; o próximo golpe causa o dobro |

Monstros também usam elementos. Estar Molhado perto de um inimigo de Tempestade é perigoso para você.

## Feitiços

- Você equipa **3 feitiços** (4 com o Dom da Mandinga) e **1 Supremo**.
- Cada elemento tem 5 feitiços, com papéis fixos: projétil, área, controle, mobilidade ou defesa, e duradouro.
- Feitiços sobem do nível 1 ao 10 com **tomos** (drop) e ouro. Nos níveis 4, 7 e 10 você escolhe 1 entre 2 melhorias, o que cria variações do mesmo feitiço.
- Custam mana e têm recarga. A mana regenera devagar e volta com golpes de arma.
- **Runas** (Capítulo 7) se encaixam num feitiço e mudam o comportamento: projétil a mais, ricochete, área maior, custo menor.

| Elemento | Projétil | Área | Controle | Mobilidade / defesa | Duradouro | Supremo |
|---|---|---|---|---|---|---|
| **Natureza** | Dardo de Espinho | Chuva de Sementes | Cipó-Laço (puxa e prende) | Casca-Grossa (escudo que devolve dano) | Broto Curandeiro (totem de cura) | **Curupira:** corre pela sala deixando mata viva que prende tudo |
| **Água** | Jato | Onda (empurra e molha) | Bolha (prende um inimigo) | Correnteza (deslize rápido) | Chuva (molha a sala e cura um pouco) | **Iara:** o canto puxa todos ao centro e afoga |
| **Tempestade** | Faísca (salta 2 vezes) | Trovão (atraso, área grande) | Redemoinho (puxa e gira) | Pé-de-Vento (deslocamento) | Nuvem Carregada (segue você e dispara) | **Saci:** redemoinho gigante que ele conduz pela sala |
| **Fogo** | Brasa | Explosão | Coivara (linha de fogo no chão) | Passo de Cinza (some e reaparece) | Fogo-Fátuo (orbes em volta de você) | **Boitatá:** a cobra de fogo cruza a tela três vezes |
| **Terra** | Pedrada | Tremor | Muralha (bloqueia passagem) | Pele de Pedra (reduz dano) | Estaca (torre que atira) | **Mapinguari:** esmaga a sala e quebra toda armadura |
| **Sombra** | Garra Sombria (rouba vida) | Uivo (medo em área) | Marca da Lua (maldição) | Passo nas Sombras (aparece atrás do alvo) | Matilha (dois lobos) | **Lobisomem:** você se transforma por 10 s |
| **Encanto** | Sussurro (confunde) | Poção Borbulhante (efeito sorteado) | Canção de Ninar (sono) | Troca (troca de lugar com o alvo) | Espelho (uma cópia sua) | **Cuca:** todo inimigo comum da sala vira sapo por 6 s |

O Supremo carrega causando e recebendo dano. Uma carga completa leva cerca de 90 segundos de combate.
