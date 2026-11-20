using NPortugol.Ast;
using NPortugol.Runtime;

namespace NPortugol.RaioX.Analise;

/// <summary>Resultado de compilar o script: AST, assembly e mapa de linhas, ou o erro.</summary>
public sealed class Compilacao
{
    private Compilacao(AstNode? ast, Bytecode? bytecode, SourceLineMap? mapa, string? erro, CompilationException? erroDeCompilacao)
    {
        Ast = ast;
        Bytecode = bytecode;
        Mapa = mapa;
        Erro = erro;
        ErroDeCompilacao = erroDeCompilacao;
    }

    public AstNode? Ast { get; }

    public Bytecode? Bytecode { get; }

    public SourceLineMap? Mapa { get; }

    public string? Erro { get; }

    public CompilationException? ErroDeCompilacao { get; }

    public bool Sucesso => Erro is null;

    public static Compilacao De(string codigo)
    {
        try
        {
            // DebugInfo gera o SourceMap e faz a VM criar uma instrução para cada linha do
            // assembly (inclusive rótulos), de modo que índice de instrução = linha do assembly.
            var npc = new Npc { DebugInfo = true };
            var ast = npc.GerarAst(codigo);
            var bytecode = npc.Compilar(codigo);

            return new Compilacao(ast, bytecode, SourceLineMap.FromBytecode(bytecode), null, null);
        }
        catch (CompilationException e)
        {
            return new Compilacao(null, null, null, e.Message, e);
        }
        catch (Exception e)
        {
            return new Compilacao(null, null, null, "Erro interno do compilador: " + e.Message, null);
        }
    }
}
