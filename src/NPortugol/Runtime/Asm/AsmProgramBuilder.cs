using System;
using System.Collections.Generic;
using System.IO;
using Antlr4.Runtime;
using Antlr4.Runtime.Tree;

namespace NPortugol.Runtime.Asm
{
    /// <summary>
    /// Monta as instruções da VM a partir do assembly textual (src/grammar/ASM.g4).
    /// Substitui as ações embutidas na antiga gramática ANTLR 3.
    /// </summary>
    /// <remarks>
    /// Como na versão ANTLR 3, o parser é tolerante: erros de sintaxe são recuperados e
    /// registrados em <see cref="Errors"/> em vez de interromper a carga.
    /// </remarks>
    public class AsmProgramBuilder
    {
        private int index;

        public AsmProgramBuilder()
        {
            Labels = new Dictionary<string, int>();
            Instructions = new List<Instruction>();
            FunctionTable = new FunctionTable();
            Errors = new List<string>();
        }

        public bool DebugInfo { get; set; }

        public Dictionary<string, int> Labels { get; private set; }

        public List<Instruction> Instructions { get; private set; }

        public FunctionTable FunctionTable { get; private set; }

        /// <summary>Erros de sintaxe encontrados (e recuperados) durante a montagem.</summary>
        public List<string> Errors { get; private set; }

        public IList<Instruction> Build(string script)
        {
            var collector = new CollectingErrorListener(Errors);

            var lexer = new ASMLexer(CharStreams.fromString(script ?? string.Empty));
            lexer.RemoveErrorListeners();
            lexer.AddErrorListener(collector);

            var tokens = new CommonTokenStream(lexer);
            var parser = new ASMParser(tokens);
            parser.RemoveErrorListeners();
            parser.AddErrorListener(collector);

            foreach (var line in parser.script().line())
                if (EndsProperly(line, tokens))
                    Line(line);

            ResolveLabels();

            return Instructions;
        }

        // Reproduz a recuperação de erro da versão ANTLR 3, em que cada instrução incluía o fim
        // de linha: a linha é aceita se o próximo token for fim de linha, se puder iniciar uma
        // nova linha (o fim de linha ausente era "inserido") ou se for um único token seguido
        // de fim de linha (o token extra era "apagado"). Caso contrário a linha é descartada.
        private static bool EndsProperly(ASMParser.LineContext line, ITokenStream tokens)
        {
            if (line.Stop == null) return false;

            var next = NextOnChannel(tokens, line.Stop.TokenIndex + 1);

            if (IsLineEnd(next) || CanStartLine(next)) return true;

            return IsLineEnd(NextOnChannel(tokens, next.TokenIndex + 1));
        }

        private static IToken NextOnChannel(ITokenStream tokens, int index)
        {
            var token = tokens.Get(System.Math.Min(index, tokens.Size - 1));

            while (token.Channel != TokenConstants.DefaultChannel && token.TokenIndex < tokens.Size - 1)
                token = tokens.Get(token.TokenIndex + 1);

            return token;
        }

        private static bool IsLineEnd(IToken token)
        {
            return token.Type == ASMLexer.NEWLINE || token.Type == TokenConstants.EOF;
        }

        private static bool CanStartLine(IToken token)
        {
            return token.Type == ASMLexer.ID || token.Text == "."
                || (token.Type >= ASMLexer.EMP && token.Type <= ASMLexer.SCNT);
        }

        private void Line(ASMParser.LineContext line)
        {
            if (line.func() != null)
            {
                var name = Text(line.func().ID());
                if (name == null) return;

                FunctionTable.Add(name, new Function(name, index));
                AddDebugMarker();
            }
            else if (line.label() != null)
            {
                var name = Text(line.label().ID());
                if (name == null) return;

                Labels.Add(name, index);
                AddDebugMarker();
            }
            else if (line.instruction() != null)
            {
                var instruction = Instruction(line.instruction());

                if (instruction != null)
                {
                    Instructions.Add(instruction);
                    index++;
                }
            }
        }

        private void AddDebugMarker()
        {
            if (!DebugInfo) return;

            Instructions.Add(new Instruction(OpCode.EMP, index));
            index++;
        }

        // Devolve null para linhas incompletas (recuperadas de um erro de sintaxe).
        private Instruction Instruction(ASMParser.InstructionContext ctx)
        {
            var noOperand = ctx as ASMParser.NoOperandContext;
            if (noOperand != null)
                return Create(noOperand.op);

            var oneOperand = ctx as ASMParser.OneOperandContext;
            if (oneOperand != null)
                return Create(oneOperand.op, Operand(oneOperand.operand()));

            var twoOperands = ctx as ASMParser.TwoOperandsContext;
            if (twoOperands != null)
                return Create(twoOperands.op, Operand(twoOperands.operand(0)), Operand(twoOperands.operand(1)));

            var host = ctx as ASMParser.HostOperandsContext;
            if (host != null)
            {
                var operands = new List<Operand>();

                foreach (var id in host.ID())
                    operands.Add(new Operand(OperandType.HostObjectRef, id.GetText()));

                return Create(host.op, operands.ToArray());
            }

            return null;
        }

        private Instruction Create(IToken op, params Operand[] operands)
        {
            if (op == null || Array.IndexOf(operands, null) >= 0) return null;

            return new Instruction((OpCode)Enum.Parse(typeof(OpCode), op.Text), index, operands);
        }

        private static Operand Operand(ASMParser.OperandContext ctx)
        {
            var variable = ctx as ASMParser.VariableOperandContext;
            if (variable != null)
            {
                var name = Text(variable.ID());
                if (name == null) return null;

                if (variable.index() == null)
                    return new Operand(OperandType.Variable, name);

                var index = variable.index();
                object offset = index.INT() != null ? (object)int.Parse(index.INT().GetText()) : index.GetText();

                return new Operand(OperandType.Variable, name, offset);
            }

            if (ctx is ASMParser.IntOperandContext)
                return new Operand(OperandType.Literal, int.Parse(ctx.GetText()));

            if (ctx is ASMParser.TrueOperandContext)
                return new Operand(OperandType.Literal, true);

            if (ctx is ASMParser.FalseOperandContext)
                return new Operand(OperandType.Literal, false);

            if (ctx is ASMParser.FloatOperandContext)
                return new Operand(OperandType.Literal, float.Parse(ctx.GetText()));

            if (ctx is ASMParser.StringOperandContext)
            {
                var text = ctx.GetText();
                return new Operand(OperandType.Literal, text.Substring(1, text.Length - 2));
            }

            return null;
        }

        private void ResolveLabels()
        {
            foreach (var instruction in Instructions)
            {
                if (!instruction.OpCode.ToString().StartsWith("J")) continue;

                var operand = instruction.Operands[0];
                var name = operand.Value.ToString();

                int target;
                if (!Labels.TryGetValue(name, out target))
                    throw new Exception(string.Format("Rótulo '{0}' não encontrado no assembly.", name));

                operand.Value = target;
                operand.Type = OperandType.InstructionRef;
            }
        }

        // Tokens "conjurados" pela recuperação de erro têm índice -1 e texto "<missing ...>".
        private static string Text(ITerminalNode node)
        {
            return node == null || node.Symbol.TokenIndex < 0 ? null : node.GetText();
        }

        private sealed class CollectingErrorListener : IAntlrErrorListener<IToken>, IAntlrErrorListener<int>
        {
            private readonly List<string> errors;

            public CollectingErrorListener(List<string> errors)
            {
                this.errors = errors;
            }

            public void SyntaxError(TextWriter output, IRecognizer recognizer, IToken offendingSymbol,
                                    int line, int charPositionInLine, string msg, RecognitionException e)
            {
                errors.Add(string.Format("linha {0}:{1} {2}", line, charPositionInLine, msg));
            }

            public void SyntaxError(TextWriter output, IRecognizer recognizer, int offendingSymbol,
                                    int line, int charPositionInLine, string msg, RecognitionException e)
            {
                errors.Add(string.Format("linha {0}:{1} {2}", line, charPositionInLine, msg));
            }
        }
    }
}
