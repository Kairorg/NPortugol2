import React from "react";
import { useCurrentFrame } from "remotion";
import { Cena } from "../componentes/Base";
import { cor, fonteMono } from "../tema";
import { surgir, useCues } from "../tempo";

export const Fim: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = useCues("leigo-encerramento");
  const itens = [
    { cue: "receita", e: "📝", t: "Uma receita exata", c: cor.roxo },
    { cue: "traducao", e: "🧑‍🏫", t: "Traduzida em passos simples", c: cor.azul },
    { cue: "execucao", e: "👩‍🍳", t: "Seguida um passo por vez", c: cor.laranja },
  ];
  const tConv = cue("convite");

  return (
    <Cena id="leigo-encerramento">
      <div style={{ position: "absolute", left: 120, right: 120, top: 170, display: "flex", gap: 40 }}>
        {itens.map((it) => (
          <div
            key={it.cue}
            style={{
              ...surgir(frame, cue(it.cue), 40),
              flex: 1,
              textAlign: "center",
              borderRadius: 26,
              border: `3px solid ${it.c}`,
              background: `${it.c}14`,
              padding: "40px 30px",
            }}
          >
            <div style={{ fontSize: 120 }}>{it.e}</div>
            <div style={{ fontSize: 44, fontWeight: 800, marginTop: 16 }}>{it.t}</div>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 690, textAlign: "center" }}>
        <div style={{ ...surgir(frame, tConv, 30), fontSize: 76, fontWeight: 800, letterSpacing: -1 }}>Escreva o seu primeiro programa</div>
        <div style={{ ...surgir(frame, tConv + 15, 30), fontFamily: fonteMono, fontSize: 44, color: cor.azulClaro, marginTop: 24 }}>
          kairorg.github.io/NPortugol2
        </div>
      </div>
    </Cena>
  );
};
