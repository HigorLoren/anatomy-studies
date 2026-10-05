# Anatomy Studies

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
Veja o índice da pesquisa em `research/` para continuar investigações.

## Banco de questões e testes

O banco contém 23 perguntas categorizadas por região (crânio, tórax e coluna vertebral) e tipo (identificação, denominação e completar a frase). Cada pergunta tem um identificador, respostas aceitas e explicação em `src/questions.ts`.

Na abertura, escolha região, tipo e um máximo de 5, 10, 15 ou 20 questões. O teste sorteia perguntas sem repetição, limitado à quantidade disponível e ao teto de 20. Combinações sem perguntas não permitem iniciar um teste. Progresso, pontuação e revisão usam apenas as perguntas sorteadas. Refazer o teste realiza um novo sorteio com os mesmos filtros.

A prática livre oferece o banco filtrável e permite abrir qualquer pergunta diretamente. Durante a prática livre, o seletor permite ir a qualquer questão, sem precisar responder às anteriores. Esse modo não gera resultado de teste. O progresso fica em memória durante a sessão.

As perguntas do tórax e da coluna usam `public/pectoral-back-thorax-bones-costal-cart.glb`. As oito perguntas cervicais (atlas, áxis, C7 e vértebra cervical típica) usam `public/overview-skeleton.glb`, pois essas estruturas não estão presentes no modelo do tórax. Na coluna, apenas os ossos vertebrais são exibidos. O banco cobre atlas, áxis, C7, vértebra cervical típica, torácica, lombar, sacro e cóccix; no tórax, cobre o corpo do esterno. Manúbrio e processo xifoide ainda precisam de alvos separados no modelo para receber perguntas 3D. O banco escrito complementar está em `docs/perguntas-torax-coluna.md`.

As respostas escritas aceitam diferenças de acentuação e capitalização. Nas questões de identificação, clicar no osso seleciona seu número, assim como clicar no marcador ou na alternativa. O modo de exploração mantém as três aparências do crânio e a seleção de ossos no modo natural.


## Correção dos nomes anatômicos

A correção distingue nome completo correto (verde), nome específico incompleto (amarelo) e resposta incorreta (vermelho). Respostas incompletas não contam como acerto e mostram o nome completo esperado, inclusive na revisão do teste. Cada pergunta pode declarar `incompleteAccepted` com os nomes curtos que identificam sua estrutura; palavras genéricas e trechos arbitrários não recebem amarelo. Por exemplo, “cervical” é incompleto para “vértebra cervical típica”, enquanto “vértebra” é incorreto.

A normalização aceita “m.” no lugar de “músculo” e “Mm.” no lugar de “músculos”, mantendo a distinção entre singular e plural. Acentuação, capitalização, espaços extras e pontuação final continuam sendo desconsiderados. Ainda não há perguntas musculares no banco; a regra já está disponível para elas.

Execute `node --test scripts/test-answers.mjs` para verificar a correção dos nomes, os casos incompletos e as abreviações musculares.
