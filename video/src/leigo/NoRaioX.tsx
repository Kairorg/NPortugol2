import React from "react";
import { Img, staticFile, useCurrentFrame, interpolate, Easing } from "remotion";
import { Cena, Nota, Titulo } from "../componentes/Base";
import { cor } from "../tema";
import { ATRASO_FALA, entrada, infoCena, useCues } from "../tempo";
import { trace } from "../data/trace";

const ease = Easing.bezier(0.65, 0, 0.35, 1);

export const NoRaioX: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = useCues("leigo-raiox");
  const tCod = cue("codigo");
  const tPas = cue("passos");
  const tDep = cue("depurar");
  const fim = Math.round((ATRASO_FALA + infoCena("leigo-raiox").duracao) * 30);

  const k = Math.floor(interpolate(frame, [tDep + 10, fim], [0, trace.length - 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const src = frame < tDep + 10 ? "raiox/editor.png" : k >= trace.length - 1 ? "raiox/saida.png" : `raiox/passos/${trace[k].file}`;

  const p = (a: number, b: number) => interpolate(frame, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  // Câmera: código (esquerda) → passos (direita) → visão geral durante a depuração
  const zCod = p(tCod - 5, tCod + 20) * (1 - p(tPas - 5, tPas + 20));
  const zPas = p(tPas - 5, tPas + 20) * (1 - p(tDep - 5, tDep + 20));
  const escala = 1 + zCod * 0.5 + zPas * 0.6;
  const ox = 50 - zCod * 30 + zPas * 50;
  const oy = 50 - zCod * 50 - zPas * 40;

  return (
    <Cena id="leigo-raiox">
      <Titulo etapa="Veja por dentro">O Raio-X do NPortugol</Titulo>
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
      <Nota visivel={entrada(frame, tCod) * (1 - entrada(frame, tPas - 5))} style={{ bottom: 40 }}>
        o seu programa
      </Nota>
      <Nota visivel={entrada(frame, tPas) * (1 - entrada(frame, tDep - 5))} style={{ bottom: 40 }}>
        os passos que o tradutor criou
      </Nota>
      <Nota visivel={entrada(frame, tDep + 5)} style={{ bottom: 40 }}>
        um passo de cada vez, até o resultado
      </Nota>
    </Cena>
  );
};
