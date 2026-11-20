import React from "react";
import { Img, staticFile, useCurrentFrame, interpolate } from "remotion";
import { Cena } from "../componentes/Base";
import { cor, fonteMono } from "../tema";
import { entrada, surgir, useCues } from "../tempo";

export const Abertura: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = useCues("abertura");
  const tPergunta = cue("pergunta");
  const tRaiox = cue("raiox");

  const fase1 = 1 - entrada(frame, tRaiox - 10, 20);
  const pergunta = entrada(frame, tPergunta, 20);
  const fase2 = entrada(frame, tRaiox, 30);

  return (
    <Cena id="abertura">
      {/* Programa → ? → resultado */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 60,
          opacity: fase1,
        }}
      >
        <div style={{ ...surgir(frame, 10), fontFamily: fonteMono, fontSize: 56, background: cor.painel, border: `2px solid ${cor.borda}`, borderRadius: 20, padding: "34px 44px" }}>
          <span style={{ color: cor.ciano }}>imprima</span>(<span style={{ color: "#82aaff" }}>fatorial</span>(<span style={{ color: cor.laranja }}>3</span>))
        </div>
        <div style={{ ...surgir(frame, 35), fontSize: 90, color: cor.suave, position: "relative", width: 240, textAlign: "center" }}>
          <span style={{ opacity: 1 - pergunta }}>→</span>
          <span
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              color: cor.laranja,
              fontWeight: 800,
              opacity: pergunta,
              scale: interpolate(pergunta, [0, 1], [0.4, 1]),
            }}
          >
            ?
          </span>
        </div>
        <div style={{ ...surgir(frame, 55), fontFamily: fonteMono, fontSize: 96, fontWeight: 700, color: cor.verde, background: cor.painel, border: `2px solid ${cor.borda}`, borderRadius: 20, padding: "20px 56px" }}>
          6
        </div>
      </div>

      {/* Título */}
      <div style={{ position: "absolute", inset: 0, opacity: fase2 }}>
        <Img
          src={staticFile("raiox/editor.png")}
          style={{
            position: "absolute",
            width: 1300,
            right: -140,
            top: 260,
            borderRadius: 16,
            border: `2px solid ${cor.borda}`,
            boxShadow: "0 40px 120px #000c",
            opacity: 0.55,
            rotate: "-4deg",
            translate: `${(1 - fase2) * 120}px 0px`,
          }}
        />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, ${cor.fundo} 35%, ${cor.fundo}00 75%)` }} />
        <div style={{ position: "absolute", left: 120, top: 270, width: 1000 }}>
          <div style={{ ...surgir(frame, tRaiox + 5), fontSize: 30, fontWeight: 700, letterSpacing: 5, textTransform: "uppercase", color: cor.azulClaro }}>
            NPortugol · Raio-X
          </div>
          <div style={{ ...surgir(frame, tRaiox + 12, 40), fontSize: 104, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2, marginTop: 20 }}>
            Por dentro de uma linguagem de programação
          </div>
          <div style={{ display: "flex", gap: 22, marginTop: 50, fontSize: 38, fontWeight: 600 }}>
            {[
              ["Linguagem", cor.roxo],
              ["Compilador", cor.azul],
              ["Máquina virtual", cor.laranja],
            ].map(([t, c], i) => (
              <div
                key={t}
                style={{
                  ...surgir(frame, tRaiox + 30 + i * 10),
                  padding: "14px 30px",
                  borderRadius: 999,
                  border: `2px solid ${c}`,
                  background: `${c}22`,
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Cena>
  );
};
