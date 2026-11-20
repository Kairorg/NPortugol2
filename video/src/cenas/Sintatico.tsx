import React from "react";
import { Img, staticFile, useCurrentFrame, interpolate, Easing } from "remotion";
import { Cena, Painel, Titulo } from "../componentes/Base";
import { Codigo } from "../componentes/Codigo";
import { cor } from "../tema";
import { entrada, surgir, useCues } from "../tempo";

const REGRA = `declareFunction
    : 'função' name=ID '(' functionParamList* ')'
      statement* 'fim'
    ;`;

export const Sintatico: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = useCues("sintatico");
  const tGram = cue("gramatica");
  const tArv = cue("arvore");
  const tPrec = cue("precedencia");

  const arvore = entrada(frame, tArv - 10, 30);
  // Zoom da captura do Raio-X: visão geral → subárvore de "retorne fatorial(x - 1) * x".
  const zoom = interpolate(frame, [tPrec - 10, tPrec + 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });
  const escala = interpolate(zoom, [0, 1], [0.78, 1.35]);
  const origem = `${interpolate(zoom, [0, 1], [50, 52])}% ${interpolate(zoom, [0, 1], [50, 58])}%`;

  return (
    <Cena id="sintatico">
      <Titulo etapa="3 · Análise sintática">Tokens viram uma árvore</Titulo>

      <div style={{ position: "absolute", left: 100, top: 280, width: 1100, opacity: 1 - arvore, ...surgir(frame, tGram) }}>
        <Painel titulo="Regra da gramática">
          <Codigo codigo={REGRA} lang="cs" tamanho={38} />
        </Painel>
        <div style={{ display: "flex", gap: 16, marginTop: 40, fontSize: 32, flexWrap: "wrap" }}>
          {["função", "nome", "(parâmetros)", "comandos…", "fim"].map((p, i) => (
            <span key={p} style={{ ...surgir(frame, tGram + 15 + i * 8), padding: "12px 24px", borderRadius: 12, background: `${cor.azul}22`, border: `2px solid ${cor.azul}` }}>
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* Captura real do Raio-X */}
      <div
        style={{
          position: "absolute",
          left: 100,
          top: 230,
          width: 1720,
          height: 780,
          borderRadius: 20,
          overflow: "hidden",
          border: `2px solid ${cor.borda}`,
          boxShadow: "0 40px 120px #000c",
          opacity: arvore,
          translate: `0px ${(1 - arvore) * 60}px`,
        }}
      >
        <Img
          src={staticFile("raiox/arvore-completa.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "0% 30%", scale: escala, transformOrigin: origem }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          right: 130,
          bottom: 90,
          opacity: entrada(frame, tPrec + 20),
        }}
      >
        <Painel style={{ borderColor: cor.laranja }}>
          <div style={{ fontSize: 34, fontWeight: 600 }}>
            <span style={{ color: cor.laranja }}>*</span> fica no topo · <span style={{ color: cor.laranja }}>−</span> fica dentro do argumento
          </div>
        </Painel>
      </div>
    </Cena>
  );
};
