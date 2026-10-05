# Extrair AtlasViewer

## Escopo
- Mover `Atlas` de `src/main.tsx` para `src/components/organisms/AtlasViewer.tsx`.
- Separar os blocos internos de carregamento, marcadores e controles para que nenhuma função exceda 120 linhas.
- Preservar a API de `createViewer` e o comportamento de seleção, reset e retry.

## Fora do escopo
- Não alterar Babylon nem o fluxo da prática.

## Aceite
- Atlas de exploração e de quiz têm o mesmo comportamento visual.
- `main.tsx` deixa de conter integração direta com canvas/Babylon.
- `npm run typecheck` passa.
