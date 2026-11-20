using System.IO;
using System.Linq;
using NPortugol.Ast;
using NPortugol.Runtime;

namespace NPortugol
{
    public class Npc : ICompilador
    {
        public bool DebugInfo { get; set; }

        /// <summary>
        /// Compila o script para bytecode. Lança <see cref="CompilationException"/> (com linha
        /// e coluna) se o script tiver erro de sintaxe ou usar construção não suportada.
        /// </summary>
        public Bytecode Compilar(string script)
        {
            var ast = GerarAst(script);

            var walker = new NPortugolWalker { DebugInfo = DebugInfo };

            var asm = walker.Walk(ast);

            var functions = ast.Children.Select(f => f.GetChild(0).Text).ToList();

            return new Bytecode(asm, functions, walker.SourceMap);
        }

        /// <summary>Analisa o script e devolve a AST (raiz SCRIPT com um nó FUNC por função).</summary>
        public AstNode GerarAst(string script)
        {
            return AstBuilder.Parse(script);
        }

        public Bytecode CompilarArquivo(string scriptfile)
        {
            using (var reader = new StreamReader(scriptfile))
            {
                var file = reader.ReadToEnd();

                return Compilar(file);
            }
        }

        public void SalvarEmDisco(string filename)
        {
            var bytecode = CompilarArquivo(filename);

            new BytecodeSerializer().Create(ExtrairNome(filename), bytecode);
        }

        public Bytecode LerNoDisco(string filename)
        {
            return new BytecodeSerializer().Read(filename);
        }

        private static string ExtrairNome(string filename)
        {
            var parts = filename.Split('\\');

            var cname = parts[parts.Length - 1];

            var name = cname.Split('.')[0];

            return string.Format("{0}.{1}", name, "npx");
        }
    }
}