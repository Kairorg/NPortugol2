using System.IO.Compression;
using System.Text;

namespace NPortugol.Blazor;

/// <summary>
/// Codifica o programa (e a entrada) no fragmento da URL (#c=...), comprimido com Deflate
/// e em Base64 URL-safe. O fragmento nunca é enviado ao servidor.
/// </summary>
/// <remarks>
/// Um programa em assembly da VM usa o prefixo <c>#a=</c>; só o Raio-X o entende, e as sobrecargas
/// sem o parâmetro <c>assembly</c> o ignoram.
/// </remarks>
public static class LinkCompartilhavel
{
    private const string Prefixo = "c=";
    private const string PrefixoAssembly = "a=";

    public static string Codificar(string codigo, string entrada) => Codificar(codigo, entrada, assembly: false);

    public static string Codificar(string codigo, string entrada, bool assembly)
    {
        var texto = entrada.Length == 0 ? codigo : codigo + "\0" + entrada;

        using var memoria = new MemoryStream();
        using (var deflate = new DeflateStream(memoria, CompressionLevel.SmallestSize))
        {
            var bytes = Encoding.UTF8.GetBytes(texto);
            deflate.Write(bytes, 0, bytes.Length);
        }

        return (assembly ? PrefixoAssembly : Prefixo) + Convert.ToBase64String(memoria.ToArray())
            .TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    public static bool TentarDecodificar(string? fragmento, out string codigo, out string entrada) =>
        TentarDecodificar(fragmento, out codigo, out entrada, out var assembly) && !assembly;

    public static bool TentarDecodificar(string? fragmento, out string codigo, out string entrada, out bool assembly)
    {
        codigo = entrada = string.Empty;
        assembly = false;

        if (string.IsNullOrEmpty(fragmento)) return false;

        fragmento = fragmento.TrimStart('#');
        assembly = fragmento.StartsWith(PrefixoAssembly, StringComparison.Ordinal);
        if (!assembly && !fragmento.StartsWith(Prefixo, StringComparison.Ordinal)) return false;

        try
        {
            var base64 = fragmento[Prefixo.Length..].Replace('-', '+').Replace('_', '/');
            base64 = base64.PadRight(base64.Length + (4 - base64.Length % 4) % 4, '=');

            using var deflate = new DeflateStream(new MemoryStream(Convert.FromBase64String(base64)), CompressionMode.Decompress);
            using var reader = new StreamReader(deflate, Encoding.UTF8);
            var texto = reader.ReadToEnd();

            var separador = texto.IndexOf('\0');
            codigo = separador < 0 ? texto : texto[..separador];
            entrada = separador < 0 ? string.Empty : texto[(separador + 1)..];

            return true;
        }
        catch (FormatException)
        {
            return false;
        }
        catch (InvalidDataException)
        {
            return false;
        }
    }
}
