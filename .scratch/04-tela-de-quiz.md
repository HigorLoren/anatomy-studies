# Modularizar tela de quiz

## Escopo
- Extrair `QuizScreen` e dividir sua apresentação em `ProgressBar`, `MarkerPicker`, `QuestionInput` e `AnswerFeedback` quando aplicável.
- Manter o formulário e o submit em um componente pequeno (`QuizForm` ou equivalente).
- Passar somente dados e callbacks já providos por `usePractice`.

## Fora do escopo
- Não mudar o banco de perguntas nem a API do Atlas.

## Aceite
- Os três tipos de questão funcionam; bloqueios por carregamento e por resposta conferida continuam iguais.
- Nenhum componente/função novo excede os limites do ESLint.
- `npm run typecheck` passa.
