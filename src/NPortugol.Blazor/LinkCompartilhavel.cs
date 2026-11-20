using System.IO.Compression;
using System.Text;

namespace NPortugol.Playground.Runtime;

/// <summary>
/// Codifica o programa (e a entrada) no fragmento da URL (#c=...), comprimido com Deflate
/// e em Base64 URL-safe. O fragmento nunca é enviado ao servidor.
/// </summary>
public static class LinkCompartilhavel
{
    private const string Prefixo = "c=";

    public static string Codificar(string codigo, string entrada)
    {
        var texto = entrada.Length == 0 ? codigo : codigo + "\0" + entrada;

        using var memoria = new MemoryStream();
        using (var deflate = new DeflateStream(memoria, CompressionLevel.SmallestSize))
        {
            var bytes = Encoding.UTF8.GetBytes(texto);
            deflate.Write(bytes, 0, bytes.Length);
        }

        return Prefixo + Convert.ToBase64String(memoria.ToArray())
            .TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    public static bool TentarDecodificar(string? fragmento, out string codigo, out string entrada)
    {
        codigo = entrada = string.Empty;

        if (string.IsNullOrEmpty(fragmento)) return false;

        fragmento = fragmento.TrimStart('#');
        if (!fragmento.StartsWith(Prefixo, StringComparison.Ordinal)) return false;

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
