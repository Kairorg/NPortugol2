using NPortugol.Ast;

namespace NPortugol.RaioX.Analise;

/// <summary>Trecho do código (linhas e colunas base 1, coluna final exclusiva).</summary>
public sealed record Trecho(int Linha1, int Coluna1, int Linha2, int Coluna2);

public sealed record NoDesenhado(
    int Id,
    string Texto,
    string Classe,
    string Descricao,
    double X,
    double Y,
    double Largura,
    int? IdPai,
    Trecho? Trecho);

public sealed record ArvoreDesenhada(IReadOnlyList<NoDesenhado> Nos, double Largura, double Altura);

/// <summary>
/// Posiciona os nós da AST para desenho em SVG: cada subárvore ocupa a largura dos filhos lado a
/// lado, e o pai fica centralizado sobre eles.
/// </summary>
public static class LayoutDaArvore
{
    public const double AlturaNo = 28;
    private const double DistanciaVertical = 64;
    private const double Espaco = 10;
    private const double Margem = 16;

    public static ArvoreDesenhada Calcular(AstNode raiz)
    {
        var larguras = new Dictionary<AstNode, double>();
        MedirSubarvore(raiz, larguras);

        var nos = new List<NoDesenhado>();
        var profundidadeMaxima = 0;
        Posicionar(raiz, Margem, 0, null, larguras, nos, ref profundidadeMaxima);

        return new ArvoreDesenhada(
            nos,
            larguras[raiz] + 2 * Margem,
            Margem * 2 + profundidadeMaxima * DistanciaVertical + AlturaNo);
    }

    public static double LarguraDoNo(string texto) => Math.Max(40, texto.Length * 7.6 + 20);

    private static double MedirSubarvore(AstNode no, Dictionary<AstNode, double> larguras)
    {
        var filhos = no.Children.Sum(f => MedirSubarvore(f, larguras)) + Espaco * Math.Max(0, no.ChildCount - 1);
        var largura = Math.Max(LarguraDoNo(no.Text), filhos);

        larguras[no] = largura;
        return largura;
    }

    // Devolve a coordenada X do centro do nó.
    private static double Posicionar(AstNode no, double esquerda, int profundidade, int? idPai,
                                     Dictionary<AstNode, double> larguras, List<NoDesenhado> nos, ref int profundidadeMaxima)
    {
        profundidadeMaxima = Math.Max(profundidadeMaxima, profundidade);

        var id = nos.Count;
        nos.Add(null!); // reserva a posição; o nó é preenchido depois de posicionar os filhos

        double centro;

        if (no.ChildCount == 0)
        {
            centro = esquerda + larguras[no] / 2;
        }
        else
        {
            var larguraFilhos = no.Children.Sum(f => larguras[f]) + Espaco * (no.ChildCount - 1);
            var x = esquerda + (larguras[no] - larguraFilhos) / 2;
            double primeiro = 0, ultimo = 0;

            for (var i = 0; i < no.ChildCount; i++)
            {
                var filho = no.GetChild(i);
                var centroFilho = Posicionar(filho, x, profundidade + 1, id, larguras, nos, ref profundidadeMaxima);

                if (i == 0) primeiro = centroFilho;
                ultimo = centroFilho;
                x += larguras[filho] + Espaco;
            }

            centro = (primeiro + ultimo) / 2;
        }

        nos[id] = new NoDesenhado(
            id,
            no.Text,
            Classe(no),
            Descricao(no),
            centro,
            Margem + profundidade * DistanciaVertical,
            LarguraDoNo(no.Text),
            idPai,
            TrechoDe(no));

        return centro;
    }

    private static string Classe(AstNode no) => no.Kind switch
    {
        _ when no.IsImaginary => "estrutura",
        AstKind.Operator => "operador",
        AstKind.Id => "identificador",
        _ => "literal",
    };

    private static string Descricao(AstNode no) => no.Kind switch
    {
        AstKind.Script => "Programa: uma função por filho",
        AstKind.Func => "Declaração de função: nome, parâmetros e bloco",
        AstKind.Param => "Parâmetros da função",
        AstKind.Var => "Declaração de variáveis (variável)",
        AstKind.Call => "Chamada de função: nome e argumentos",
        AstKind.Asgn => "Atribuição",
        AstKind.Arg => "Lista de argumentos",
        AstKind.Lexp => "Condição",
        AstKind.Ret => "retorne",
        AstKind.Slist => "Bloco de comandos",
        AstKind.Jmp => "se ... fim",
        AstKind.Sjmp => "se ... senão ... fim (o último bloco é o senão)",
        AstKind.Loop => "Laço: para, enquanto ou repita",
        AstKind.Dec => "decrescente",
        AstKind.Ar => "Índice do vetor que recebe o valor",
        AstKind.Index => "Acesso a vetor: índice e vetor",
        AstKind.Ilist => "Lista de valores { ... }",
        AstKind.Mcall => "Chamada de método de objeto",
        AstKind.Pcall => "Leitura de propriedade de objeto",
        AstKind.Asm => "Assembly embutido (# ... #)",
        AstKind.Sel => "selecione: valor e casos",
        AstKind.Case => "caso: valor e comandos",
        AstKind.Operator => "Operador",
        AstKind.Id => "Identificador",
        AstKind.Int => "Número inteiro",
        AstKind.Float => "Número decimal",
        AstKind.String => "Texto",
        AstKind.True or AstKind.False => "Valor lógico",
        _ => no.Kind.ToString(),
    };

    // Do primeiro ao último token real da subárvore (nós imaginários não têm posição própria).
    private static Trecho? TrechoDe(AstNode no)
    {
        AstNode? primeiro = null, ultimo = null;

        foreach (var token in Tokens(no))
        {
            if (primeiro is null || Antes(token, primeiro)) primeiro = token;
            if (ultimo is null || Antes(ultimo, token)) ultimo = token;
        }

        if (primeiro is null || ultimo is null) return null;

        return new Trecho(primeiro.Line, primeiro.Column + 1, ultimo.Line, ultimo.Column + 1 + ultimo.Text.Length);
    }

    private static IEnumerable<AstNode> Tokens(AstNode no)
    {
        if (!no.IsImaginary) yield return no;

        foreach (var filho in no.Children)
            foreach (var token in Tokens(filho))
                yield return token;
    }

    private static bool Antes(AstNode a, AstNode b) => a.Line < b.Line || (a.Line == b.Line && a.Column < b.Column);
}
