# Roadmap do NPortugol

Este documento organiza a evolução do NPortugol em fases. Cada fase deixa o projeto
funcionando e com testes passando, e pode ser feita de forma independente das seguintes
(a ordem reflete dependências e retorno esperado).

## Onde estamos (novembro de 2026)

A migração para ANTLR 4 foi concluída e trouxe junto a modernização mínima do build:

- Gramáticas em `src/grammar/NPortugol.g4` e `src/grammar/ASM.g4` (ANTLR **4.13.2**; runtime
  C# `Antlr4.Runtime.Standard` 4.13.1, a versão mais recente no NuGet). Os parsers gerados
  ficam em `src/NPortugol/Generated` e são regenerados com `tools\antlr4\gerar.cmd`.
- A antiga tree grammar `NPortugolWalker.g` virou código C# (`AstBuilder` + `NPortugolWalker`),
  que emite **o mesmo assembly** que a versão ANTLR 3. Isso foi verificado comparando a saída
  dos dois compiladores num corpus de 50 scripts, incluindo os exemplos do TurboNPortugol.
- Bugs da versão ANTLR 3 que geravam código errado foram corrigidos:
  - o bloco `então` perdia comandos quando havia `senão`;
  - um `se` dentro de `repita` tinha a condição invertida;
  - num `repita` aninhado, a condição do laço externo saía invertida;
  - `para` com expressão no valor inicial gerava instruções vazias;
  - o segundo `selecione` de uma função empilhava um valor extra;
  - `[1..5]` sem espaços não era reconhecido.
- Erros de sintaxe agora lançam `CompilationException` com linha, coluna e trecho. Antes, o
  parser se recuperava em silêncio e gerava código inválido.
- O build passou para .NET Framework 4.8 e MSBuild do Visual Studio (`build.cmd`), com NuGet,
  NUnit 3 (`dotnet test`) e ILMerge 3.0.41. Há duas soluções com o mesmo conteúdo:
  `NPortugol.slnx` (VS 2026) e `NPortugol.sln` (formato do VS 2022). Quando o VS 2022 deixar de
  ser usado, o `.sln` pode ser removido.

## Fase 1: limpeza e automação do build

Objetivo: qualquer pessoa clona o repositório e compila e testa com um comando, localmente e
na integração contínua.

- Remover o legado que não é mais usado: `NPortugol-vs2008.sln`, `NPortugol.sln.cache`,
  `NPortugol.Web.csproj` (cópia antiga do `.2010`),
  `tools/msbuild35.exe`, `tools/msbuild40.exe`, `tools/nunit`, `tools/antlrworks-1.4.3.jar`.
- Trocar o MSBuild.Community.Tasks (2008) pelas tarefas nativas do MSBuild (`ZipDirectory`) e
  avaliar se o ILMerge ainda é necessário (o projeto está arquivado; alternativa: distribuir o
  `Npc` como zip com as DLLs ou como executável único do .NET 8, ver Fase 2).
- Integração contínua (GitHub Actions, `windows-latest`): build da solução e `dotnet test` a
  cada push e pull request.
- Padronizar codificação e fim de linha: converter os fontes em Latin-1 para UTF-8 e adicionar
  `.editorconfig` e `.gitattributes` (`* text=auto`). Hoje há arquivos Latin-1, UTF-8 com e sem
  BOM, e fins de linha mistos, o que corrompe acentos com facilidade.
- Fazer o `dotnet build` funcionar para a solução inteira, convertendo os projetos WinForms
  para o formato SDK (hoje só o MSBuild do Visual Studio compila os `.resx` deles).

## Fase 2: biblioteca multiplataforma e distribuição

Objetivo: usar o NPortugol a partir de .NET 8+ (Windows, Linux e macOS), não só do .NET
Framework.

- Fazer `NPortugol.csproj` compilar para `netstandard2.0` e `net48`. Pontos de atenção:
  - `ILTranslator` usa `DynamicMethod` (pacote `System.Reflection.Emit.Lightweight` no
    netstandard2.0, ou mover o tradutor para um projeto separado);
  - `BytecodeSerializer` usa `BinaryFormatter`, que está obsoleto, é inseguro e foi removido
    do .NET 9. Trocar por um formato próprio (o bytecode já é texto: basta gravar as linhas,
    as funções e o source map).
- Rodar os testes em `net48` e `net8.0`.
- Publicar o pacote NuGet `NPortugol` (README, ícone e licença no pacote).
- Corrigir a dependência de cultura: hoje números decimais são gerados e lidos com
  `float.Parse` da cultura atual. O assembly usa vírgula (`PUSH 2,5`), que só funciona em
  pt-BR. Em en-US, `2.5` vira `25`. Usar `CultureInfo.InvariantCulture` no emissor e no
  montador, e aceitar o formato antigo na leitura.

## Fase 3: tratamento de erros

Objetivo: quando algo der errado, o usuário (que muitas vezes está aprendendo a programar)
deve saber **o quê**, **onde** e, se possível, **como corrigir**.

### Diagnóstico atual

| Área | Situação |
|---|---|
| Compilador | Para no **primeiro** erro. A mensagem é sempre genérica ("Certifique-se de acentuar as palavras"), mesmo quando o problema é um `fim` faltando. |
| Assembly | O montador de ASM é tolerante: erros de sintaxe ficam em `AntlrRunnableBuilder.Errors`, mas ninguém os consulta. |
| Execução | 27 `throw new Exception("...")` na solução, 17 deles na biblioteca (`Executor`, `ModuloPadrao`, `Runnable`, `Hospedagem`...), sem tipo específico e sem a linha do script, embora o compilador gere um source map. |
| Hosts | O `Npc.exe` captura tudo e mostra "Erro: programa inválido" (escondendo a causa real). O GrammarIDE mostra "Putz... Erro não identificado". Há 10 `catch (Exception)` genéricos nas ferramentas. |
| Funções hospedadas | Uma exceção em código C# registrado via `Hospedagem` sobe crua, sem dizer qual função do script a chamou. |

### Propostas, da mais simples para a mais estrutural

1. **Hierarquia de exceções.** Criar uma base `NPortugolException` com três filhas:
   `CompilationException` (já existe), `ExecutionException` (função, instrução e linha do
   fonte) e `HostFunctionException` (envolve a exceção do código C# em `InnerException`).
   Substituir os `throw new Exception` por elas. Assim, quem hospeda o NPortugol pode tratar
   cada caso.
2. **Hosts que mostram o erro real.** O `Npc.exe` deve imprimir mensagem, linha e coluna e
   sair com código diferente de zero. O GrammarIDE e o TurboNPortugol devem posicionar o
   cursor e destacar a linha usando `CompilationException.Line` e `Column`. O handler web deve
   mostrar uma página de erro amigável em modo debug.
3. **Montador de ASM estrito.** O assembly gerado pelo compilador nunca tem erros. Os únicos
   erros possíveis vêm de ASM escrito à mão (inclusive blocos `# ... #` no script). Fazer
   `Motor.Load` falhar quando `Errors` não estiver vazio e reportar blocos `#` inválidos como
   erro de compilação na linha do script.
4. **Mensagens úteis em português.** Criar uma estratégia de erro própria
   (`DefaultErrorStrategy` do ANTLR 4) que sobrescreva `ReportMissingToken`,
   `ReportInputMismatch` e `ReportNoViableAlternative`, e uma pilha de contexto (a gramática
   ANTLR 3 já tentava isso com `paraphrases`, nunca concluído). Exemplos de alvo:
   - `Faltou 'fim' para fechar o 'se' aberto na linha 3.`
   - `'funcao' não é uma palavra da linguagem. Você quis dizer 'função'?` (detectar as
     palavras-chave sem acento: `funcao`, `variavel`, `entao`, `senao`, `ate`)
   - `Esperado ')' na chamada de 'soma'.`
5. **Vários erros por compilação.** Em vez de parar no primeiro, coletar uma lista de
   diagnósticos com severidade, código (`NP0001`...), mensagem, linha, coluna e comprimento.
   API sugerida: `Npc.Analisar(script)` devolve `{ Bytecode, Diagnosticos }`, mantendo
   `Compilar` (que lança exceção) para compatibilidade. Com a estratégia de recuperação do
   ANTLR 4 isso sai quase de graça, e é a base para um editor com sublinhado de erros
   (Fase 5).
6. **Análise semântica** entre a AST e a emissão: variável não declarada, função inexistente
   (aviso, pois pode ser hospedada), número de argumentos diferente da declaração, declaração
   duplicada. Hoje esses erros só aparecem (quando aparecem) durante a execução.
7. **Erros de execução com posição no fonte.** Sempre gerar o source map (o custo é baixo) e,
   ao capturar um erro no `RuntimeContext`, informar a linha e a pilha de chamadas do script,
   por exemplo `Divisão por zero na linha 12 (em fatorial, chamada na linha 4 de principal)`.
8. **Testes de mensagens.** Um conjunto de scripts com erros comuns e a mensagem esperada de
   cada um, para que as mensagens não regridam.

Sugestão de ordem: 1, 2 e 3 são rápidos e já melhoram muito a experiência. 4 e 5 são o
coração da melhoria. 6 e 7 exigem mais trabalho, mas completam o quadro.

## Fase 4: linguagem

Limitações conhecidas que hoje geram erro de compilação ou comportamento inesperado:

- Operadores `e` e `ou` (hoje rejeitados com erro claro; antes geravam código truncado).
  Exige precedência própria na gramática: hoje todos os operadores lógicos e de comparação
  têm a mesma precedência.
- Menos unário (`x = -1` é erro de sintaxe).
- Chamada de método de objeto hospedado (`p.calcular(1)`) empilha os argumentos mas não emite
  a chamada (`Emissor.EmitMethodCall` está vazio).
- `para i = 0 até 2` executa com i = 0 e 1 (o limite é exclusivo). Decidir se é a semântica
  desejada; mudar quebra scripts existentes.
- Identificadores com acento (`ação = 1`) não são aceitos.
- Literal `nulo` (hoje é tratado como uma variável chamada `nulo`).

## Fase 5: ferramentas

Objetivo: trocar os apps WinForms por ferramentas que funcionem em qualquer máquina, sem
instalação, com a inteligência do editor escrita uma única vez.

Os apps atuais são pequenos (cerca de 5 mil linhas somadas, incluindo o código do designer),
então reescrever sai mais barato do que portar tela a tela. Até lá eles continuam funcionando
no .NET Framework 4.8; não vale investir em migrá-los para WinForms sobre .NET 8.

Pré-requisitos: a Fase 2 (as opções abaixo exigem .NET moderno) e o item 5 da Fase 3 (vários
diagnósticos por compilação, para sublinhar erros enquanto se digita).

1. **Serviço de linguagem (`NPortugol.LanguageService`).** Uma biblioteca com diagnósticos,
   autocompletar (palavras-chave, variáveis e funções do script, funções dos módulos
   instalados), símbolos e "ir para definição". É a base dos itens seguintes.
2. **Playground web**, substituto do TurboNPortugol. Blazor WebAssembly executa o compilador
   e a VM em C# dentro do navegador, sem servidor. O editor é o Monaco (o do VS Code), via
   `BlazorMonaco`, com realce, autocompletar e erros vindos do serviço de linguagem.
   - Hospedagem estática gratuita (GitHub Pages, junto do site do projeto).
   - Funciona em Windows, Linux, Chromebook e tablet. Com PWA, também offline.
   - Exemplos prontos (os de `TurboNPortugol/Exemplos`) e compartilhamento de programas por
     link.
   - Funções de entrada e saída (`imprima`, `leia`) como módulo próprio do playground.
   - Atenção: o primeiro carregamento baixa o runtime .NET (alguns MB, depois fica em
     cache), e não há `Reflection.Emit` no navegador (afeta só o `ILTranslator`).
3. **Modo avançado no playground**, substituto do GrammarIDE: visualização da AST (desenhada
   no navegador, sem depender do Graphviz) e execução passo a passo mostrando o assembly, a
   pilha e as variáveis. Para depurar as gramáticas, usar a extensão ANTLR4 do VS Code, que já
   mostra a árvore sintática e as ambiguidades a partir dos arquivos `.g4`.
4. **Extensão para VS Code**, com um servidor LSP sobre o serviço de linguagem, para quem já
   usa um editor de verdade.
5. **App desktop com Avalonia e AvaloniaEdit**, só se houver demanda real por um app offline
   instalado. Roda em Windows, Linux e macOS e reaproveita o serviço de linguagem.
6. Aposentar GrammarIDE e TurboNPortugol quando o playground cobrir o que eles fazem.

Fora do desktop, `NPortugol.Web` deve ganhar um middleware ASP.NET Core além do `IHttpHandler`
do System.Web.
