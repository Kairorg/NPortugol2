import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { Cena, Painel, Titulo } from "../componentes/Base";
import { cor, fonteMono } from "../tema";
import { entrada, surgir, useCues } from "../tempo";

const PASSOS = ["separe 7", "separe 3", "some os dois", "guarde na caixa total", "mostre total"];
// O que o bloquinho tem depois de cada passo
const BLOCO = [["7"], ["7", "3"], ["10"], ["total = 10"], ["total = 10", "tela: 10"]];

export const Maquina: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = useCues("leigo-maquina");
  const tCoz = cue("cozinheiro");
  const tDedo = cue("dedo");
  const tAnota = cue("anota");
  const tProx = cue("proximo");
  const tRap = cue("rapido");

  // Passo atual: avança devagar a partir de "dedo" e chega ao fim antes de "rápido"
  const passo = Math.floor(interpolate(frame, [tDedo, tRap - 10], [0, PASSOS.length - 0.01], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const rapido = entrada(frame, tRap, 20);
  const contador = Math.floor(interpolate(frame, [tRap, tRap + 150], [0, 3_000_000], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const piscar = frame >= tRap ? Math.floor(frame / 2) % PASSOS.length : passo;

  return (
    <Cena id="leigo-maquina">
      <Titulo etapa="A máquina">Um cozinheiro rápido e obediente</Titulo>

      <div style={{ position: "absolute", left: 120, top: 300, ...surgir(frame, tCoz, 40), fontSize: 220 }}>👩‍🍳</div>

      <Painel titulo="Passos" style={{ position: "absolute", left: 480, top: 260, width: 760, ...surgir(frame, tCoz + 10) }}>
        {PASSOS.map((p, i) => {
          const atual = i === piscar && frame >= tDedo;
          return (
            <div key={p} style={{ position: "relative", display: "flex", alignItems: "center", gap: 20, fontSize: 44, padding: "14px 20px", borderRadius: 12, background: atual ? `${cor.laranja}30` : "transparent" }}>
              <span style={{ position: "absolute", left: -90, fontSize: 56, opacity: atual ? 1 : 0 }}>👉</span>
              <span style={{ fontFamily: fonteMono, color: cor.suave, width: 40 }}>{i + 1}</span>
              <span style={{ opacity: i <= passo || frame >= tRap ? 1 : 0.5 }}>{p}</span>
            </div>
          );
        })}
      </Painel>

      <Painel titulo="📝 Bloquinho" style={{ position: "absolute", left: 1320, top: 260, width: 480, minHeight: 300, opacity: entrada(frame, tAnota) }}>
        {(frame >= tDedo ? BLOCO[passo] : []).map((v) => (
          <div key={v} style={{ fontFamily: fonteMono, fontSize: 44, fontWeight: 700, padding: "6px 0" }}>
            {v}
          </div>
        ))}
      </Painel>
      <div style={{ position: "absolute", left: 1320, top: 600, width: 480, fontSize: 32, color: cor.suave, opacity: entrada(frame, tProx) }}>
        ✓ terminou um passo → vai para o próximo
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, bottom: 90, textAlign: "center", opacity: rapido }}>
        <div style={{ fontFamily: fonteMono, fontSize: 90, fontWeight: 800, color: cor.laranja }}>{contador.toLocaleString("pt-BR")}</div>
        <div style={{ fontSize: 40, color: cor.suave }}>passos — e ainda não passou um segundo</div>
      </div>
    </Cena>
  );
};
