using System.IO;
using Antlr4.Runtime;
using Antlr4.Runtime.Misc;

namespace NPortugol.Ast
{
    /// <summary>
    /// Interrompe a compilação no primeiro erro léxico ou sintático, lançando
    /// <see cref="CompilationException"/>. Substitui o @rulecatch da gramática ANTLR 3,
    /// mas sem a recuperação silenciosa que deixava passar scripts inválidos.
    /// </summary>
    public sealed class ThrowingErrorListener : IAntlrErrorListener<IToken>, IAntlrErrorListener<int>
    {
        public static readonly ThrowingErrorListener Instance = new ThrowingErrorListener();

        private ThrowingErrorListener() { }

        // Erros do parser.
        public void SyntaxError(TextWriter output, IRecognizer recognizer, IToken offendingSymbol,
                                int line, int charPositionInLine, string msg, RecognitionException e)
        {
            var text = offendingSymbol == null ? string.Empty
                     : offendingSymbol.Type == TokenConstants.EOF ? "<EOF>"
                     : offendingSymbol.Text;

            throw CompilationException.Syntax(line, charPositionInLine, text);
        }

        // Erros do lexer (caractere não reconhecido).
        public void SyntaxError(TextWriter output, IRecognizer recognizer, int offendingSymbol,
                                int line, int charPositionInLine, string msg, RecognitionException e)
        {
            var text = string.Empty;
            var lexerError = e as LexerNoViableAltException;
            var lexer = recognizer as Lexer;
            var input = lexer == null ? null : lexer.InputStream as ICharStream;

            if (lexerError != null && input != null)
            {
                var start = lexerError.StartIndex;
                text = input.GetText(Interval.Of(start, start));
            }

            throw CompilationException.Syntax(line, charPositionInLine, text);
        }
    }
}
