using System;

namespace NPortugol
{
    /// <summary>
    /// Erro encontrado ao compilar um script NPortugol. Além da mensagem, expõe a posição
    /// do erro no fonte para que editores e hosts possam destacá-la.
    /// </summary>
    [Serializable]
    public class CompilationException : Exception
    {
        public CompilationException(string message, int line, int column, string offendingText)
            : base(message)
        {
            Line = line;
            Column = column;
            OffendingText = offendingText;
        }

        /// <summary>Linha do erro (1 = primeira linha; 0 quando desconhecida).</summary>
        public int Line { get; private set; }

        /// <summary>Coluna do erro (0 = primeira coluna; -1 quando desconhecida).</summary>
        public int Column { get; private set; }

        /// <summary>Trecho do fonte que provocou o erro, quando disponível.</summary>
        public string OffendingText { get; private set; }

        /// <summary>Erro de sintaxe, no formato de mensagem usado desde a versão ANTLR 3.</summary>
        public static CompilationException Syntax(int line, int column, string offendingText)
        {
            var message = string.Format(
                "Erro na linha {0} posição {1}: '{2}'. Certifique-se de acentuar as palavras.",
                line, column, offendingText);

            return new CompilationException(message, line, column, offendingText);
        }

        /// <summary>Construção válida sintaticamente mas não suportada pelo compilador.</summary>
        public static CompilationException Unsupported(string what, int line, int column, string offendingText)
        {
            var message = line > 0
                ? string.Format("Erro na linha {0} posição {1}: {2}", line, column, what)
                : what;

            return new CompilationException(message, line, column, offendingText);
        }
    }
}
