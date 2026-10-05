# Reduzir complexidade do viewer Babylon

## Escopo
- Separar de `src/viewer.ts` as responsabilidades de marcadores projetados, exercício/destaques e carregamento do modelo em módulos locais.
- Manter `createViewer` como fachada e preservar sua API pública.
- Extrair helpers puros antes de criar classes/abstrações.

## Fora do escopo
- Não alterar assets, materiais ou comportamento da câmera.

## Aceite
- Carregamento, modelo natural, seleção de osso, marcadores e highlights continuam iguais.
- `viewer.ts` e seus módulos obedecem aos limites de linhas, complexidade e statements.
- `npm run lint && npm run typecheck` passam.
