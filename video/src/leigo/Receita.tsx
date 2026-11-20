import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { Cena, Painel, Titulo } from "../componentes/Base";
import { cor } from "../tema";
import { entrada, surgir, useCues } from "../tempo";

const PASSOS = ["Pré-aqueça o forno", "Misture farinha e açúcar", "Bata os ovos", "Junte tudo e asse"];

export const Receita: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = useCues("leigo-receita");
  const tPassos = cue("passos");
  const tExato = cue("exato");
  const tLit = cue("literal");
  const tConc = cue("conclusao");

  const batendo = frame >= tLit && frame < tConc;
  const vezes = Math.floor(interpolate(frame, [tLit + 20, tConc], [1, 999999], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) ** 1);
  const corrigido = entrada(frame, tConc + 10);

  return (
    <Cena id="leigo-receita">
      <Titulo etapa="O que é um programa">Uma receita de passos</Titulo>

      <Painel style={{ position: "absolute", left: 120, top: 260, width: 900, padding: "36px 46px", ...surgir(frame, 5) }}>
        <div style={{ fontSize: 46, fontWeight: 800, marginBottom: 24 }}>🎂 Bolo simples</div>
        {PASSOS.map((p, i) => {
          const ovos = i === 2;
          const alerta = ovos && batendo;
          return (
            <div
              key={p}
              style={{
                ...surgir(frame, tPassos + i * 10),
                display: "flex",
                alignItems: "center",
                gap: 24,
                fontSize: 42,
                padding: "14px 20px",
                borderRadius: 14,
                marginBottom: 8,
                background: alerta ? `${cor.vermelho}26` : ovos && corrigido > 0.5 ? `${cor.verde}22` : "transparent",
                border: `2px solid ${alerta ? cor.vermelho : ovos && corrigido > 0.5 ? cor.verde : "transparent"}`,
              }}
            >
              <span style={{ width: 56, height: 56, borderRadius: 28, background: cor.azul, color: "#0b0d12", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 32 }}>
                {i + 1}
              </span>
              <span>
                {p}
                {ovos && corrigido > 0 ? <span style={{ color: cor.verde, opacity: corrigido }}> por 2 minutos</span> : null}
              </span>
            </div>
          );
        })}
      </Painel>

      <div style={{ position: "absolute", left: 1100, top: 280, width: 700, display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
        <div style={{ ...surgir(frame, tExato), fontSize: 200, rotate: batendo ? `${Math.sin(frame / 2) * 8}deg` : "0deg" }}>🤖</div>
        <div style={{ ...surgir(frame, tExato + 10), fontSize: 44, fontWeight: 700, textAlign: "center" }}>
          O computador <span style={{ color: cor.laranja }}>não tem bom senso</span>
        </div>
        <div style={{ fontSize: 40, textAlign: "center", opacity: batendo ? 1 : 0, color: cor.vermelho }}>
          batendo os ovos… <b>{vezes.toLocaleString("pt-BR")}</b> vezes
        </div>
        <div style={{ fontSize: 40, textAlign: "center", opacity: corrigido, color: cor.verde, fontWeight: 700 }}>✓ cada passo exato</div>
      </div>
    </Cena>
  );
};
