# Notas técnicas do Anatomy Studies

Site para estudo de anatomia, com visualizador de modelos anatômicos (Babylon.js, TypeScript e Vite), quizzes e testes (em desenvolvimento) e outros materiais.

## Executar

```sh
npm install
npm run dev
```

`npm run build` verifica o TypeScript e gera a aplicação em `dist/`.
`npm run preview` serve esse build localmente.

## Organização

| Caminho | Conteúdo |
|---|---|
| `src/` | Visualizador, materiais e estilos |
| `public/` | Modelos GLB servidos pela aplicação |
| `scripts/` | Ferramentas de análise local |

Os arquivos de pesquisa ficam fora de `public/` e não fazem parte do build do site.
Arquivos de pesquisa externos não estão incluídos neste repositório.

## Aparência natural do crânio

O modo “Osso natural” carrega `public/overview-skull-natural.glb`, com 15 texturas de cor JPEG de 512 × 512, qualidade 90 e sem subamostragem de cor. O GLB ocupa aproximadamente 1,35 MB e mantém a geometria Draco e os mapas de relevo anatômico originais. O material procedural em TypeScript foi substituído pelas texturas incorporadas. O contador de FPS aparece na visualização 3D e atualiza a cada 500 ms.

Para regenerar o arquivo, execute `python3 scripts/bake-natural-skull.py` com as dependências npm instaladas e Python com NumPy e Pillow.

A experiência KTX2/Basis está preservada na branch `experiment/skull-ktx2`, incluindo o modelo, os decoders locais, os scripts e as instruções. No teste informado pelo usuário no iPhone 13, a versão procedural e a KTX2 tiveram aproximadamente o mesmo FPS (média de 58 FPS); o GLB KTX2 também ficou maior que o JPEG (1,40 MB contra 1,35 MB).

## Banco de questões e testes

O banco contém 151 perguntas: 23 da prática original, as 70 do simulado fornecido, 22 questões práticas de músculos e 36 questões complementares do roteiro unificado da P1 de 2026-2. Os filtros incluem crânio, tórax, coluna, membro superior, membro inferior e pelve, abdome e sistema nervoso; os tipos incluem identificação, denominação, completar a frase e diferenciação. Cada pergunta tem um identificador, respostas aceitas e explicação. O complemento fica em `src/p1Questions.ts`; `src/professorContent.ts` padroniza a nomenclatura e associa as perguntas aos itens do roteiro. A relação com o material do professor está em `docs/validacao-p1.md`.

Na abertura, selecione uma ou mais regiões e tipos de questão e a quantidade de perguntas, com 20 como padrão. O teste sorteia perguntas sem repetição, limitado à quantidade disponível. Combinações vazias não permitem iniciar. Cada teste vale 10 pontos: o valor por questão é 10 dividido pela quantidade real de perguntas. A nota final usa o valor exato, sem acumular arredondamentos; o resumo, o enunciado e os resultados exibem o valor por questão.

O progresso é salvo em `localStorage`, na chave versionada `anatomia.progress.v1`. São armazenados os filtros do último teste iniciado, a ordem das perguntas, a posição, as respostas conferidas, o rascunho atual e o histórico de tentativas por pergunta. Ao reabrir o app, “Continuar teste” retoma o andamento. Começar outro teste substitui o anterior, preservando o histórico. O modo “Revisar meus erros” usa questões cuja última tentativa foi errada, incompleta ou “Não sei”, aplica os mesmos filtros e prioriza as que acumulam mais erros. Um acerto retira a pergunta da revisão. Dados inválidos e IDs removidos da base são tratados na restauração; se o navegador bloquear o armazenamento, a interface informa que o progresso ficará apenas na sessão.

A prática livre oferece o banco filtrável e permite abrir qualquer pergunta diretamente. Durante a prática livre, o seletor permite ir a qualquer questão, sem precisar responder às anteriores. Esse modo não gera resultado de teste. As tentativas conferidas também alimentam o histórico persistente e a revisão por erros; a posição da prática livre permanece em memória.

As perguntas do tórax e da coluna usam `public/pectoral-back-thorax-bones-costal-cart.glb`. As oito perguntas cervicais (atlas, áxis, C7 e vértebra cervical típica) usam `public/overview-skeleton.glb`, pois essas estruturas não estão presentes no modelo do tórax. Nas perguntas de nome da coluna, aparece apenas a peça isolada. Nas perguntas de identificação da coluna, aparecem seis peças separadas em ordem sorteada. As questões vertebrais comparam atlas, áxis, C7, cervical típica, torácica e lombar; sacro e cóccix usam cervical típica, C7, torácica e lombar como alternativas. Todas as perguntas de identificação têm pelo menos cinco alternativas. O modelo com cartilagens costais fornece as peças torácicas, lombares, sacro e cóccix; as alternativas cervicais são carregadas do modelo anterior. As peças são centralizadas fora de sua posição na coluna, com escala anatômica preservada e uma vista inicial oblíqua superior. O banco cobre atlas, áxis, C7, vértebra cervical típica, torácica, lombar, sacro e cóccix; no tórax, cobre o corpo do esterno. Manúbrio e processo xifoide ainda precisam de alvos separados no modelo para receber perguntas 3D. O banco escrito complementar está em `docs/perguntas-torax-coluna.md`.

As respostas escritas aceitam diferenças de acentuação e capitalização. Nas questões de identificação, clicar no osso seleciona seu número, assim como clicar no marcador ou na alternativa. O modo de exploração mantém as três aparências do crânio e a seleção de ossos no modo natural.

## Questões práticas de músculos

As perguntas de identificação e denominação carregam peças preparadas de `public/upper-muscles-prepared.glb` e `public/lower-muscles-prepared.glb`, exportadas de `upper-limb.glb` e `lower-limb.glb`. As estruturas removidas não estão nesses arquivos; os números são criados na cena da questão e não são gravados nos GLBs. Os arquivos `lower-muscles-vastus-intermedius.glb` e `lower-muscles-soleus.glb` contêm as peças usadas na exposição dos músculos profundos. No sóleo, as cabeças do gastrocnêmio permanecem no GLB e são retraídas na cena. `upper-muscles-uncovered-base.glb` restaura as coberturas do ombro pelo botão “Mostrar peças removidas”, sem reintroduzir costelas, coluna ou cartilagens axiais. Para regenerar os cinco arquivos, execute `node scripts/bake-muscle-pieces.mjs`. O conjunto inclui bíceps braquial, tríceps braquial, supraespinal, infraespinal, redondo menor, subescapular, reto femoral, vasto lateral, vasto intermédio, vasto medial, gastrocnêmio e sóleo. As questões 29 e 30 do simulado e as novas denominações mostram a região montada com uma bandeirinha azul pequena presa ao músculo pedido. Cada músculo também recebe uma questão de identificação com seis marcadores circulares numerados na mesma região, em ordem sorteada. A peça mantém músculos vizinhos, ossos do membro e tendões em suas posições anatômicas, sem pele, fáscias de cobertura, vasos ou nervos. A coluna é removida das peças musculares; no membro superior também são removidos esterno (manúbrio, corpo e processo xifoide), sacro e cóccix. Costelas, cartilagens costais e cartilagens da coluna (anéis fibrosos, núcleos pulposos e superfícies articulares vertebrais) também são removidas pelos nomes dos nós, preservando as cartilagens das articulações do membro que compartilham o mesmo material. A escápula e os ossos do membro permanecem como referências; a clavícula e suas cartilagens articulares são removidas das duas peças musculares superiores. O subclávio, o ligamento costoclavicular, o ligamento interclavicular e a cápsula esternoclavicular também são retirados para não ficarem soltos após a remoção da clavícula e do tórax. A peça do membro inferior mantém os ossos do quadril como referências, retirando as vértebras lombares, o sacro e as cartilagens das superfícies articulares do sacro. Todas as perguntas musculares já abrem com a exposição preparada para o alvo, inclusive identificação. No ombro, a preparação remove deltoide, trapézio, peitorais, latíssimo do dorso e serrátil anterior para expor as estruturas pedidas. Para vasto intermédio, remove o reto femoral; para sóleo, afasta suavemente as duas cabeças do gastrocnêmio, preservando as extremidades e abrindo uma janela posterior. A marcação é fixada no sóleo dentro dessa janela, e a vista inicial enquadra a perna. As alternativas numéricas são ajustadas para não incluir os músculos removidos: sartório e tibial anterior podem entrar como distratores verificados no GLB. Na identificação do sóleo, as seis alternativas são sóleo, gastrocnêmio, tibial anterior, fibular longo, fibular curto e extensor longo dos dedos, todos presentes na perna. Nas preparações que removem músculos, “Mostrar peças removidas” restaura as coberturas e “Ocultar peças de cobertura” retorna à exposição preparada. A vista inicial procura um ângulo com o alvo visível, mantendo a região montada. Os números são fixados em um ponto da superfície, armazenado nas coordenadas do músculo. A escolha verifica faces expostas em várias direções e o espaço para a borda inteira do círculo, reduzindo seu tamanho nas superfícies estreitas; pontos encobertos por outras peças não são usados como alternativa. Ao selecionar um número na lista ou na peça, a câmera faz uma transição suave para centralizar o músculo e mostrar a face marcada, enquadrando todas as suas cabeças e mantendo as estruturas vizinhas. Arrastar ou usar a rolagem interrompe a transição; selecionar o mesmo número novamente refaz o foco. O ponto permanece o mesmo ao girar, aproximar ou selecionar uma resposta; os números são planos circulares na cena 3D, alinhados à face do músculo. Eles inclinam junto com a superfície e ficam ocultos quando a face está voltada para trás ou coberta por outra peça, com profundidade e descarte de faces posteriores tratados pelo renderizador. Discos e meniscos roxos e bursas amarelas transparentes são removidos das peças de prática muscular.

O catálogo `src/muscles.ts` associa os nomes dos nós GLB aos alvos das perguntas. Como os músculos compartilham materiais, o carregador cria materiais com identificadores anatômicos preservando suas texturas. Cabeças do bíceps, tríceps e gastrocnêmio permanecem juntas como um único músculo, e a massinha procura uma superfície visível do conjunto. Temporal, masseter, diafragma e reto do abdome não estão nos arquivos locais e continuam com enunciados descritivos. Questões de completar e diferenciação mantêm seu formato.

## Correção dos nomes anatômicos

A correção distingue nome completo correto (verde), nome específico incompleto (amarelo) e resposta incorreta (vermelho). Respostas incompletas não contam como acerto e mostram o nome completo esperado, inclusive na revisão do teste. Nomes completos do roteiro, incluindo os nomes numerados de C1/C2/C7 e os sinônimos interparietal/frontoparietal, são aceitos. Mandíbula, C7 e nomes musculares abreviados recebem o mesmo critério na prática original e no simulado. Nas listas, componentes reconhecidos com nomes incompletos recebem amarelo; componentes trocados, repetidos ou ausentes continuam incorretos. Cada pergunta pode declarar `incompleteAccepted` com os nomes curtos que identificam sua estrutura; palavras genéricas e trechos arbitrários não recebem amarelo. Por exemplo, “cervical” é incompleto para “vértebra cervical típica”, enquanto “vértebra” é incorreto.

A normalização aceita “m.” no lugar de “músculo” e “Mm.” no lugar de “músculos”, mantendo a distinção entre singular e plural. Acentuação, capitalização, espaços extras e pontuação final continuam sendo desconsiderados. As questões musculares do simulado usam essas mesmas regras.

Execute `node --test scripts/test-answers.mjs` para verificar a correção dos nomes, os casos incompletos e as abreviações musculares.

## Simulado de 70 questões

As questões do arquivo `simulado_anatomia_completo_70_questoes.txt` estão em `src/simuladoPart1.ts`, `src/simuladoPart2.ts` e `src/simuladoPart3.ts`. IDs `simulado-1` a `simulado-70` e `sourceNumber` preservam a referência ao original. Os filtros e sorteios incluem as novas perguntas; a quantidade de questões é configurável, limitada ao banco disponível.

Dezesseis questões do simulado usam os modelos existentes: crânio natural, vértebras cervicais e regiões do esqueleto (`overview-skeleton.glb`). No teste prático, úmero, rádio, ulna, fêmur, patela, tíbia e fíbula aparecem como peças isoladas. As visualizações regionais continuam disponíveis no código para conjuntos que exigirem contexto. As vértebras continuam isoladas para estudo da peça. As demais são escritas, sem dependência do visualizador. Estruturas sem alvo individual verificado, como ligamentos, músculos ausentes dos arquivos locais e acidentes ósseos, usam o enunciado descritivo.

Respostas com várias lacunas aceitam ponto e vírgula, vírgula ou “e” como separador. A ordem é exigida quando determina a associação, como C1/C2 ou tíbia/fíbula. Listas de componentes do manguito rotador, do disco, das meninges, do tronco encefálico e dos ramos do isquiático aceitam qualquer ordem. Os dois nomes da articulação do quadril também podem ser invertidos. A questão 51 aceita qualquer músculo do manguito. A questão 10 descreve corretamente o braço entre ombro e cotovelo; as questões 61–63 usam lacunas para permitir correção objetiva. A questão 69 foi esclarecida para pedir os dois ramos terminais do isquiático, tibial e fibular comum, pois o original não identifica um único nervo.

Nas lacunas que pedem nomes musculares, o enunciado não fornece “músculo” antes da lacuna. A resposta exige o nome completo, aceitando “Músculo” ou “M.” para cada músculo. Na lista do manguito rotador, “Músculos” ou “Mm.” pode prefixar a lista inteira. Nomes individuais sem o prefixo recebem classificação incompleta e não contam como acerto.

## Apresentação de prova prática

Questões de denominação com alvo 3D usam “Denomine a estrutura marcada”, título neutro no visualizador e um pequeno volume azul sobre a superfície da peça, simulando massinha. O contorno de toda a estrutura foi removido dessas questões. A descrição original aparece apenas depois da resposta. O simulado prioriza ossos isolados nos membros e vértebras; estruturas bilaterais isoladas usam a peça direita quando disponível. Os ossos do crânio permanecem juntos no crânio natural, como nas peças usadas em aula, com massinha azul na estrutura pedida. Conjuntos já utilizados para crânio e esterno permanecem nas questões originais, e as questões de seleção por número mantêm suas alternativas.

Nas questões com peça isolada, o botão “Mostrar estruturas vizinhas” acrescenta no máximo duas estruturas, mantendo suas posições anatômicas. “Ocultar estruturas vizinhas” retorna à peça isolada. A marca azul permanece no alvo, sem mostrar os nomes das estruturas. A dica começa oculta em cada questão; o crânio montado não recebe esse botão. Os vizinhos são definidos em `src/practicalHints.ts`.

A massinha é posicionada sobre a primeira superfície visível da estrutura, com pequeno afastamento ao longo da normal para não ficar enterrada no osso. Os alvos laterais do crânio começam com uma vista lateral oblíqua. Peças isoladas começam com a câmera à altura da peça, e o centro de rotação coincide com o centro exato do conjunto visível.

As lacunas são campos editáveis dentro da própria frase. Cada campo recebe um termo, sem exigir separadores digitados. Todos os campos precisam estar preenchidos para conferir a resposta. A ordem só é exigida nas associações com posições ou estruturas específicas, como atlas/áxis para C1/C2 e medial/lateral para tíbia/fíbula.

Apenas questões de denominação das peças isoladas de úmero, ulna, rádio e fíbula usam rotação livre por trackball com um dedo ou botão esquerdo do mouse, incluindo quando sua dica está aberta. Crânio, vértebras, outros ossos, identificação por números e exploração mantêm a órbita original. O movimento pode combinar os eixos e inclinar a peça na tela; arrastos próximos às bordas facilitam essa inclinação. Pinça, pan com dois dedos, Ctrl + arrasto e rolagem continuam a cargo do Babylon. O reset restaura também o eixo vertical da câmera. Os testes em `scripts/test-isolated-bones.mjs` cobrem o pivô, a distância, a inclinação e a separação entre um e dois toques.

## Layout de estudo

A tela inicial concentra os filtros do teste e o acesso à base de perguntas, sem a imagem decorativa do crânio. Nas questões práticas, a peça ocupa a área principal; em telas grandes, a resposta e a dica ficam ao lado, e no celular aparecem abaixo da visualização.

O atlas usa um seletor de modelo compacto e controles sobre a visualização. Tela cheia, pintura, ajuda de gestos, reset e zoom permanecem acessíveis. O enquadramento inicial ajusta os limites da peça à proporção da tela. Na tela cheia, Escape sai da visualização e o foco retorna ao botão de expansão. As regras de altura da visualização normal não se aplicam ao fullscreen, que ocupa toda a altura disponível também em tablets na vertical.

Nas questões de denominação de músculos, o marcador é uma bandeirinha azul com haste branca, dimensionada pelo músculo e fixada à superfície. As questões de denominação de ossos mantêm a massinha, e a identificação muscular mantém os números circulares.

## Modelos disponíveis no Explorar 3D

O seletor de modelos oferece as 12 visualizações-base, incluindo os modelos usados nas perguntas: crânios, coluna completa, coluna cervical, vértebras separadas, tórax, esqueleto, ossos dos membros e peças musculares preparadas. O seletor “Peça ou camada” permite abrir os conjuntos, ossos isolados e peças com estruturas vizinhas das perguntas, alternar as coberturas do membro superior e expor o vasto intermédio ou o sóleo no membro inferior. Essas opções são definidas em `src/exploration.ts`, reutilizando as peças da base de questões e os mesmos GLBs preparados. Na exploração, tocar nas estruturas mostra o nome e permite pintá-las; os marcadores de prova são omitidos. Os seletores também ficam disponíveis em tela cheia.
