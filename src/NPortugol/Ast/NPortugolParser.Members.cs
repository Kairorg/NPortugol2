using System.Collections.Generic;
using Antlr4.Runtime;

namespace NPortugol
{
    // Membros usados pelas ações e predicados de src/grammar/NPortugol.g4.
    // Ficam aqui (classe parcial) para manter a gramática livre de código C#.
    public partial class NPortugolParser
    {
        private readonly HashSet<string> symbols = new HashSet<string>();

        private void DefineIds(IList<IToken> ids)
        {
            foreach (var id in ids)
                symbols.Add(id.Text);
        }

        // Um identificador seguido de '(' é chamada de função, desde que não tenha sido
        // declarado como variável (a declaração vale para o restante do script).
        private bool IsFunctionCallAhead()
        {
            return !symbols.Contains(TokenStream.LT(1).Text) && TokenStream.LT(2).Text == "(";
        }
    }
}
