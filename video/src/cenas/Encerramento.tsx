import React from "react";
import { useCurrentFrame } from "remotion";
import { Cena } from "../componentes/Base";
import { cor, fonteMono } from "../tema";
import { surgir, useCues } from "../tempo";

export const Encerramento: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = useCues("encerramento");

  const colunas = [
    { inicio: 15, titulo: "Linguagem", c: cor.roxo, itens: ["sintaxe", "semântica"] },
    { inicio: cue("compilador"), titulo: "Compilador", c: cor.azul, itens: ["tokens", "árvore", "instruções"] },
    { inicio: cue("vm"), titulo: "Máquina virtual", c: cor.laranja, itens: ["busca", "decodifica", "executa"] },
  ];
  const tConv = cue("convite");

  return (
    <Cena id="encerramento">
      <div style={{ position: "absolute", left: 100, right: 100, top: 160, display: "flex", gap: 40 }}>
        {colunas.map((col) => (
          <div
            key={col.titulo}
            style={{
              ...surgir(frame, col.inicio, 40),
              flex: 1,
              borderRadius: 24,
              border: `3px solid ${col.c}`,
              background: `${col.c}14`,
              padding: "40px 44px",
            }}
          >
            <div style={{ fontSize: 52, fontWeight: 800 }}>{col.titulo}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 30 }}>
              {col.itens.map((it, i) => (
                <div key={it} style={{ ...surgir(frame, col.inicio + 10 + i * 8, 15), fontSize: 38, color: cor.suave }}>
                  <span style={{ color: col.c }}>●</span> {it}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, top: 700, textAlign: "center" }}>
        <div style={{ ...surgir(frame, tConv, 30), fontSize: 72, fontWeight: 800, letterSpacing: -1 }}>Abra o Raio-X e veja por dentro</div>
        <div style={{ ...surgir(frame, tConv + 15, 30), fontFamily: fonteMono, fontSize: 44, color: cor.azulClaro, marginTop: 24 }}>
          kairorg.github.io/NPortugol2
        </div>
      </div>
    </Cena>
  );
};
