using System.Reflection;

namespace NPortugol.Playground.Runtime;

public sealed record Exemplo(string Id, string Titulo, string Codigo, string Entrada);

/// <summary>Exemplos prontos, embutidos a partir da pasta Exemplos do projeto.</summary>
public static class Exemplos
{
    private static readonly (string Id, string Titulo, string Entrada)[] Catalogo =
    {
        ("OlaMundo", "Olá, mundo", ""),
        ("Tabuada", "Tabuada", ""),
        ("Fatorial", "Fatorial (usa leia)", "5"),
        ("OrdenacaoBolha", "Ordenação bolha", ""),
        ("ValidarCpf", "Validar CPF", ""),
        ("NomeDoDia", "Nome do dia da semana", ""),
    };

    public static IReadOnlyList<Exemplo> Todos { get; } = Carregar();

    private static List<Exemplo> Carregar()
    {
        var assembly = typeof(Exemplos).Assembly;

        return Catalogo
            .Select(e => new Exemplo(e.Id, e.Titulo, Ler(assembly, e.Id), e.Entrada))
            .ToList();
    }

    private static string Ler(Assembly assembly, string id)
    {
        using var stream = assembly.GetManifestResourceStream($"NPortugol.Playground.Exemplos.{id}.np")
                           ?? throw new InvalidOperationException($"Exemplo '{id}' não encontrado.");
        using var reader = new StreamReader(stream);

        return reader.ReadToEnd().Replace("\r\n", "\n");
    }
}
