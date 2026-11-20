import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { Cena, Painel, Titulo } from "../componentes/Base";
import { cor, fonteMono } from "../tema";
import { entrada, janela, surgir, useCues } from "../tempo";

const PALAVRAS = ["imprima", "(", '"Olá, "', ",", "nome", ")"];
const PASSINHOS = ['separe o texto "Olá, "', "separe o que está na caixa nome", "chame imprima com os dois", "volte para o próximo passo"];

export const Tradutor: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = useCues("leigo-tradutor");
  const tTrad = cue("tradutor");
  const tPal = cue("palavras");
  const tGram = cue("gramatica");
  const tPass = cue("passinhos");

  const separar = entrada(frame, tPal, 25);
  const gram = janela(frame, tGram, tPass - 6);
  const erro = janela(frame, tGram + 70, tPass - 6);
  const passos = entrada(frame, tPass - 5, 20);

  return (
    <Cena id="leigo-tradutor">
      <Titulo etapa="O tradutor">O compilador traduz o texto</Titulo>

      {/* texto → tradutor */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 270, display: "flex", justifyContent: "center", alignItems: "center", gap: 40, opacity: 1 - passos }}>
        <div style={{ ...surgir(frame, tTrad), fontSize: 150 }}>🧑‍🏫</div>
        <div style={{ ...surgir(frame, tTrad + 10), fontSize: 44, fontWeight: 700 }}>
          compilador = <span style={{ color: cor.azulClaro }}>tradutor</span>
        </div>
      </div>

      {/* palavras */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 520,
          display: "flex",
          justifyContent: "center",
          gap: interpolate(separar, [0, 1], [0, 22]),
          opacity: entrada(frame, tTrad + 20) * (1 - passos),
        }}
      >
        {PALAVRAS.map((p, i) => {
          const falta = erro > 0.5 && i === PALAVRAS.length - 1;
          return (
            <span
              key={i}
              style={{
                fontFamily: fonteMono,
                fontSize: 64,
                fontWeight: 700,
                padding: `10px ${interpolate(separar, [0, 1], [2, 24])}px`,
                borderRadius: 14,
                border: `3px solid ${falta ? cor.vermelho : separar > 0.5 ? (gram > 0.5 ? cor.verde : cor.azul) : "transparent"}`,
                background: falta ? `${cor.vermelho}22` : "transparent",
                opacity: falta ? 0.35 : 1,
              }}
            >
              {p}
            </span>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 690, textAlign: "center", fontSize: 44, fontWeight: 700 }}>
        <span style={{ color: cor.verde, opacity: gram * (1 - erro) }}>✓ a gramática está certa</span>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 690, textAlign: "center", fontSize: 44, fontWeight: 700, opacity: erro }}>
        <span style={{ color: cor.vermelho }}>✗ linha 4: falta fechar o parêntese “)”</span>
      </div>

      {/* passinhos */}
      <div style={{ position: "absolute", left: 300, right: 300, top: 260, opacity: passos }}>
        <Painel titulo="Passos bem pequenos">
          {PASSINHOS.map((p, i) => (
            <div key={p} style={{ ...surgir(frame, tPass + 10 + i * 14, 20), display: "flex", gap: 24, alignItems: "center", fontSize: 46, padding: "16px 0" }}>
              <span style={{ fontFamily: fonteMono, color: cor.laranja, width: 50 }}>{i + 1}.</span>
              {p}
            </div>
          ))}
        </Painel>
      </div>
    </Cena>
  );
};
