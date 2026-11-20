import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { Arquivo, Cena, Nota, Painel, Titulo } from "../componentes/Base";
import { Codigo } from "../componentes/Codigo";
import { Pilha } from "../componentes/Pilha";
import { cor, fonteMono } from "../tema";
import { entrada, janela, surgir, useCues } from "../tempo";
import { ASM } from "../dados";

// Trecho de src/NPortugol/Runtime/Executor.cs (ProcessBranching).
const CODIGO = `private void ProcessBranching()
{
    switch (Instruction.OpCode)
    {
        case OpCode.JMP:
            context.Runnable.IP = opResolver.At(0).IntValue();
            return;
        case OpCode.JNE:
            secondOp = (Operand)ParamStack.Pop();
            firstOp = (Operand)ParamStack.Pop();

            if (firstOp.Value.ToString() != secondOp.Value.ToString())
                context.Runnable.IP = opResolver.At(0).IntValue();
            return;
        // ... JE, JG, JL, JGE, JLE
    }
}`;

const TRECHO = ASM.filter((l) => l.i >= 10 && l.i <= 16);
const ALT = 64;

export const Desvio: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = useCues("desvio");
  const tJne = cue("jne");
  const tIp = cue("ip");
  const tSalto = cue("salto");
  const tConc = cue("conclusao");

  const destaque = (l: number) =>
    Math.max(l >= 8 && l <= 10 ? janela(frame, tJne, tIp - 4) : 0, l === 12 || l === 13 ? janela(frame, tIp, tConc + 400) : 0);

  const pop = entrada(frame, tJne + 25, 20);
  const salto = interpolate(frame, [tSalto, tSalto + 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });
  const ipValor = frame >= tIp + 20 ? 15 : 13;
  // posição do marcador: instrução 12 (índice 2 no trecho) → instrução 15 (índice 5)
  const posMarcador = interpolate(salto, [0, 1], [2, 5]);

  return (
    <Cena id="desvio">
      <Titulo etapa="9 · Desvios">Saltar é só mudar o IP</Titulo>

      <Painel style={{ position: "absolute", left: 100, top: 230, width: 1130, padding: "22px 34px", ...surgir(frame, 5) }}>
        <Arquivo nome="Executor.cs · ProcessBranching" nota="trecho" />
        <Codigo codigo={CODIGO} lang="cs" tamanho={25} alturaLinha={1.5} destaque={destaque} corDestaque={cor.laranja} />
      </Painel>

      <div style={{ position: "absolute", left: 1290, top: 240, width: 540, ...surgir(frame, tJne - 10) }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 3, color: cor.suave, textTransform: "uppercase", marginBottom: 12 }}>Instruções</div>
        <div style={{ position: "relative", paddingLeft: 60 }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: posMarcador * ALT + 8,
              fontSize: 40,
              color: cor.laranja,
            }}
          >
            ▶
          </div>
          {TRECHO.map((l, k) => (
            <div
              key={l.i}
              style={{
                height: ALT,
                display: "flex",
                alignItems: "center",
                gap: 20,
                fontFamily: fonteMono,
                fontSize: 34,
                borderRadius: 10,
                paddingLeft: 14,
                background: Math.abs(posMarcador - k) < 0.3 ? `${cor.laranja}30` : "transparent",
                color: l.i === 13 || l.i === 14 ? (salto > 0.5 ? cor.suave : cor.texto) : cor.texto,
                textDecoration: (l.i === 13 || l.i === 14) && salto > 0.9 ? "line-through" : undefined,
              }}
            >
              <span style={{ color: cor.suave, width: 40, fontSize: 26 }}>{l.i}</span>
              <span style={{ color: l.texto.startsWith(".") ? cor.suave : undefined }}>{l.texto}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 30, marginTop: 40, alignItems: "flex-start" }}>
          <Pilha
            titulo="Pilha"
            largura={200}
            alturaItem={60}
            tamanho={32}
            corItem={cor.verde}
            itens={pop < 0.5 ? [{ chave: "0", texto: "0" }, { chave: "3", texto: "3", sub: "x" }] : []}
          />
          <div style={{ marginTop: 40 }}>
            <div style={{ fontFamily: fonteMono, fontSize: 34, opacity: entrada(frame, tIp) }}>
              3 ≠ 0 → <span style={{ color: cor.laranja }}>salta</span>
            </div>
            <div
              style={{
                marginTop: 24,
                borderRadius: 14,
                border: `3px solid ${cor.laranja}`,
                padding: "10px 22px",
                fontFamily: fonteMono,
                fontSize: 40,
                fontWeight: 700,
                background: frame >= tIp + 20 && frame < tIp + 40 ? `${cor.laranja}55` : `${cor.laranja}1c`,
                opacity: entrada(frame, tJne),
              }}
            >
              IP = {ipValor}
            </div>
          </div>
        </div>
      </div>

      <Nota visivel={entrada(frame, tConc)}>
        <span style={{ color: cor.roxo }}>se</span>, <span style={{ color: cor.roxo }}>enquanto</span>, <span style={{ color: cor.roxo }}>para</span> = comparações + saltos
      </Nota>
    </Cena>
  );
};
