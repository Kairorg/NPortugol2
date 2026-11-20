using System.Collections.Generic;
using System.Linq;
using Antlr4.Runtime;
using Antlr4.Runtime.Tree;

namespace NPortugol.Ast
{
    /// <summary>
    /// Converte a árvore sintática do ANTLR 4 na AST do NPortugol (o mesmo formato que as
    /// regras de reescrita da antiga gramática ANTLR 3 produziam).
    /// </summary>
    public class AstBuilder
    {
        /// <summary>
        /// Analisa o script e devolve a raiz da AST (nó SCRIPT, com um nó FUNC por função).
        /// Lança <see cref="CompilationException"/> no primeiro erro léxico ou sintático.
        /// </summary>
        public static AstNode Parse(string script)
        {
            var lexer = new NPortugolLexer(CharStreams.fromString(script ?? string.Empty));
            lexer.RemoveErrorListeners();
            lexer.AddErrorListener(ThrowingErrorListener.Instance);

            var parser = new NPortugolParser(new CommonTokenStream(lexer));
            parser.RemoveErrorListeners();
            parser.AddErrorListener(ThrowingErrorListener.Instance);

            return new AstBuilder().Script(parser.script());
        }

        public AstNode Script(NPortugolParser.ScriptContext ctx)
        {
            var root = AstNode.Imaginary(AstKind.Script);

            foreach (var function in ctx.declareFunction())
                root.AddChild(Function(function));

            return root;
        }

        private AstNode Function(NPortugolParser.DeclareFunctionContext ctx)
        {
            var node = AstNode.Imaginary(AstKind.Func).AddChild(Leaf(ctx.name, AstKind.Id));

            foreach (var paramList in ctx.functionParamList())
                node.AddChild(Children(AstKind.Param, paramList.ID().Select(Id)));

            return node.AddChild(Block(ctx.statement()));
        }

        #region statements

        private AstNode Block(IEnumerable<NPortugolParser.StatementContext> statements)
        {
            return Children(AstKind.Slist, statements.Select(Statement));
        }

        private AstNode Statement(NPortugolParser.StatementContext ctx)
        {
            if (ctx.declareLocal() != null) return Children(AstKind.Var, ctx.declareLocal().ID().Select(Id));
            if (ctx.ifStat() != null) return If(ctx.ifStat());
            if (ctx.forStat() != null) return For(ctx.forStat());
            if (ctx.whileStat() != null) return While(ctx.whileStat());
            if (ctx.repeatStat() != null) return Repeat(ctx.repeatStat());
            if (ctx.selectStat() != null) return Select(ctx.selectStat());
            if (ctx.functionCall() != null) return FunctionCall(ctx.functionCall());
            if (ctx.assignVar() != null) return Assign(ctx.assignVar());
            if (ctx.returnStat() != null) return Return(ctx.returnStat());

            return Children(AstKind.Asm, ctx.asmCode().STRING().Select(s => Leaf(s.Symbol, AstKind.String)));
        }

        // se ... então ... fim          -> ^(JMP  ^(LEXP cond) ^(SLIST stats))
        // se ... então ... senão ... fim -> ^(SJMP ^(LEXP cond) ^(SLIST stats ^(SLIST senão)))
        private AstNode If(NPortugolParser.IfStatContext ctx)
        {
            var condition = Lexp(ctx.logicExpression());
            var then = Block(ctx.statement());

            if (ctx.senaoStat() == null)
                return AstNode.Imaginary(AstKind.Jmp).AddChild(condition).AddChild(then);

            then.AddChild(Block(ctx.senaoStat().statement()));

            return AstNode.Imaginary(AstKind.Sjmp).AddChild(condition).AddChild(then);
        }

        // ^(LOOP DEC? ^(ASGN ...) limite ^(SLIST stats))
        private AstNode For(NPortugolParser.ForStatContext ctx)
        {
            var node = AstNode.Imaginary(AstKind.Loop);

            if (ctx.decrescente != null)
                node.AddChild(AstNode.Imaginary(AstKind.Dec));

            return node.AddChild(Assign(ctx.assignVar()))
                       .AddChild(Index(ctx.index()))
                       .AddChild(Block(ctx.statement()));
        }

        // ^(LOOP ^(LEXP cond) ^(SLIST stats))
        private AstNode While(NPortugolParser.WhileStatContext ctx)
        {
            return AstNode.Imaginary(AstKind.Loop)
                          .AddChild(Lexp(ctx.logicExpression()))
                          .AddChild(Block(ctx.statement()));
        }

        // ^(LOOP ^(SLIST stats) ^(LEXP cond))
        private AstNode Repeat(NPortugolParser.RepeatStatContext ctx)
        {
            return AstNode.Imaginary(AstKind.Loop)
                          .AddChild(Block(ctx.statement()))
                          .AddChild(Lexp(ctx.logicExpression()));
        }

        // ^(SEL atom ^(CASE atom stats)+)
        private AstNode Select(NPortugolParser.SelectStatContext ctx)
        {
            var node = AstNode.Imaginary(AstKind.Sel).AddChild(Atom(ctx.atom()));

            foreach (var selectCase in ctx.selectCase())
            {
                var caseNode = AstNode.Imaginary(AstKind.Case).AddChild(Atom(selectCase.atom()));

                foreach (var statement in selectCase.statement())
                    caseNode.AddChild(Statement(statement));

                node.AddChild(caseNode);
            }

            return node;
        }

        private AstNode Assign(NPortugolParser.AssignVarContext ctx)
        {
            var node = AstNode.Imaginary(AstKind.Asgn);

            var range = ctx as NPortugolParser.AssignRangeContext;
            if (range != null)
                return node.AddChild(Id(range.ID()))
                           .AddChild(Leaf(range.INT(0).Symbol, AstKind.Int))
                           .AddChild(Leaf(range.INT(1).Symbol, AstKind.Int));

            var list = ctx as NPortugolParser.AssignListContext;
            if (list != null)
                return node.AddChild(Id(list.ID()))
                           .AddChild(Children(AstKind.Ilist, list.INT().Select(i => Leaf(i.Symbol, AstKind.Int))));

            var indexed = ctx as NPortugolParser.AssignIndexedContext;
            if (indexed != null)
                return node.AddChild(AstNode.Imaginary(AstKind.Ar).AddChild(Index(indexed.index())))
                           .AddChild(Id(indexed.ID()))
                           .AddChild(Plus(indexed.assignExpression().plusExpression()));

            var simple = (NPortugolParser.AssignSimpleContext)ctx;
            return node.AddChild(Id(simple.ID()))
                       .AddChild(Plus(simple.assignExpression().plusExpression()));
        }

        private AstNode Return(NPortugolParser.ReturnStatContext ctx)
        {
            return AstNode.Imaginary(AstKind.Ret).AddChild(Plus(ctx.assignExpression().plusExpression()));
        }

        // ^(CALL ID ^(ARG expr*)*)
        private AstNode FunctionCall(NPortugolParser.FunctionCallContext ctx)
        {
            var node = AstNode.Imaginary(AstKind.Call).AddChild(Id(ctx.ID()));

            return AddArguments(node, ctx.functionArgList());
        }

        private AstNode AddArguments(AstNode node, IEnumerable<NPortugolParser.FunctionArgListContext> argLists)
        {
            foreach (var args in argLists)
                node.AddChild(Children(AstKind.Arg, args.plusExpression().Select(Plus)));

            return node;
        }

        #endregion

        #region expressions

        private AstNode Lexp(NPortugolParser.LogicExpressionContext ctx)
        {
            return AstNode.Imaginary(AstKind.Lexp).AddChild(Logic(ctx));
        }

        // Operadores binários viram a raiz, com associatividade à esquerda (como o ^ do ANTLR 3).
        private AstNode Logic(NPortugolParser.LogicExpressionContext ctx)
        {
            var operands = ctx.plusExpression();
            var operators = ctx.binop();
            var node = Plus(operands[0]);

            for (var i = 0; i < operators.Length; i++)
                node = Leaf(operators[i].Start, AstKind.Operator).AddChild(node).AddChild(Plus(operands[i + 1]));

            return node;
        }

        private AstNode Plus(NPortugolParser.PlusExpressionContext ctx)
        {
            return FoldBinary(ctx, child => Mul((NPortugolParser.MulExpressionContext)child));
        }

        private AstNode Mul(NPortugolParser.MulExpressionContext ctx)
        {
            return FoldBinary(ctx, child => Primary((NPortugolParser.PrimaryArExpressionContext)child));
        }

        // Filhos alternam operando, operador, operando...
        private static AstNode FoldBinary(ParserRuleContext ctx, System.Func<IParseTree, AstNode> operand)
        {
            var node = operand(ctx.GetChild(0));

            for (var i = 1; i + 1 < ctx.ChildCount; i += 2)
            {
                var op = (ITerminalNode)ctx.GetChild(i);
                node = Leaf(op.Symbol, AstKind.Operator).AddChild(node).AddChild(operand(ctx.GetChild(i + 1)));
            }

            return node;
        }

        private AstNode Primary(NPortugolParser.PrimaryArExpressionContext ctx)
        {
            var call = ctx as NPortugolParser.PrimaryCallContext;
            if (call != null) return FunctionCall(call.functionCall());

            var id = ctx as NPortugolParser.PrimaryIdContext;
            if (id != null) return Id(id.ID());

            var t = ctx as NPortugolParser.PrimaryTrueContext;
            if (t != null) return Leaf(t.T().Symbol, AstKind.True);

            var f = ctx as NPortugolParser.PrimaryFalseContext;
            if (f != null) return Leaf(f.F().Symbol, AstKind.False);

            // ^(INDEX indice variavel)
            var index = ctx as NPortugolParser.PrimaryIndexContext;
            if (index != null)
                return AstNode.Imaginary(AstKind.Index).AddChild(Index(index.index())).AddChild(Id(index.ID()));

            // ^(MCALL objeto metodo ^(ARG expr*)*)
            var method = ctx as NPortugolParser.PrimaryMethodContext;
            if (method != null)
            {
                var m = method.methodCall();
                var node = AstNode.Imaginary(AstKind.Mcall)
                                  .AddChild(Leaf(m.obj, AstKind.Id))
                                  .AddChild(Leaf(m.prop, AstKind.Id));

                return AddArguments(node, m.functionArgList());
            }

            // ^(PCALL objeto propriedade)
            var property = ctx as NPortugolParser.PrimaryPropertyContext;
            if (property != null)
            {
                var p = property.propertyCall();
                return AstNode.Imaginary(AstKind.Pcall)
                              .AddChild(Leaf(p.obj, AstKind.Id))
                              .AddChild(Leaf(p.prop, AstKind.Id));
            }

            var constant = ctx as NPortugolParser.PrimaryConstantContext;
            if (constant != null) return Constant(constant.constant());

            return Plus(((NPortugolParser.PrimaryParensContext)ctx).plusExpression());
        }

        private AstNode Atom(NPortugolParser.AtomContext ctx)
        {
            if (ctx.constant() != null) return Constant(ctx.constant());
            if (ctx.ID() != null) return Id(ctx.ID());
            if (ctx.T() != null) return Leaf(ctx.T().Symbol, AstKind.True);

            return Leaf(ctx.F().Symbol, AstKind.False);
        }

        private AstNode Constant(NPortugolParser.ConstantContext ctx)
        {
            if (ctx.INT() != null) return Leaf(ctx.INT().Symbol, AstKind.Int);
            if (ctx.FLOAT() != null) return Leaf(ctx.FLOAT().Symbol, AstKind.Float);

            return Leaf(ctx.STRING().Symbol, AstKind.String);
        }

        private AstNode Index(NPortugolParser.IndexContext ctx)
        {
            return ctx.INT() != null ? Leaf(ctx.INT().Symbol, AstKind.Int) : Id(ctx.ID());
        }

        #endregion

        #region helpers

        private static AstNode Id(ITerminalNode node)
        {
            return Leaf(node.Symbol, AstKind.Id);
        }

        private static AstNode Leaf(IToken token, AstKind kind)
        {
            return new AstNode(kind, token.Text, token.Line, token.Column);
        }

        private static AstNode Children(AstKind kind, IEnumerable<AstNode> children)
        {
            var node = AstNode.Imaginary(kind);

            foreach (var child in children)
                node.AddChild(child);

            return node;
        }

        #endregion
    }
}
