using System.Collections.Generic;
using System.Text;

namespace NPortugol.Runtime.Asm
{
    public class AntlrRunnableBuilder: IRunnableBuilder
    {
        private string script;

        public bool DebugInfo { get; set; }

        /// <summary>Erros de sintaxe recuperados na última chamada a <see cref="Build"/>.</summary>
        public IList<string> Errors { get; private set; }

        public void Load(string script)
        {
            this.script = script;
        }

        public void Load(IEnumerable<string> lines)
        {
            var sb = new StringBuilder();

            foreach (var line in lines)
            {
                sb.Append(line+"\r\n");
            }

            Load(sb.ToString());
        }

        public Runnable Build()
        {
            var builder = new AsmProgramBuilder {DebugInfo = DebugInfo};

            var instructions = builder.Build(script);

            Errors = builder.Errors;

            return new Runnable(new InstrucStream(new List<Instruction>(instructions).ToArray()), builder.FunctionTable, new SymbolTable(null));
        }
    }
}
