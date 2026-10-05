# Extrair resultado e reduzir App

## Escopo
- Criar `ResultScreen` e o bloco de revisão de respostas.
- Deixar `App` apenas como composição de cabeçalho, layout, modo, modelo e telas.
- Remover código morto/imports após as extrações anteriores.

## Fora do escopo
- Não introduzir router, Context, Redux ou biblioteca de componentes.

## Aceite
- Placar, detalhes de cada resposta, reinício e ida para exploração continuam iguais.
- `src/main.tsx` fica dentro de 300 linhas e `App` dentro de 120 linhas.
- `npm run lint` não reporta `main.tsx`; `npm run typecheck` passa.
