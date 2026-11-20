using System;
using System.Collections.Generic;

namespace NPortugol.Runtime
{
    /// <summary>
    /// Liga cada linha do assembly à linha do script que a gerou, a partir do
    /// <see cref="Bytecode.SourceMap"/> (compilado com <c>Npc.DebugInfo = true</c>).
    /// </summary>
    /// <remarks>
    /// O SourceMap gerado pelo <c>Emissor</c> não é um índice direto: a entrada <c>K</c> se refere
    /// à instrução <c>K + 1 + 2 × p</c>, em que <c>p</c> é o número de parâmetros da função. O
    /// deslocamento vem do cabeçalho da função (rótulo e <c>EMP</c>) e do par <c>DCL</c>/<c>POP</c> de
    /// cada parâmetro, inseridos depois de as posições terem sido registradas. O formato do
    /// SourceMap faz parte do bytecode e por isso não foi alterado; esta classe faz a tradução.
    /// </remarks>
    public sealed class SourceLineMap
    {
        private readonly int?[] lines;
        private readonly bool[] exact;
        private readonly Dictionary<int, List<int>> instructionsByLine = new Dictionary<int, List<int>>();

        private SourceLineMap(int count)
        {
            lines = new int?[count];
            exact = new bool[count];
        }

        /// <summary>Número de linhas do assembly.</summary>
        public int Count
        {
            get { return lines.Length; }
        }

        public static SourceLineMap FromBytecode(Bytecode bytecode)
        {
            if (bytecode == null) throw new ArgumentNullException("bytecode");

            var script = bytecode.Script;
            var map = new SourceLineMap(script.Count);
            var functions = FindFunctions(script);

            if (bytecode.SourceMap != null)
            {
                foreach (var entry in bytecode.SourceMap)
                {
                    if (entry.Value < 0) continue;

                    var function = FunctionAt(functions, entry.Key);
                    if (function == null) continue;

                    var index = entry.Key + 1 + 2 * function.Value.Parameters;

                    if (index < 0 || index >= script.Count) continue;

                    map.lines[index] = entry.Value + 1;
                    map.exact[index] = true;
                }
            }

            map.InheritLines(script);
            map.IndexByLine();

            return map;
        }

        /// <summary>
        /// Linha do script (1 = primeira) a que a instrução pertence, ou null para rótulos,
        /// cabeçalhos de função e o prólogo que recebe os parâmetros.
        /// </summary>
        public int? LineOf(int asmIndex)
        {
            return asmIndex >= 0 && asmIndex < lines.Length ? lines[asmIndex] : null;
        }

        /// <summary>
        /// True quando a linha veio diretamente do SourceMap; false quando foi herdada da instrução
        /// anterior (saltos, operações de pilha etc.).
        /// </summary>
        public bool IsExact(int asmIndex)
        {
            return asmIndex >= 0 && asmIndex < exact.Length && exact[asmIndex];
        }

        /// <summary>Índices das linhas do assembly geradas pela linha do script.</summary>
        public IList<int> InstructionsOf(int sourceLine)
        {
            List<int> list;
            return instructionsByLine.TryGetValue(sourceLine, out list) ? list.AsReadOnly() : new List<int>().AsReadOnly();
        }

        // Instruções sem entrada no SourceMap (saltos, operações de pilha, chamadas) pertencem à
        // mesma linha da instrução anterior, dentro da mesma função.
        private void InheritLines(IList<string> script)
        {
            int? current = null;

            for (var i = 0; i < script.Count; i++)
            {
                var text = script[i].Trim();

                if (IsFunctionHeader(text))
                {
                    current = null;
                    continue;
                }

                if (text.StartsWith(".")) continue;

                if (lines[i].HasValue)
                    current = lines[i];
                else
                    lines[i] = current;
            }
        }

        private void IndexByLine()
        {
            for (var i = 0; i < lines.Length; i++)
            {
                if (!lines[i].HasValue) continue;

                List<int> list;
                if (!instructionsByLine.TryGetValue(lines[i].Value, out list))
                    instructionsByLine[lines[i].Value] = list = new List<int>();

                list.Add(i);
            }
        }

        private struct FunctionInfo
        {
            public int Start;
            public int Parameters;
        }

        // Cabeçalho "nome:" seguido do prólogo de parâmetros (pares DCL x / POP x) e de um EMP.
        private static List<FunctionInfo> FindFunctions(IList<string> script)
        {
            var functions = new List<FunctionInfo>();

            for (var i = 0; i < script.Count; i++)
            {
                if (!IsFunctionHeader(script[i].Trim())) continue;

                var parameters = 0;
                var j = i + 1;

                while (j + 1 < script.Count
                       && script[j].Trim().StartsWith("DCL ")
                       && script[j + 1].Trim() == "POP " + script[j].Trim().Substring(4))
                {
                    parameters++;
                    j += 2;
                }

                functions.Add(new FunctionInfo { Start = i, Parameters = parameters });
            }

            return functions;
        }

        private static FunctionInfo? FunctionAt(List<FunctionInfo> functions, int key)
        {
            FunctionInfo? found = null;

            foreach (var function in functions)
                if (function.Start <= key) found = function;

            return found;
        }

        private static bool IsFunctionHeader(string text)
        {
            return text.EndsWith(":") && !text.StartsWith(".") && text.IndexOf(' ') < 0;
        }
    }
}
