import React from "react";
import { useCurrentFrame } from "remotion";
import { Cena, Titulo } from "../componentes/Base";
import { Codigo } from "../componentes/Codigo";
import { cor, fonteMono } from "../tema";
import { entrada, janela, surgir, useCues } from "../tempo";

type Card = { cue: string; titulo: string; emoji: string; c: string; codigo: string; explica: string };

const CARDS: Card[] = [
  { cue: "variavel", titulo: "Variáveis", emoji: "📦", c: cor.ciano, codigo: 'nome = "mundo"', explica: "caixinhas com etiqueta" },
  { cue: "decisao", titulo: "Decisões", emoji: "🔀", c: cor.laranja, codigo: "se idade >= 18 então", explica: "se acontecer isto, faça aquilo" },
  { cue: "repeticao", titulo: "Repetições", emoji: "🔁", c: cor.verde, codigo: "para i = 1 até 11", explica: "faça várias vezes" },
  { cue: "funcao", titulo: "Funções", emoji: "📖", c: cor.roxo, codigo: "função fatorial(x)", explica: "receitas com nome" },
];

export const Ingredientes: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = useCues("leigo-ingredientes");

  return (
    <Cena id="leigo-ingredientes">
      <Titulo etapa="Os ingredientes">Quatro peças de quase todo programa</Titulo>

      <div style={{ position: "absolute", left: 120, right: 120, top: 260, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36 }}>
        {CARDS.map((card, i) => {
          const ini = cue(card.cue);
          const fim = i < CARDS.length - 1 ? cue(CARDS[i + 1].cue) : ini + 400;
          const ativo = janela(frame, ini, fim, 8);
          return (
            <div
              key={card.cue}
              style={{
                ...surgir(frame, ini - 4, 30),
                borderRadius: 26,
                border: `3px solid ${card.c}`,
                background: `${card.c}${ativo > 0.5 ? "22" : "0c"}`,
                padding: "30px 38px",
                display: "flex",
                gap: 30,
                alignItems: "center",
                height: 330,
              }}
            >
              <div style={{ fontSize: 110 }}>{card.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 50, fontWeight: 800 }}>{card.titulo}</div>
                <div style={{ fontSize: 34, color: cor.suave, marginTop: 6 }}>{card.explica}</div>
                <div style={{ marginTop: 22 }}>
                  <Codigo codigo={card.codigo} lang="np" tamanho={32} />
                </div>
                <Extra tipo={card.cue} p={entrada(frame, ini + 25, 25)} />
              </div>
            </div>
          );
        })}
      </div>
    </Cena>
  );
};

/** Pequena ilustração de cada ingrediente. */
const Extra: React.FC<{ tipo: string; p: number }> = ({ tipo, p }) => {
  const frame = useCurrentFrame();
  const base: React.CSSProperties = { marginTop: 14, opacity: p, fontFamily: fonteMono, fontSize: 28 };
  if (tipo === "variavel")
    return (
      <div style={{ ...base, display: "inline-flex", alignItems: "center", gap: 12, border: `2px dashed ${cor.ciano}`, borderRadius: 10, padding: "6px 16px" }}>
        <span style={{ color: cor.suave }}>nome:</span> <b>"mundo"</b>
      </div>
    );
  if (tipo === "decisao") return <div style={{ ...base, color: cor.suave }}>✓ pode votar · ✗ ainda não</div>;
  if (tipo === "repeticao") {
    const n = 1 + (Math.floor(frame / 12) % 10);
    return <div style={{ ...base, color: cor.suave }}>7 × {n} = <b style={{ color: cor.verde }}>{7 * n}</b></div>;
  }
  return <div style={{ ...base, color: cor.suave }}>fatorial(3) → 6</div>;
};
