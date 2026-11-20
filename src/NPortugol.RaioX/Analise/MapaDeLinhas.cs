using NPortugol.Runtime;

namespace NPortugol.RaioX.Analise;

/// <summary>
/// Liga cada instrução do assembly carregado na VM à linha do editor que a produziu, seja o
/// editor de NPortugol (pelo <see cref="SourceLineMap"/>) ou o de assembly (linha a linha).
/// </summary>
/// <remarks>Rótulos e cabeçalhos de função não têm linha, para o passo por linha não parar neles.</remarks>
public sealed class MapaDeLinhas
{
    private readonly int?[] linhas;

    private MapaDeLinhas(int?[] linhas) => this.linhas = linhas;

    public int Count => linhas.Length;

    public static MapaDeLinhas De(SourceLineMap mapa) =>
        new(Enumerable.Range(0, mapa.Count).Select(mapa.LineOf).ToArray());

    public static MapaDeLinhas De(IEnumerable<int?> linhas) => new(linhas.ToArray());

    /// <summary>Linha do editor (1 = primeira) da instrução, ou null.</summary>
    public int? LinhaDe(int instrucao) => instrucao >= 0 && instrucao < linhas.Length ? linhas[instrucao] : null;
}
