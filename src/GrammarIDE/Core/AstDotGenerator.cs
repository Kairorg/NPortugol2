using System.Collections.Generic;
using System.Text;
using NPortugol.Ast;

namespace GrammarIDE.Core
{
    /// <summary>
    /// Gera a AST no formato DOT do Graphviz, com nós nomeados n0, n1... como o
    /// DotTreeGenerator do ANTLR 3 (formato esperado por <see cref="DotGraphStyle"/>).
    /// </summary>
    public class AstDotGenerator
    {
        public string ToDot(AstNode root)
        {
            var nodes = new StringBuilder();
            var edges = new StringBuilder();
            var ids = new Dictionary<AstNode, int>();

            Visit(root, ids, nodes, edges);

            return new StringBuilder("digraph {\n")
                .Append(nodes)
                .Append(edges)
                .Append("}\n")
                .ToString();
        }

        private static void Visit(AstNode node, Dictionary<AstNode, int> ids, StringBuilder nodes, StringBuilder edges)
        {
            var id = ids.Count;
            ids[node] = id;

            nodes.AppendFormat("  n{0} [label=\"{1}\"];\n", id, Escape(node.Text));

            foreach (var child in node.Children)
            {
                Visit(child, ids, nodes, edges);
                edges.AppendFormat("  n{0} -> n{1};\n", id, ids[child]);
            }
        }

        private static string Escape(string text)
        {
            return (text ?? string.Empty).Replace("\\", "\\\\").Replace("\"", "\\\"");
        }
    }
}
