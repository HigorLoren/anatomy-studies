# Extrair cabeçalho, introdução e exploração

## Escopo
- Criar `AppHeader`, `IntroScreen` e `ExploreScreen`.
- Mover o seletor de modelo para `ModelPicker` somente se ele continuar duplicado ou simplificar a tela.
- Manter `App` como dono de `mode`, `model` e das callbacks de navegação.

## Fora do escopo
- Não mover estado de quiz nem alterar textos/design.

## Aceite
- Navegação Praticar/Explorar, início da prática e troca de modelo continuam iguais.
- Cada tela fica em arquivo próprio.
- `npm run typecheck` passa.
