using System.Collections.Generic;
using NPortugol.Ast;

namespace NPortugol
{
    /// <summary>
    /// Percorre a AST e emite o assembly da VM por meio do <see cref="Emissor"/>.
    /// Substitui a tree grammar NPortugolWalker.g da versão ANTLR 3 (o ANTLR 4 não tem
    /// tree grammars) e segue as mesmas regras, na mesma ordem de emissão.
    /// </summary>
    public class NPortugolWalker
    {
        private readonly Emissor emitter = new Emissor();

        // Saltos de condição são emitidos invertidos ("pule o bloco se a condição for falsa"),
        // exceto na condição do 'repita ... até', que sai do laço quando é verdadeira.
        private bool invertExp = true;

        public Dictionary<int, int> SourceMap
        {
            get { return emitter.SourceMap; }
        }

        public bool DebugInfo
        {
            get { return emitter.DebugInfo; }
            set { emitter.DebugInfo = value; }
        }

        /// <summary>Gera as linhas de assembly a partir da raiz (SCRIPT) da AST.</summary>
        public IList<string> Walk(AstNode script)
        {
            foreach (var function in script.Children)
                DeclareFunction(function);

            return emitter.ScriptLines;
        }

        // ^(FUNC ID PARAM* ^(SLIST statement*))
        private void DeclareFunction(AstNode node)
        {
            for (var i = 1; i < node.ChildCount - 1; i++)
                foreach (var param in node.GetChild(i).Children)
                    emitter.AddParam(param.Text);

            Statements(node.GetChild(node.ChildCount - 1), 0);

            emitter.EmitFunction(node.GetChild(0));
        }

        #region statements

        private void Statements(AstNode parent, int from)
        {
            Statements(parent, from, parent.ChildCount);
        }

        private void Statements(AstNode parent, int from, int to)
        {
            for (var i = from; i < to; i++)
                Statement(parent.GetChild(i));
        }

        private void Statement(AstNode node)
        {
            switch (node.Kind)
            {
                case AstKind.Var:
                    foreach (var id in node.Children)
                        emitter.EmitVar(id);
                    break;
                case AstKind.Jmp:
                case AstKind.Sjmp:
                    If(node);
                    break;
                case AstKind.Loop:
                    Loop(node);
                    break;
                case AstKind.Sel:
                    Select(node);
                    break;
                case AstKind.Call:
                    FunctionCall(node);
                    break;
                case AstKind.Asgn:
                    AssignVar(node);
                    break;
                case AstKind.Ret:
                    PlusExpression(node.GetChild(0));
                    emitter.EmitRet(node);
                    break;
                case AstKind.Asm:
                    emitter.EmitAsmCode(node.Children);
                    break;
                default:
                    throw Unsupported("comando não suportado", node);
            }
        }

        // ^(JMP ^(LEXP cond) ^(SLIST stats))  |  ^(SJMP ^(LEXP cond) ^(SLIST stats ^(SLIST senão)))
        // Correção: a versão ANTLR 3 emitia só o primeiro comando do bloco 'então' quando havia 'senão'.
        private void If(AstNode node)
        {
            Condition(node.GetChild(0).GetChild(0));

            var block = node.GetChild(1);

            if (node.Kind == AstKind.Jmp)
            {
                Statements(block, 0);
                emitter.EmitIf(false);
                return;
            }

            Statements(block, 0, block.ChildCount - 1);
            emitter.EmitIf(true);

            Statements(block.GetChild(block.ChildCount - 1), 0);
            emitter.EmitElse();
        }

        private void Loop(AstNode node)
        {
            var first = node.GetChild(0).Kind;

            if (first == AstKind.Dec || first == AstKind.Asgn)
                For(node);
            else if (first == AstKind.Lexp)
                While(node);
            else
                Repeat(node);
        }

        // ^(LOOP DEC? ^(ASGN ...) limite ^(SLIST stats))
        private void For(AstNode node)
        {
            var increment = node.GetChild(0).Kind != AstKind.Dec;
            var offset = increment ? 0 : 1;
            var limit = node.GetChild(offset + 1);

            emitter.SetForInc(AssignVar(node.GetChild(offset)));
            emitter.EmitInitFor(limit, increment);

            Statements(node.GetChild(offset + 2), 0);

            emitter.EmitEndFor(limit, increment);
        }

        // ^(LOOP ^(LEXP cond) ^(SLIST stats))
        private void While(AstNode node)
        {
            emitter.EmitInitWhile();
            Condition(node.GetChild(0).GetChild(0));

            Statements(node.GetChild(1), 0);

            emitter.EmitEndWhile();
        }

        // ^(LOOP ^(SLIST stats) ^(LEXP cond))
        // Correção: na versão ANTLR 3 o salto não invertido valia também para os comandos do
        // corpo (um 'se' dentro de 'repita' tinha a condição invertida) e era desfeito ao fim
        // de um 'repita' aninhado. Agora vale só para a condição do próprio laço.
        private void Repeat(AstNode node)
        {
            emitter.EmitInitRepeat();
            Statements(node.GetChild(0), 0);

            var previous = invertExp;
            invertExp = false;
            Condition(node.GetChild(1).GetChild(0));
            invertExp = previous;

            emitter.EmitEndRepeat();
        }

        // ^(SEL atom ^(CASE atom stats)+)
        private void Select(AstNode node)
        {
            var value = Atom(node.GetChild(0));
            emitter.EmitInitSel(value);

            for (var i = 1; i < node.ChildCount; i++)
            {
                var caseNode = node.GetChild(i);
                var caseValue = Atom(caseNode.GetChild(0));

                emitter.EmitCase(caseValue);
                Statements(caseNode, 1);
                emitter.EmitEndCase(caseValue);
            }

            emitter.EmitEndSel(value);
        }

        // Devolve o nome da variável atribuída, usado como contador do 'para'.
        // Correção: a versão ANTLR 3 só devolvia o nome quando o valor era um literal ou
        // variável; com uma expressão ('para i = n - 1 até 0') emitia "PUSH " e "INC " vazios.
        private string AssignVar(AstNode node)
        {
            var target = node.GetChild(0);

            // ^(ASGN ^(AR indice) ID expr)
            if (target.Kind == AstKind.Ar)
            {
                var index = target.GetChild(0);
                var id = node.GetChild(1);

                PlusExpression(node.GetChild(2));

                if (index.Kind == AstKind.Int)
                    emitter.EmitPop(id, int.Parse(index.Text));
                else
                    emitter.EmitPop(id, index.Text);

                return null;
            }

            // ^(ASGN ID INT INT)
            if (node.ChildCount == 3)
            {
                emitter.EmitAssign(target, int.Parse(node.GetChild(1).Text), int.Parse(node.GetChild(2).Text));
                return null;
            }

            // ^(ASGN ID ^(ILIST INT+))
            var value = node.GetChild(1);

            if (value.Kind == AstKind.Ilist)
            {
                emitter.EmitAssignArray(target, value);
                return null;
            }

            // ^(ASGN ID expr)
            PlusExpression(value);
            emitter.EmitPop(target);

            return target.Text;
        }

        // ^(CALL ID ^(ARG expr*)*)
        private void FunctionCall(AstNode node)
        {
            Arguments(node, 1);
            emitter.EmitCall(node.GetChild(0));
        }

        private void Arguments(AstNode node, int from)
        {
            for (var i = from; i < node.ChildCount; i++)
                foreach (var expression in node.GetChild(i).Children)
                    PlusExpression(expression);
        }

        #endregion

        #region expressions

        // Correção: condições que não são comparações, comparações encadeadas e os operadores
        // 'e'/'ou' geravam assembly truncado ou "Pilha vazia" na versão ANTLR 3; agora são
        // rejeitados com um erro de compilação que aponta a posição.
        private void Condition(AstNode node)
        {
            if (node.Kind == AstKind.Operator)
            {
                switch (node.Text)
                {
                    case "<": Comparison(node); emitter.EmitLessExp(invertExp); return;
                    case ">": Comparison(node); emitter.EmitGreaterExp(invertExp); return;
                    case "<=": Comparison(node); emitter.EmitLessEqExp(invertExp); return;
                    case ">=": Comparison(node); emitter.EmitGreaterEqExp(invertExp); return;
                    case "==": Comparison(node); emitter.EmitEqualsExp(invertExp); return;
                    case "!=": Comparison(node); emitter.EmitNotEqExp(invertExp); return;
                    case "e":
                    case "ou":
                        throw Unsupported(string.Format("o operador '{0}' ainda não é suportado em condições", node.Text), node);
                }
            }

            throw Unsupported("a condição deve ser uma comparação (<, >, <=, >=, == ou !=)", node);
        }

        private void Comparison(AstNode node)
        {
            PlusExpression(node.GetChild(0));
            PlusExpression(node.GetChild(1));
        }

        private void PlusExpression(AstNode node)
        {
            switch (node.Kind)
            {
                case AstKind.Operator:
                    BinaryArithmetic(node);
                    break;
                case AstKind.Index:
                    // ^(INDEX indice ID)
                    var index = node.GetChild(0);
                    var id = node.GetChild(1);

                    if (index.Kind == AstKind.Int)
                        emitter.EmitPush(id.Text, int.Parse(index.Text));
                    else
                        emitter.EmitPush(id.Text, index.Text);
                    break;
                case AstKind.Call:
                    FunctionCall(node);
                    break;
                case AstKind.Mcall:
                    Arguments(node, 2);
                    emitter.EmitMethodCall(node.GetChild(0), node.GetChild(1));
                    break;
                case AstKind.Pcall:
                    emitter.EmitPropCall(node.GetChild(0), node.GetChild(1));
                    break;
                default:
                    Atom(node);
                    break;
            }
        }

        private void BinaryArithmetic(AstNode node)
        {
            switch (node.Text)
            {
                case "+": Comparison(node); emitter.EmitStackAdd(); return;
                case "-": Comparison(node); emitter.EmitStackSub(); return;
                case "*": Comparison(node); emitter.EmitStackPlus(); return;
                case "/": Comparison(node); emitter.EmitStackDiv(); return;
                case "%": Comparison(node); emitter.EmitStackMod(); return;
            }

            if (node.Text == "e" || node.Text == "ou")
                throw Unsupported(string.Format("o operador '{0}' ainda não é suportado", node.Text), node);

            throw Unsupported(string.Format(
                "o operador '{0}' só pode ser usado em condições (comparações encadeadas não são suportadas)", node.Text), node);
        }

        // Empilha o valor e o devolve (usado por 'selecione' e 'caso').
        private object Atom(AstNode node)
        {
            object value;

            switch (node.Kind)
            {
                case AstKind.Id:
                case AstKind.String:
                    value = node.Text;
                    emitter.EmitPush(value, node);
                    break;
                case AstKind.Int:
                    value = int.Parse(node.Text);
                    emitter.EmitPush(value, node);
                    break;
                case AstKind.Float:
                    // Mantido como na versão ANTLR 3: depende da cultura pt-BR (vírgula decimal).
                    value = float.Parse(node.Text.Replace(".", ","));
                    emitter.EmitPush(value, node);
                    break;
                case AstKind.True:
                    value = node.Text;
                    emitter.EmitPush(true, node);
                    break;
                case AstKind.False:
                    value = node.Text;
                    emitter.EmitPush(false, node);
                    break;
                default:
                    throw Unsupported("expressão não suportada", node);
            }

            return value;
        }

        #endregion

        private static CompilationException Unsupported(string what, AstNode node)
        {
            var position = FirstSourceNode(node) ?? node;

            return CompilationException.Unsupported(what, position.Line, position.Column, position.Text);
        }

        // Nós imaginários não têm posição; usa a do primeiro token real abaixo deles.
        private static AstNode FirstSourceNode(AstNode node)
        {
            if (!node.IsImaginary) return node;

            foreach (var child in node.Children)
            {
                var found = FirstSourceNode(child);
                if (found != null) return found;
            }

            return null;
        }
    }
}
