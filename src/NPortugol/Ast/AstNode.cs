using System.Collections.Generic;
using System.Text;

namespace NPortugol.Ast
{
    /// <summary>
    /// Tipos de nó da AST. Os nós "imaginários" (Func, Slist, Asgn...) correspondem aos
    /// tokens imaginários da antiga gramática ANTLR 3; os demais carregam um token do fonte.
    /// </summary>
    public enum AstKind
    {
        Script, Func, Param, Var, Call, Asgn, Arg, Lexp, Ret, Slist, Jmp, Sjmp, Loop, Dec,
        Ar, Index, Ilist, Mcall, Pcall, Asm, Sel, Case,
        Id, Int, Float, String, True, False, Operator
    }

    /// <summary>
    /// Nó da AST do NPortugol. Mantém o mesmo formato da AST gerada pelas regras de reescrita
    /// da gramática ANTLR 3, com uma exceção: o acesso indexado em expressões agora é um único
    /// nó INDEX com dois filhos (índice, variável), em vez de dois nós irmãos.
    /// </summary>
    public class AstNode
    {
        private readonly List<AstNode> children = new List<AstNode>();

        public AstNode(AstKind kind, string text, int line, int column)
        {
            Kind = kind;
            Text = text;
            Line = line;
            Column = column;
        }

        /// <summary>Cria um nó imaginário (sem token no fonte), com linha 0 como no ANTLR 3.</summary>
        public static AstNode Imaginary(AstKind kind)
        {
            return new AstNode(kind, kind.ToString().ToUpperInvariant(), 0, -1);
        }

        public AstKind Kind { get; private set; }

        public string Text { get; private set; }

        /// <summary>Linha no fonte (1 = primeira linha; 0 para nós imaginários).</summary>
        public int Line { get; private set; }

        /// <summary>Coluna no fonte (0 = primeira coluna; -1 para nós imaginários).</summary>
        public int Column { get; private set; }

        public AstNode Parent { get; private set; }

        public IList<AstNode> Children
        {
            get { return children.AsReadOnly(); }
        }

        public int ChildCount
        {
            get { return children.Count; }
        }

        public bool IsImaginary
        {
            get { return Line == 0; }
        }

        public AstNode GetChild(int index)
        {
            return children[index];
        }

        public AstNode AddChild(AstNode child)
        {
            if (child == null) return this;

            child.Parent = this;
            children.Add(child);

            return this;
        }

        public override string ToString()
        {
            return Text;
        }

        /// <summary>Representação em formato LISP, como o ToStringTree() do ANTLR 3.</summary>
        public string ToStringTree()
        {
            if (children.Count == 0) return Text;

            var sb = new StringBuilder("(").Append(Text);

            foreach (var child in children)
                sb.Append(' ').Append(child.ToStringTree());

            return sb.Append(')').ToString();
        }
    }
}
