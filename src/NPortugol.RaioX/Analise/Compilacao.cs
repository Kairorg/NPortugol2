using Antlr4.Runtime;
using Antlr4.Runtime.Misc;
using NPortugol.Ast;
using NPortugol.Runtime;
using NPortugol.Runtime.Asm;

namespace NPortugol.RaioX.Analise;

/// <summary>Linguagem do código no editor.</summary>
public enum Linguagem { NPortugol, Assembly }

/// <summary>Função do programa, para a estrutura na barra lateral.</summary>
public sealed record FuncaoDoPrograma(string Nome, string Parametros, int Linha);

/// <summary>
/// Resultado de compilar o script (ou montar o assembly): AST, assembly e mapa de linhas, ou o erro.
/// </summary>
public sealed class Compilacao
{
    private Compilacao(Linguagem linguagem, AstNode? ast, Bytecode? bytecode, MapaDeLinhas? mapa,
                       IReadOnlyList<FuncaoDoPrograma>? funcoes, string? erro, CompilationException? erroDeCompilacao)
    {
        Linguagem = linguagem;
        Ast = ast;
        Bytecode = bytecode;
        Mapa = mapa;
        Funcoes = funcoes ?? Array.Empty<FuncaoDoPrograma>();
        Erro = erro;
        ErroDeCompilacao = erroDeCompilacao;
    }

    public Linguagem Linguagem { get; }

    /// <summary>A árvore sintática; só existe para código NPortugol.</summary>
    public AstNode? Ast { get; }

    public Bytecode? Bytecode { get; }

    public MapaDeLinhas? Mapa { get; }

    public IReadOnlyList<FuncaoDoPrograma> Funcoes { get; }

    public string? Erro { get; }

    public CompilationException? ErroDeCompilacao { get; }

    public bool Sucesso => Erro is null;

    public static Compilacao De(string codigo, Linguagem linguagem) =>
        linguagem == Linguagem.Assembly ? DeAssembly(codigo) : DeNPortugol(codigo);

    private static Compilacao DeNPortugol(string codigo)
    {
        try
        {
            // DebugInfo gera o SourceMap e faz a VM criar uma instrução para cada linha do
            // assembly (inclusive rótulos), de modo que índice de instrução = linha do assembly.
            var npc = new Npc { DebugInfo = true };
            var ast = npc.GerarAst(codigo);
            var bytecode = npc.Compilar(codigo);

            var funcoes = ast.Children
                .Select(f => new FuncaoDoPrograma(
                    f.GetChild(0).Text,
                    string.Join(", ", f.Children.Where(c => c.Kind == AstKind.Param).SelectMany(p => p.Children).Select(p => p.Text)),
                    f.GetChild(0).Line))
                .ToList();

            return new Compilacao(Linguagem.NPortugol, ast, bytecode, MapaDeLinhas.De(SourceLineMap.FromBytecode(bytecode)),
                                  funcoes, null, null);
        }
        catch (CompilationException e)
        {
            return Falha(Linguagem.NPortugol, e);
        }
        catch (Exception e)
        {
            return Falha(Linguagem.NPortugol, "Erro interno do compilador: " + e.Message);
        }
    }

    /// <summary>
    /// Monta o assembly escrito pelo usuário. Ao contrário do carregador da VM, que é tolerante e
    /// descarta linhas malformadas, aqui o primeiro erro é informado com a linha e a coluna.
    /// </summary>
    /// <remarks>
    /// Cada linha útil (função, rótulo ou instrução) vira uma linha do bytecode. Com DebugInfo, a
    /// VM cria uma instrução para cada uma delas, então o índice da instrução é o índice da linha
    /// útil, e o mapa liga esse índice à linha do editor (linhas vazias e comentários ficam de fora).
    /// </remarks>
    private static Compilacao DeAssembly(string codigo)
    {
        try
        {
            var entrada = CharStreams.fromString(codigo);
            var lexer = new ASMLexer(entrada);
            lexer.RemoveErrorListeners();
            lexer.AddErrorListener(ThrowingErrorListener.Instance);

            var parser = new ASMParser(new CommonTokenStream(lexer));
            parser.RemoveErrorListeners();
            parser.AddErrorListener(ThrowingErrorListener.Instance);

            ASMParser.LineContext[] linhas;
            try
            {
                linhas = parser.script().line();
            }
            catch (CompilationException e)
            {
                // A mensagem do compilador fala em acentuar palavras, o que não faz sentido aqui.
                var dica = e.OffendingText == "."
                    ? " O ponto só aparece na declaração do rótulo (.fim); nos saltos, escreva JMP fim."
                    : "";
                throw new CompilationException(
                    $"Erro na linha {e.Line} posição {e.Column}: '{e.OffendingText}' não era esperado aqui.{dica}",
                    e.Line, e.Column, e.OffendingText);
            }

            var script = new List<string>();
            var mapa = new List<int?>();
            var funcoes = new List<FuncaoDoPrograma>();
            var rotulos = new HashSet<string>();
            var saltos = new List<(string Rotulo, IToken Token)>();
            List<string>? parametros = null;

            foreach (var linha in linhas)
            {
                var texto = entrada.GetText(Interval.Of(linha.Start.StartIndex, linha.Stop.StopIndex))
                    .Replace('\r', ' ').Replace('\n', ' ');
                script.Add(texto);

                if (linha.func() is { } func)
                {
                    var nome = func.ID().GetText();
                    if (funcoes.Any(f => f.Nome == nome))
                        throw ErroEm($"A função '{nome}' já foi declarada.", func.Start);

                    funcoes.Add(new FuncaoDoPrograma(nome, "", func.Start.Line));
                    parametros = new List<string>();
                    mapa.Add(null);
                }
                else if (linha.label() is { } rotulo)
                {
                    var nome = rotulo.ID().GetText();
                    if (!rotulos.Add(nome))
                        throw ErroEm($"O rótulo '.{nome}' já foi declarado.", rotulo.Start);

                    parametros = null;
                    mapa.Add(null);
                }
                else
                {
                    if (linha.instruction() is ASMParser.OneOperandContext um)
                    {
                        if (um.op.Text.StartsWith('J'))
                            saltos.Add((um.operand().GetText(), um.operand().Start));

                        // O prólogo da função recebe os parâmetros com pares DCL x / POP x.
                        if (parametros is not null && um.op.Type == ASMLexer.DCL)
                            parametros.Add(um.operand().GetText());
                        else if (parametros is not null && um.op.Type == ASMLexer.POP && parametros.Count > 0
                                 && parametros[^1] == um.operand().GetText())
                            funcoes[^1] = funcoes[^1] with { Parametros = string.Join(", ", parametros) };
                        else
                            parametros = null;
                    }
                    else
                    {
                        parametros = null;
                    }

                    mapa.Add(linha.Start.Line);
                }
            }

            foreach (var (rotulo, token) in saltos)
                if (!rotulos.Contains(rotulo))
                    throw ErroEm($"O rótulo '.{rotulo}' não existe.", token);

            if (!funcoes.Any(f => f.Nome == Function.MainName))
                throw new CompilationException(
                    $"O assembly precisa de uma função '{Function.MainName}:', por onde a execução começa.", 0, 0, null);

            // Confere que a VM monta exatamente uma instrução por linha, como o mapa supõe.
            var montador = new AsmProgramBuilder { DebugInfo = true };
            var instrucoes = montador.Build(string.Join("\n", script));
            if (montador.Errors.Count > 0 || instrucoes.Count != script.Count)
                return Falha(Linguagem.Assembly, "Erro interno do montador: " + string.Join("; ", montador.Errors));

            return new Compilacao(Linguagem.Assembly, null, new Bytecode(script), MapaDeLinhas.De(mapa), funcoes, null, null);
        }
        catch (CompilationException e)
        {
            return Falha(Linguagem.Assembly, e);
        }
        catch (Exception e)
        {
            return Falha(Linguagem.Assembly, "Erro interno do montador: " + e.Message);
        }
    }

    private static CompilationException ErroEm(string mensagem, IToken token) =>
        CompilationException.Unsupported(mensagem, token.Line, token.Column, token.Text);

    private static Compilacao Falha(Linguagem linguagem, CompilationException e) =>
        new(linguagem, null, null, null, null, e.Message, e);

    private static Compilacao Falha(Linguagem linguagem, string mensagem) =>
        new(linguagem, null, null, null, null, mensagem, null);
}
