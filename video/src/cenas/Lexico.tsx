import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { Cena, Painel, Titulo } from "../componentes/Base";
import { Codigo } from "../componentes/Codigo";
import { cor, fonteMono } from "../tema";
import { entrada, surgir, useCues } from "../tempo";

type Token = { t: string; tipo: string; c: string };

const TOKENS: Token[] = [
  { t: "retorne", tipo: "palavra-chave", c: cor.roxo },
  { t: "fatorial", tipo: "identificador", c: "#82aaff" },
  { t: "(", tipo: "símbolo", c: cor.suave },
  { t: "x", tipo: "identificador", c: "#82aaff" },
  { t: "-", tipo: "operador", c: cor.laranja },
  { t: "1", tipo: "número", c: cor.verde },
  { t: ")", tipo: "símbolo", c: cor.suave },
  { t: "*", tipo: "operador", c: cor.laranja },
  { t: "x", tipo: "identificador", c: "#82aaff" },
];

const GRAMATICA = `returnStat
    : 'retorne' assignExpression
    ;

ID      : [a-zA-Z_] [a-zA-Z0-9_]* ;
INT     : [0-9]+ ;`;

export const Lexico: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = useCues("lexico");
  const tTok = cue("tokens");
  const tReg = cue("regras");

  const separar = entrada(frame, tTok - 20, 30);
  const subir = entrada(frame, tReg - 5, 25);

  return (
    <Cena id="lexico">
      <Titulo etapa="2 · Análise léxica">Caracteres viram tokens</Titulo>

      <div style={{ position: "absolute", left: 0, right: 0, top: interpolate(subir, [0, 1], [400, 270]), display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Linha original, letra a letra */}
        <div style={{ ...surgir(frame, 8), fontFamily: fonteMono, fontSize: 52, color: cor.suave, letterSpacing: 2, opacity: 1 - separar * 0.6 }}>
          {"retorne fatorial(x - 1) * x".split("").map((ch, i) => (
            <span key={i} style={{ borderBottom: ch === " " ? "none" : `2px solid ${cor.borda}`, margin: "0 2px" }}>
              {ch === " " ? " " : ch}
            </span>
          ))}
        </div>

        {/* Tokens */}
        <div style={{ display: "flex", gap: interpolate(separar, [0, 1], [4, 18]), marginTop: interpolate(separar, [0, 1], [-70, 60]) }}>
          {TOKENS.map((tk, i) => {
            const p = entrada(frame, tTok + i * 7, 16);
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, opacity: separar }}>
                <div
                  style={{
                    fontFamily: fonteMono,
                    fontSize: 52,
                    fontWeight: 700,
                    padding: "12px 22px",
                    borderRadius: 14,
                    border: `2.5px solid ${tk.c}`,
                    background: `${tk.c}${p > 0.5 ? "2a" : "00"}`,
                    color: cor.texto,
                    minWidth: 70,
                    textAlign: "center",
                  }}
                >
                  {tk.t}
                </div>
                <div style={{ fontSize: 22, color: tk.c, fontWeight: 600, opacity: p, translate: `0px ${(1 - p) * 12}px`, whiteSpace: "nowrap" }}>{tk.tipo}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ position: "absolute", left: 100, right: 100, top: 640, display: "flex", gap: 40, alignItems: "flex-start", ...surgir(frame, tReg, 40) }}>
        <Painel titulo="src/grammar/NPortugol.g4 (trecho)" style={{ flex: 1.3 }}>
          <Codigo codigo={GRAMATICA} lang="cs" tamanho={28} />
        </Painel>
        <Painel style={{ flex: 1 }}>
          <div style={{ fontSize: 34, lineHeight: 1.5 }}>
            O <b style={{ color: cor.azulClaro }}>ANTLR 4</b> gera o lexer e o parser em C# a partir da gramática.
            <div style={{ color: cor.suave, fontSize: 30, marginTop: 14 }}>Espaços e comentários são descartados.</div>
          </div>
        </Painel>
      </div>
    </Cena>
  );
};
