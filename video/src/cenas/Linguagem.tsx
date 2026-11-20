import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { Cena, Painel, Titulo } from "../componentes/Base";
import { Codigo } from "../componentes/Codigo";
import { cor } from "../tema";
import { entrada, janela, surgir, useCues } from "../tempo";
import { PROGRAMA } from "../dados";

export const Linguagem: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = useCues("linguagem");
  const tSint = cue("sintaxe");
  const tSem = cue("semantica");
  const tProg = cue("programa");
  const tRec = cue("recursao");

  const caracteres = interpolate(frame, [10, tSint], [0, PROGRAMA.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const palavrasChave = janela(frame, tSint, tSem - 5);
  const programa = janela(frame, tProg, tRec - 3);
  const recursao = entrada(frame, tRec);

  return (
    <Cena id="linguagem">
      <Titulo etapa="1 · A linguagem">Um conjunto de regras</Titulo>

      <Painel style={{ position: "absolute", left: 100, top: 250, width: 920 }} titulo="Fatorial.np">
        <Codigo
          codigo={PROGRAMA}
          lang="np"
          tamanho={40}
          numeros
          caracteres={caracteres}
          destaque={(l) => Math.max(programa * (l === 2 ? 1 : 0), recursao * (l === 7 ? 1 : 0))}
        />
        {/* Destaque das palavras-chave durante "sintaxe" */}
        <div style={{ position: "absolute", inset: 0, borderRadius: 18, boxShadow: `0 0 0 4px ${cor.roxo}`, opacity: palavrasChave }} />
      </Painel>

      <div style={{ position: "absolute", left: 1110, top: 270, width: 710, display: "flex", flexDirection: "column", gap: 34 }}>
        <Painel style={{ ...surgir(frame, tSint), borderColor: palavrasChave > 0.5 ? cor.roxo : cor.borda }}>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 3, color: cor.roxo, textTransform: "uppercase" }}>Sintaxe</div>
          <div style={{ fontSize: 40, fontWeight: 600, marginTop: 10 }}>como se escreve</div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 20 }}>
            {["função", "fim", "se", "retorne"].map((p, i) => (
              <span
                key={p}
                style={{
                  ...surgir(frame, tSint + 8 + i * 6, 15),
                  fontFamily: "monospace",
                  fontSize: 32,
                  padding: "6px 18px",
                  borderRadius: 10,
                  background: `${cor.roxo}26`,
                  color: cor.roxo,
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </Painel>
        <Painel style={{ ...surgir(frame, tSem) }}>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 3, color: cor.verde, textTransform: "uppercase" }}>Semântica</div>
          <div style={{ fontSize: 40, fontWeight: 600, marginTop: 10 }}>o que cada coisa significa</div>
          <div style={{ fontSize: 30, color: cor.suave, marginTop: 14 }}>
            <span style={{ color: cor.roxo }}>retorne</span> x → devolve x para quem chamou
          </div>
        </Painel>
        <Painel style={{ ...surgir(frame, tRec), borderColor: cor.laranja }}>
          <div style={{ fontSize: 34, fontWeight: 600 }}>
            fatorial(3) = 3 × 2 × 1 × <span style={{ color: cor.laranja }}>1</span> = 6
          </div>
        </Painel>
      </div>
    </Cena>
  );
};
