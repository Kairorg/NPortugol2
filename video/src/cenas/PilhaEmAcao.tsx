import React from "react";
import { useCurrentFrame } from "remotion";
import { Arquivo, Cena, Painel, Titulo } from "../componentes/Base";
import { Codigo } from "../componentes/Codigo";
import { Pilha, ItemPilha } from "../componentes/Pilha";
import { cor, fonteMono } from "../tema";
import { entrada, janela, surgir, useCues } from "../tempo";

// Trechos de src/NPortugol/Runtime/Executor.cs.
const PUSH = `private void ProcessPUSH()
{
    var operand = Instruction.Operands[0];
    var @new = new Operand(OperandType.Literal, operand.Value);

    if (operand.Type == OperandType.Variable)
        @new.Value = opResolver.At(0).Value();

    if (@new.Value == null)
        new Ops().ThrowVarNonInit(operand.Value.ToString());

    context.Runnable.ParamStack.Push(@new);
}`;

const ARITMETICA = `private void ProcessArithmetic(bool stack)
{
    float f1, f2;
    if (stack)
    {
        var op2 = ParamStack.Pop() as Operand;
        var op1 = ParamStack.Pop() as Operand;
        f1 = float.Parse(op1.Value.ToString());
        f2 = float.Parse(op2.Value.ToString());
    }
    // ... (sem pilha: operandos na própria instrução)
    switch (context.CurrentInst.OpCode)
    {
        case OpCode.SSUB:
        case OpCode.SUB: f1 -= f2; break;
        case OpCode.SMUL:
        case OpCode.MUL: f1 *= f2; break;
        // ...
    }
    if (stack)
        ParamStack.Push(new Operand(OperandType.Literal, f1));
}`;

export const PilhaEmAcao: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = useCues("pilha");
  const tPush = cue("push");
  const tArit = cue("aritmetica");
  const tEx = cue("exemplo");
  const tUm = cue("um");
  const tSsub = cue("ssub");

  const trocar = entrada(frame, tArit - 8, 16);

  // Passeio pelas linhas do PUSH
  const fatia = (tArit - tPush) / 4;
  const destaquePush = (l: number) =>
    Math.max(
      l === 3 || l === 4 ? janela(frame, tPush, tPush + fatia) : 0,
      l === 6 || l === 7 ? janela(frame, tPush + fatia, tPush + 2 * fatia) : 0,
      l === 12 ? janela(frame, tPush + 2 * fatia, tArit - 10) : 0,
    );

  // Passeio pela aritmética: explicação geral e depois sincronizado com o SSUB
  const fa = (tEx - tArit) / 3;
  const destaqueArit = (l: number) =>
    Math.max(
      l === 6 || l === 7 ? janela(frame, tArit, tArit + fa) : 0,
      l === 14 || l === 15 ? janela(frame, tArit + fa, tArit + 2 * fa) : 0,
      l === 20 || l === 21 ? janela(frame, tArit + 2 * fa, tEx - 4) : 0,
      l === 6 ? janela(frame, tSsub, tSsub + 18, 4) : 0,
      l === 7 ? janela(frame, tSsub + 18, tSsub + 36, 4) : 0,
      l === 14 || l === 15 ? janela(frame, tSsub + 36, tSsub + 56, 4) : 0,
      l === 20 || l === 21 ? janela(frame, tSsub + 56, tSsub + 120, 4) : 0,
    );

  // Estado da pilha (topo primeiro)
  let itens: ItemPilha[] = [];
  let entradaTopo = 1;
  if (frame >= tEx) {
    itens = [{ chave: "3", texto: "3", sub: "x" }];
    entradaTopo = entrada(frame, tEx, 14);
  }
  if (frame >= tUm) {
    itens = [{ chave: "1", texto: "1" }, ...itens];
    entradaTopo = entrada(frame, tUm, 14);
  }
  if (frame >= tSsub + 18) itens = itens.filter((i) => i.chave !== "1");
  if (frame >= tSsub + 36) itens = [];
  if (frame >= tSsub + 56) {
    itens = [{ chave: "2", texto: "2", sub: "resultado" }];
    entradaTopo = entrada(frame, tSsub + 56, 14);
  }
  const saindo1 = janela(frame, tSsub, tSsub + 18, 1) * (1 - entrada(frame, tSsub + 4, 14));
  const conta = janela(frame, tSsub + 36, tSsub + 400, 6);

  return (
    <Cena id="pilha">
      <Titulo etapa="8 · Executar">Os métodos por dentro</Titulo>

      <Painel style={{ position: "absolute", left: 100, top: 220, width: 1150, padding: "20px 32px", opacity: 1 - trocar, ...(trocar < 1 ? surgir(frame, 5) : {}) }}>
        <Arquivo nome="Executor.cs · ProcessPUSH" />
        <Codigo codigo={PUSH} lang="cs" tamanho={26} alturaLinha={1.5} destaque={destaquePush} corDestaque={cor.rosa} />
      </Painel>
      <Painel style={{ position: "absolute", left: 100, top: 220, width: 1150, padding: "20px 32px", opacity: trocar }}>
        <Arquivo nome="Executor.cs · ProcessArithmetic" nota="trecho" />
        <Codigo codigo={ARITMETICA} lang="cs" tamanho={24} alturaLinha={1.38} destaque={destaqueArit} corDestaque={cor.verde} />
      </Painel>

      <div style={{ position: "absolute", left: 1340, top: 240, width: 480 }}>
        <div style={{ ...surgir(frame, tPush), marginBottom: 40 }}>
          <Painel titulo="Tabela de símbolos">
            <div style={{ fontFamily: fonteMono, fontSize: 36 }}>
              <span style={{ color: "#82aaff" }}>x</span> = <span style={{ color: cor.laranja, fontWeight: 700 }}>3</span>
            </div>
          </Painel>
        </div>
        <div style={{ ...surgir(frame, tPush + 10), position: "relative" }}>
          <Pilha titulo="Pilha de avaliação" itens={itens} entradaTopo={entradaTopo} corItem={cor.verde} largura={360} alturaItem={78} tamanho={40} />
          {saindo1 > 0 ? (
            <div style={{ position: "absolute", left: 380, top: 60, fontFamily: fonteMono, fontSize: 40, fontWeight: 700, opacity: saindo1, color: cor.verde }}>
              op2 = 1
            </div>
          ) : null}
        </div>
        <div style={{ marginTop: 30, fontFamily: fonteMono, fontSize: 40, opacity: conta }}>
          f1 = 3 − 1 = <span style={{ color: cor.verde, fontWeight: 700 }}>2</span>
        </div>
        <div style={{ marginTop: 26, display: "flex", gap: 14, fontFamily: fonteMono, fontSize: 30 }}>
          {[
            ["PUSH x", tEx, tUm],
            ["PUSH 1", tUm, tSsub],
            ["SSUB", tSsub, tSsub + 500],
          ].map(([t, a, b]) => (
            <span
              key={t as string}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                border: `2px solid ${cor.borda}`,
                background: janela(frame, a as number, b as number, 4) > 0.5 ? `${cor.laranja}44` : "transparent",
                opacity: entrada(frame, tEx - 10),
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </Cena>
  );
};
