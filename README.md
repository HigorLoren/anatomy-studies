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
