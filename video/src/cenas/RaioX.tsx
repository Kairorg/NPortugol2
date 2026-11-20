import React from "react";
import { Img, staticFile, useCurrentFrame, interpolate, Easing } from "remotion";
import { Cena, Nota, Titulo } from "../componentes/Base";
import { cor } from "../tema";
import { entrada, useCues } from "../tempo";
import { trace } from "../data/trace";

const ease = Easing.bezier(0.65, 0, 0.35, 1);

export const RaioX: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = useCues("raiox");
  const tF11 = cue("f11");
  const tPaineis = cue("paineis");
  const tSaida = cue("saida");

  const k = Math.floor(interpolate(frame, [tF11, tSaida - 10], [0, trace.length - 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const src =
    frame < tF11 ? "raiox/editor.png" : frame >= tSaida ? "raiox/saida.png" : `raiox/passos/${trace[k].file}`;

  // Câmera: geral → assembly → painel de depuração → geral
  const p = (a: number, b: number) => interpolate(frame, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const zAsm = p(tF11 + 10, tF11 + 40) * (1 - p(tPaineis - 10, tPaineis + 20));
  const zDep = p(tPaineis - 10, tPaineis + 20) * (1 - p(tSaida - 15, tSaida + 10));
  const zSaida = p(tSaida, tSaida + 25);
  // Assembly + editor: ~75% da largura, à direita e em cima. Painel inferior: ~55% da largura, embaixo.
  const zBaixo = Math.min(1, zDep + zSaida);
  const escala = 1 + zAsm * 0.33 + zBaixo * 0.8;
  const ox = 50 + zAsm * 50 - zBaixo * 5;
  const oy = 50 - zAsm * 50 + zBaixo * 50;

  return (
    <Cena id="raiox">
      <Titulo etapa="12 · No Raio-X">Depurando instrução por instrução</Titulo>

      <div
        style={{
          position: "absolute",
          left: 210,
          top: 210,
          width: 1500,
          height: 844,
          borderRadius: 20,
          overflow: "hidden",
          border: `2px solid ${cor.borda}`,
          boxShadow: "0 40px 120px #000c",
          opacity: entrada(frame, 0, 20),
        }}
      >
        <Img src={staticFile(src)} style={{ width: "100%", height: "100%", scale: escala, transformOrigin: `${ox}% ${oy}%` }} />
      </div>

      <div style={{ position: "absolute", right: 110, top: 110, opacity: entrada(frame, tF11), display: "flex", gap: 14, alignItems: "center" }}>
        <span style={{ fontSize: 30, fontWeight: 800, padding: "8px 20px", borderRadius: 12, border: `3px solid ${cor.laranja}`, color: cor.laranja }}>F11</span>
        <span style={{ fontSize: 30, color: cor.suave }}>próxima instrução</span>
      </div>
      <Nota visivel={entrada(frame, tSaida + 20)} style={{ bottom: 40 }}>
        Experimente: <span style={{ color: cor.azulClaro }}>kairorg.github.io/NPortugol2</span>
      </Nota>
    </Cena>
  );
};
