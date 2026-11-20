import React from "react";
import { useCurrentFrame } from "remotion";
import { Cena, Painel, Titulo } from "../componentes/Base";
import { Codigo } from "../componentes/Codigo";
import { cor, fonteMono } from "../tema";
import { entrada, surgir, useCues } from "../tempo";

const OLA = `função principal()
    variável nome
    nome = "mundo"
    imprima("Olá, ", nome, "!")
fim`;

export const Idioma: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = useCues("leigo-linguagem");
  const tIdioma = cue("idioma");
  const tPt = cue("portugues");
  const tOla = cue("ola");

  const mostraOla = entrada(frame, tOla - 5, 20);

  return (
    <Cena id="leigo-linguagem">
      <Titulo etapa="Linguagem de programação">Um idioma com regras rígidas</Titulo>

      {/* Espectro: pessoas ↔ máquina */}
      <div style={{ position: "absolute", left: 120, right: 120, top: 300, opacity: 1 - mostraOla }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "stretch", gap: 40 }}>
          <Ponta inicio={tIdioma} titulo="Como nós falamos" exemplo="“escreve oi pro mundo aí”" c={cor.roxo} emoji="🗣️" />
          <Ponta inicio={tIdioma + 25} titulo="Linguagem de programação" exemplo='imprima("Olá, mundo!")' c={cor.azul} emoji="📝" destaque />
          <Ponta inicio={tIdioma + 12} titulo="Como a máquina funciona" exemplo="0110 1001 0010…" c={cor.laranja} emoji="⚙️" />
        </div>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 70 }}>
          {["função", "se", "enquanto", "para", "retorne", "imprima"].map((p, i) => (
            <span
              key={p}
              style={{
                ...surgir(frame, tPt + i * 6, 15),
                fontFamily: fonteMono,
                fontSize: 44,
                padding: "10px 26px",
                borderRadius: 14,
                background: `${cor.roxo}26`,
                color: cor.roxo,
              }}
            >
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* Olá, mundo */}
      <div style={{ position: "absolute", left: 120, right: 120, top: 280, display: "flex", gap: 60, alignItems: "center", opacity: mostraOla }}>
        <Painel titulo="OlaMundo.np" style={{ flex: 1.3 }}>
          <Codigo codigo={OLA} lang="np" tamanho={44} />
        </Painel>
        <div style={{ fontSize: 80, color: cor.suave, opacity: entrada(frame, tOla + 30) }}>→</div>
        <Painel titulo="Tela" style={{ flex: 1, opacity: entrada(frame, tOla + 40) }}>
          <div style={{ fontFamily: fonteMono, fontSize: 60, fontWeight: 700, color: cor.verde }}>Olá, mundo!</div>
        </Painel>
      </div>
    </Cena>
  );
};

const Ponta: React.FC<{ inicio: number; titulo: string; exemplo: string; c: string; emoji: string; destaque?: boolean }> = ({
  inicio,
  titulo,
  exemplo,
  c,
  emoji,
  destaque,
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        ...surgir(frame, inicio, 30),
        flex: 1,
        borderRadius: 24,
        border: `${destaque ? 4 : 2}px solid ${c}`,
        background: `${c}${destaque ? "26" : "12"}`,
        padding: "34px 30px",
        textAlign: "center",
        scale: destaque ? 1.06 : 1,
      }}
    >
      <div style={{ fontSize: 80 }}>{emoji}</div>
      <div style={{ fontSize: 38, fontWeight: 800, marginTop: 10 }}>{titulo}</div>
      <div style={{ fontFamily: fonteMono, fontSize: 30, color: cor.suave, marginTop: 14 }}>{exemplo}</div>
    </div>
  );
};
