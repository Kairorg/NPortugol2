using System.Linq;
using NPortugol.Runtime;
using NUnit.Framework;

namespace NPortugol.Tests.Runtime
{
    [TestFixture]
    public class SourceLineMapTestCase
    {
        // Linhas: 1 função principal() | 2 variável r | 3 r = soma(1, 2) | 4 imprima(r) | 5 fim
        //         6 (vazia) | 7 função soma(a, b) | 8 variável t | 9 t = a + b | 10 retorne t | 11 fim
        private const string Fonte =
            "função principal()\n  variável r\n  r = soma(1, 2)\n  imprima(r)\nfim\n\n" +
            "função soma(a, b)\n  variável t\n  t = a + b\n  retorne t\nfim";

        private Bytecode bytecode;
        private SourceLineMap mapa;

        [SetUp]
        public void Compilar()
        {
            bytecode = new Npc { DebugInfo = true }.Compilar(Fonte);
            mapa = SourceLineMap.FromBytecode(bytecode);
        }

        private int Indice(string instrucao, int aPartirDe = 0)
        {
            for (var i = aPartirDe; i < bytecode.Script.Count; i++)
                if (bytecode.Script[i] == instrucao) return i;

            Assert.Fail("Instrução não encontrada: " + instrucao);
            return -1;
        }

        [Test]
        public void Funcao_Sem_Parametros()
        {
            Assert.AreEqual(2, mapa.LineOf(Indice("DCL r")));
            Assert.AreEqual(3, mapa.LineOf(Indice("CALL soma")));
            Assert.AreEqual(4, mapa.LineOf(Indice("PUSH r")));
        }

        [Test]
        public void Funcao_Com_Parametros_Compensa_O_Prologo()
        {
            // Sem a compensação, "DCL t" ficaria sem linha e a linha 8 cairia em "DCL b".
            var inicioSoma = Indice("soma:");

            Assert.AreEqual(8, mapa.LineOf(Indice("DCL t", inicioSoma)));
            Assert.AreEqual(9, mapa.LineOf(Indice("PUSH a", inicioSoma)));
            Assert.AreEqual(9, mapa.LineOf(Indice("POP t", inicioSoma)));
            Assert.AreEqual(10, mapa.LineOf(Indice("PUSH t", inicioSoma)));
        }

        [Test]
        public void Cabecalho_E_Prologo_Nao_Tem_Linha()
        {
            var inicioSoma = Indice("soma:");

            Assert.IsNull(mapa.LineOf(Indice("main:")));
            Assert.IsNull(mapa.LineOf(inicioSoma));
            Assert.IsNull(mapa.LineOf(Indice("DCL b", inicioSoma)));
            Assert.IsNull(mapa.LineOf(Indice("POP a", inicioSoma)));
        }

        [Test]
        public void Instrucoes_Sem_Entrada_Herdam_A_Linha_Anterior()
        {
            var sadd = Indice("SADD");

            Assert.AreEqual(9, mapa.LineOf(sadd));
            Assert.IsFalse(mapa.IsExact(sadd));
            Assert.IsTrue(mapa.IsExact(Indice("PUSH a")));
        }

        [Test]
        public void Instrucoes_De_Uma_Linha()
        {
            var instrucoes = mapa.InstructionsOf(9).Select(i => bytecode.Script[i]).ToArray();

            CollectionAssert.AreEqual(new[] { "PUSH a", "PUSH b", "SADD", "POP t" }, instrucoes);
            CollectionAssert.IsEmpty(mapa.InstructionsOf(6));
        }

        [Test]
        public void Rotulos_Nao_Tem_Linha()
        {
            var compilado = new Npc { DebugInfo = true }.Compilar("função principal()\n  variável x\n  se x == 1 então\n    x = 2\n  fim\nfim");
            var mapaSe = SourceLineMap.FromBytecode(compilado);
            var codigo = compilado.Script;
            var rotulo = codigo.IndexOf(".label_0");

            Assert.IsNull(mapaSe.LineOf(rotulo));
            Assert.AreEqual(3, mapaSe.LineOf(codigo.IndexOf("JNE label_0")));
        }
    }
}
