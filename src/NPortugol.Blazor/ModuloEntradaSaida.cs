using System.Text;
using NPortugol.Runtime.Exceptions;
using NPortugol.Runtime.Interop;

namespace NPortugol.Blazor;

/// <summary>
/// Funções de entrada e saída dos sites, com os mesmos nomes do ConsoleModulo do Npc.
/// A saída vai para um buffer e o <c>leia()</c> consome as linhas do campo "Entrada",
/// porque o navegador não pode bloquear esperando o teclado.
/// </summary>
/// <remarks>
/// Um host que executa passo a passo (o Raio-X) pode parar antes de um <c>leia()</c> quando
/// <see cref="LinhasPendentes"/> é zero, pedir o valor ao usuário e entregá-lo com <see cref="Fornecer"/>.
/// </remarks>
public sealed class ModuloEntradaSaida : IModulo
{
    private readonly StringBuilder saida = new();
    private readonly Queue<string> entrada;

    public ModuloEntradaSaida(string? entrada)
    {
        var linhas = (entrada ?? string.Empty).Replace("\r\n", "\n").Split('\n');

        // Ignora a linha vazia que sobra quando o texto termina com quebra de linha.
        var quantidade = linhas.Length > 0 && linhas[^1].Length == 0 ? linhas.Length - 1 : linhas.Length;

        this.entrada = new Queue<string>(linhas.Take(quantidade));

        Functions = new Dictionary<string, Func<object[], object>>
        {
            { "imprima", Imprima },
            { "imprimaLinha", ImprimaLinha },
            { "imprimaVetor", ImprimaVetor },
            { "leia", Leia },
        };
    }

    public Dictionary<string, Func<object[], object>> Functions { get; }

    public string Saida => saida.ToString();

    /// <summary>Linhas de entrada que ainda não foram lidas.</summary>
    public int LinhasPendentes => entrada.Count;

    /// <summary>
    /// Acrescenta uma linha à entrada, digitada pelo usuário durante a execução. Ela é ecoada na
    /// saída, como num terminal.
    /// </summary>
    public void Fornecer(string linha)
    {
        entrada.Enqueue(linha);
        saida.Append(linha).Append('\n');
    }

    private object Imprima(object[] args)
    {
        ExigirArgumento(args, "imprima");

        foreach (var arg in args)
            saida.Append(arg);

        return null!;
    }

    private object ImprimaLinha(object[] args)
    {
        ExigirArgumento(args, "imprimaLinha");

        foreach (var arg in args)
            saida.Append(arg).Append('\n');

        return null!;
    }

    private object ImprimaVetor(object[] args)
    {
        if (args.Length > 0 && args[0] is object[] vetor)
            saida.Append('{').Append(string.Join(", ", vetor)).Append('}').Append('\n');

        return null!;
    }

    private object Leia(object[] args)
    {
        if (entrada.Count == 0)
            throw new RuntimeException("leia(): não há mais linhas no campo Entrada.");

        return entrada.Dequeue();
    }

    private static void ExigirArgumento(object[] args, string funcao)
    {
        if (args.Length == 0)
            throw new RuntimeException(funcao + "(): informe o que deve ser impresso.");
    }
}
