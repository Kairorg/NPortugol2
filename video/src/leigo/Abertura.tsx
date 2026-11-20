import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { Cena } from "../componentes/Base";
import { cor, fonteMono } from "../tema";
import { entrada, surgir, useCues } from "../tempo";

const APPS = [
  { e: "🎮", t: "jogos" },
  { e: "📱", t: "celular" },
  { e: "🏦", t: "banco" },
  { e: "💬", t: "mensagens" },
];

const LINHAS = ["função principal()", "    variável nome", '    nome = "mundo"', '    imprima("Olá, ", nome, "!")', "fim"];

export const LeigoAbertura: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = useCues("leigo-abertura");
  const tPerg = cue("pergunta");
  const tTema = cue("tema");

  const viraTexto = entrada(frame, 150, 30);
  const sai = 1 - entrada(frame, tTema - 8, 18);

  return (
    <Cena id="leigo-abertura">
      <div style={{ position: "absolute", inset: 0, opacity: sai }}>
        {/* Apps */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", justifyContent: "center", gap: 70, opacity: 1 - viraTexto * 0.85 }}>
          {APPS.map((a, i) => (
            <div key={a.t} style={{ ...surgir(frame, 10 + i * 10, 40), textAlign: "center" }}>
              <div
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: 48,
                  background: cor.painel,
                  border: `2px solid ${cor.borda}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 110,
                  scale: interpolate(viraTexto, [0, 1], [1, 0.7]),
                }}
              >
                {a.e}
              </div>
              <div style={{ fontSize: 36, marginTop: 18, color: cor.suave }}>{a.t}</div>
            </div>
          ))}
        </div>
        {/* ...começaram como texto */}
        <div
          style={{
            position: "absolute",
            left: 560,
            top: 330,
            width: 800,
            padding: "30px 40px",
            borderRadius: 20,
            background: `${cor.painel}f5`,
            border: `2px solid ${cor.borda}`,
            fontFamily: fonteMono,
            fontSize: 40,
            lineHeight: 1.6,
            opacity: viraTexto,
            translate: `0px ${(1 - viraTexto) * 40}px`,
            whiteSpace: "pre",
          }}
        >
          {LINHAS.map((l, i) => (
            <div key={i} style={{ opacity: entrada(frame, 160 + i * 8, 12) }}>
              {l}
            </div>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 760,
            textAlign: "center",
            fontSize: 120,
            fontWeight: 800,
            color: cor.laranja,
            opacity: entrada(frame, tPerg),
            scale: interpolate(entrada(frame, tPerg), [0, 1], [0.5, 1]),
          }}
        >
          ?
        </div>
      </div>

      <div style={{ position: "absolute", left: 120, right: 120, top: 330, textAlign: "center" }}>
        <div style={{ ...surgir(frame, tTema), fontSize: 32, fontWeight: 700, letterSpacing: 5, textTransform: "uppercase", color: cor.azulClaro }}>
          NPortugol · para todos
        </div>
        <div style={{ ...surgir(frame, tTema + 8, 40), fontSize: 110, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, marginTop: 24 }}>
          Como o computador entende o que você escreve
        </div>
      </div>
    </Cena>
  );
};
