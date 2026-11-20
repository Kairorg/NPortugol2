using NPortugol.Ast;
using NUnit.Framework;

namespace NPortugol.Tests
{
    [TestFixture]
    public class BaseTest
    {
        // Devolve o nó da primeira função (FUNC), como a AST do ANTLR 3 fazia para scripts
        // com uma única função.
        public AstNode BuildAST(string script)
        {
            return new Npc().GerarAst(script).GetChild(0);
        }
    }
}
