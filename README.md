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

## Prática do crânio

A tela inicial oferece uma prática de cinco questões: duas de identificação com pontos no modelo 3D, duas de denominação de ossos destacados e uma de completar a frase. Cada resposta recebe correção e explicação; ao terminar, é possível revisar as respostas e refazer a prática. As respostas escritas aceitam diferenças de acentuação e capitalização.

O banco de perguntas está em `src/questions.ts` e segue o catálogo do projeto. Para esta primeira versão, a denominação usa o destaque no modelo 3D em vez de uma imagem estática. O progresso fica em memória durante a sessão e reinicia ao recarregar a página.

O estilo usa Tailwind CSS com o plugin oficial do Vite. O modo de exploração mantém as três aparências do crânio e a seleção de ossos no modo natural.

A abertura de Praticar usa uma imagem estática do crânio. O atlas 3D aparece entre o enunciado e as respostas nas questões de identificação e denominação; as questões de completar a frase e os resultados dispensam o modelo. Nas questões de identificação, clicar no osso seleciona seu número, assim como clicar no marcador ou na alternativa.
