using System.Collections.Generic;
using System.Linq;
using NUnit.Framework;

namespace NPortugol.Tests
{
    /// <summary>
    /// Comportamentos fixados na migração para ANTLR 4: bugs da versão ANTLR 3 que geravam
    /// assembly incorreto e o novo tratamento de erros de compilação.
    /// </summary>
    [TestFixture]
    public class CompilerRegressionTestCase
    {
        private static IList<string> Compile(string body)
        {
            var code = "função principal()\n  variável x, y, i, n\n" + body + "\nfim\n";

            return new Npc().Compilar(code).Script;
        }

        // Só o corpo: sem "main:", "EMP", as quatro declarações e o RET final.
        private static string Asm(string body)
        {
            var lines = Compile(body);

            return string.Join(" | ", lines.Skip(6).Take(lines.Count - 7));
        }

        #region bugs corrigidos

        [Test]
        public void Se_Senao_Deve_Emitir_Todos_Os_Comandos_Do_Bloco_Entao()
        {
            var asm = Asm("se x == 1 então\n y = 1\n x = 2\nsenão\n y = 3\nfim");

            Assert.AreEqual("PUSH x | PUSH 1 | JNE label_0 | PUSH 1 | POP y | PUSH 2 | POP x | JMP label_1 | " +
                            ".label_0 | PUSH 3 | POP y | .label_1", asm);
        }

        [Test]
        public void Se_Com_Entao_Vazio_E_Senao_Deve_Compilar()
        {
            var asm = Asm("se x == 1 então\nsenão\n y = 3\nfim");

            Assert.AreEqual("PUSH x | PUSH 1 | JNE label_0 | JMP label_1 | .label_0 | PUSH 3 | POP y | .label_1", asm);
        }

        [Test]
        public void Se_Dentro_De_Repita_Nao_Deve_Inverter_A_Condicao()
        {
            var asm = Asm("repita\n se x == 1 então\n  y = 2\n fim\n x = x + 1\naté x == 3");

            StringAssert.Contains("PUSH x | PUSH 1 | JNE label_1", asm);
            StringAssert.Contains("PUSH x | PUSH 3 | JE label_2 | JMP label_0", asm);
        }

        [Test]
        public void Repita_Aninhado_Nao_Deve_Inverter_A_Condicao_Externa()
        {
            var asm = Asm("repita\n repita\n  x = x + 1\n até x == 3\naté y == 2");

            StringAssert.Contains("PUSH x | PUSH 3 | JE label_2 | JMP label_1", asm);
            StringAssert.Contains("PUSH y | PUSH 2 | JE label_3 | JMP label_0", asm);
        }

        [Test]
        public void Para_Com_Expressao_Inicial_Deve_Usar_A_Variavel_Do_Laco()
        {
            var asm = Asm("para i = n - 1 até 0 decrescente\n n = n + 1\nfim");

            StringAssert.Contains(".label_0 | PUSH i | PUSH 0 | JLE label_1", asm);
            StringAssert.Contains("DEC i | JMP label_0", asm);
        }

        [Test]
        public void Segundo_Selecione_Nao_Deve_Empilhar_Valor_Extra()
        {
            var asm = Asm("selecione x\n caso 1:\n  y = 1\n fim\nfim\nselecione x\n caso 1:\n  y = 1\n fim\nfim");

            StringAssert.Contains(".label_0 | PUSH x | PUSH 1 | JNE label_3", asm);
        }

        [Test]
        public void Intervalo_Sem_Espacos_Deve_Compilar()
        {
            var asm = Asm("x = [1..3]");

            Assert.AreEqual("MOV x:0; 1 | MOV x:1; 2 | MOV x:2; 3", asm);
        }

        [Test]
        public void Se_Sem_Entao_Continua_Aceito()
        {
            var asm = Asm("se x == 0 retorne 1 fim");

            Assert.AreEqual("PUSH x | PUSH 0 | JNE label_0 | PUSH 1 | RET | .label_0", asm);
        }

        #endregion

        #region erros de compilação

        [Test]
        public void Erro_De_Sintaxe_Informa_Linha_Coluna_E_Trecho()
        {
            var e = Assert.Throws<CompilationException>(() => new Npc().Compilar("função principal()\n  x = \nfim"));

            Assert.AreEqual(3, e.Line);
            Assert.AreEqual(0, e.Column);
            Assert.AreEqual("fim", e.OffendingText);
            Assert.AreEqual("Erro na linha 3 posição 0: 'fim'. Certifique-se de acentuar as palavras.", e.Message);
        }

        [Test]
        public void Caractere_Invalido_Gera_Erro_Em_Vez_De_Ser_Ignorado()
        {
            var e = Assert.Throws<CompilationException>(() => new Npc().Compilar("função principal()\n  x = 1 @\nfim"));

            Assert.AreEqual(2, e.Line);
            Assert.AreEqual(8, e.Column);
            Assert.AreEqual("@", e.OffendingText);
        }

        [Test]
        public void Declaracao_Sem_Nome_Gera_Erro()
        {
            Assert.Throws<CompilationException>(() => new Npc().Compilar("função principal()\n  variável\nfim"));
        }

        [Test]
        public void Palavra_Sem_Acento_Gera_Erro()
        {
            var e = Assert.Throws<CompilationException>(() => new Npc().Compilar("funcao principal()\nfim"));

            Assert.AreEqual(1, e.Line);
            Assert.AreEqual("funcao", e.OffendingText);
        }

        [Test]
        public void Condicao_Sem_Comparacao_Gera_Erro()
        {
            var e = Assert.Throws<CompilationException>(() => Compile("se x então\n y = 1\nfim"));

            Assert.AreEqual(3, e.Line);
            StringAssert.Contains("a condição deve ser uma comparação", e.Message);
        }

        [Test]
        public void Operador_E_Ainda_Nao_Suportado()
        {
            var e = Assert.Throws<CompilationException>(() => Compile("se x == 1 e y == 2 então\n y = 1\nfim"));

            StringAssert.Contains("o operador 'e' ainda não é suportado", e.Message);
        }

        [Test]
        public void Comparacao_Encadeada_Gera_Erro()
        {
            var e = Assert.Throws<CompilationException>(() => Compile("se x < y < 3 então\n y = 1\nfim"));

            StringAssert.Contains("comparações encadeadas não são suportadas", e.Message);
        }

        #endregion

        #region limite de instruções

        [Test]
        public void Laco_Infinito_Para_No_Limite_De_Instrucoes()
        {
            var motor = new NPortugol.Runtime.Motor { MaxInstructions = 1000 };
            motor.Compilar("função principal()\n  enquanto 1 < 2\n  fim\nfim");

            var e = Assert.Throws<NPortugol.Runtime.Exceptions.RuntimeException>(() => motor.Executar());

            StringAssert.Contains("limite de 1000 instruções", e.Message);
        }

        [Test]
        public void Sem_Limite_Programa_Termina_Normalmente()
        {
            var motor = new NPortugol.Runtime.Motor();
            motor.Compilar("função principal()\n  variável i\n  para i = 0 até 5000\n  fim\nfim");

            Assert.DoesNotThrow(() => motor.Executar());
        }

        #endregion
    }
}
