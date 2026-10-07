# Conteúdo e correção para a P1

Referência principal: **09 Roteiro Unificado de Aula Prática - Anatomia Humana -
Avaliação (P1) - 2026-2.pdf**, disponível no material do professor em
`Anatomia Humana/Módulos AVA/anexos/`. Conferido em 07/10/2026.

Referências complementares: roteiros de aula prática dos sistemas esquelético,
articular, muscular e nervoso, além das aulas teóricas 03, 04 e 05 de 2026-2.

## Cobertura

O banco possui **151 questões**: as 115 existentes e **36 complementares**.
Os campos `p1Items` relacionam as questões às 92 entradas numeradas do roteiro.
Todas as entradas têm pelo menos uma questão associada; os componentes de um
conjunto também podem aparecer em questões de completar com várias lacunas.

O item 85 do PDF repete o lobo occipital do item 82. Ele não foi reinterpretado
como polo occipital. O roteiro específico do sistema nervoso inclui a ínsula;
a questão 48 do simulado se refere expressamente à lista do roteiro unificado.

| Parte do roteiro | Complemento ao banco anterior |
|---|---|
| Crânio | Parietal, occipital, nasal e maxilar em 3D; sutura lambdóidea e gonfoses por descrição |
| Tórax | Processo xifoide e composição do esterno |
| Cinturas e membros | Clavícula, escápula e osso do quadril em 3D; espinha da escápula e composição do quadril por descrição |
| Articulações | Sindesmoses radioulnar/tibiofibular, ombro, cotovelo e menisco lateral |
| Músculos | Oblíquos externo/interno, transverso do abdome, deltoide e glúteo máximo |
| SNC | Dura-máter encefálica, leptomeninge, medula espinal, cerebelo, diencéfalo, fissura longitudinal, lobos e polos frontal/temporal |
| SNP | Listas com os nomes dos três nervos do membro superior e dos quatro do membro inferior pedidos na P1 |

Essa cobertura serve para revisar os nomes e conceitos do roteiro. Questões
escritas não substituem o reconhecimento dessas estruturas em peças do
laboratório. Os novos alvos 3D usam materiais existentes e identificados nos
GLBs; acidentes ósseos e estruturas sem alvo confiável usam descrição escrita.

## Nomenclatura e avaliação

- Aceitar os nomes completos do roteiro e os sinônimos anatômicos explícitos:
  sutura sagital/interparietal e coronal/frontoparietal; os nomes completos e
  numerados de atlas, áxis e C7; vértebras sacrais/coccígeas e osso sacro/cóccix.
- Preservar o treino de nomes completos: “atlas”, “áxis”, “C7” e “mandíbula”
  recebem amarelo quando a questão pede a denominação completa usada no banco.
  O critério é o mesmo na prática original e no simulado.
- Exigir “Músculo” ou “M.” nos nomes musculares e aceitar “Músculos”/“Mm.”
  para a lista do manguito rotador. Um nome específico sem o prefixo recebe
  amarelo, sem pontuar; nomes de estruturas diferentes recebem vermelho.
- Listas completas podem variar de ordem quando o enunciado permite. Nas
  associações C1/C2, rádio/ulna e tíbia/fíbula, preservar a ordem das lacunas.
  Nomes incompletos reconhecidos recebem amarelo somente se todas as
  estruturas exigidas estiverem presentes, sem repetição e na associação certa.
- Manter a preferência por “Tendão do calcâneo”, aceitando “tendão calcâneo”
  e “tendão de Aquiles” como nomes equivalentes.
- Corrigir a descrição da mandíbula: ela é o próprio osso, e não o “principal
  osso da mandíbula”.

## Rótulos do atlas

Dentes são nomeados como dentes. Cartilagens costais são identificadas pelo
nome do nó anatômico, e não apenas pelo material compartilhado de textura.
As cartilagens articulares dos membros mantêm seu nome próprio.

Deltoide, glúteo máximo e outros músculos identificáveis pelos nós dos modelos
recebem seus nomes anatômicos, inclusive quando compartilham textura com
outros músculos. Uma peça sem nome mapeado aparece como “Músculo (nome não
identificado)”; isso não implica que ela esteja fora do roteiro do professor.

## Verificação

`node --test scripts/test-answers.mjs` verifica a correção, os nomes dos GLBs,
a cobertura de todas as entradas numeradas da P1 e a preservação dos IDs
anteriores. `npm run build` executa lint, TypeScript e o build de produção.


## Explicação anatômica no feedback

Após uma resposta incorreta ou incompleta, o feedback mostra “Entenda a
anatomia”. As sínteses em `src/anatomyExplanations.ts` são associadas pelos
itens da P1 e cobrem as 151 questões. Respostas corretas preservam o feedback
breve. A revisão aparece apenas depois da correção, sem antecipar o gabarito.

A base é o roteiro unificado e as aulas 02 (esquelético), 03 (articular),
04 (muscular) e 05 (nervoso), complementados pelos roteiros de aula prática.
As explicações usam localização, referências ósseas, camadas e distinções entre
estruturas; não são transcrições do professor. Os PDFs originais não são
publicados. O feedback público exibe somente a explicação anatômica, sem créditos,
nomes de aulas, datas ou referências aos materiais.

Questões sobre conjuntos recebem uma síntese única (neurocrânio, manguito
rotador ou quadríceps). Relações compartilhadas, como rádio/ulna e atlas/áxis,
não repetem parágrafos. Os testes conferem cobertura de todas as questões e
das 92 entradas do roteiro, consolidação de conjuntos e distinções anatômicas.
