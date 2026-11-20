import React from "react";
import { useCurrentFrame } from "remotion";
import { Cena, Titulo } from "../componentes/Base";
import { cor, fonteMono } from "../tema";
import { entrada, surgir, useCues } from "../tempo";

type Etapa = { cue: string; nome: string; exemplo: string; c: string };

const ETAPAS: Etapa[] = [
  { cue: "lexico", nome: "Análise léxica", exemplo: "retorne · fatorial · ( · x …", c: cor.roxo },
  { cue: "sintatico", nome: "Análise sintática", exemplo: "gramática ANTLR", c: cor.azul },
  { cue: "ast", nome: "Árvore (AST)", exemplo: "FUNC · SLIST · CALL", c: cor.ciano },
  { cue: "gerador", nome: "Geração de código", exemplo: "PUSH x · SSUB", c: cor.verde },
];

export const Pipeline: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = useCues("pipeline");
  const tComp = cue("compilador");
  const tVm = cue("vm");

  return (
    <Cena id="pipeline">
      <Titulo etapa="O caminho">Do texto à execução</Titulo>

      {/* Fonte */}
      <div style={{ position: "absolute", left: 100, top: 400, width: 260, ...surgir(frame, 5) }}>
        <Caixa titulo="Fonte" c={cor.suave} exemplo="Fatorial.np" ativo={1} />
      </div>

      {/* Compilador */}
      <div
        style={{
          position: "absolute",
          left: 420,
          top: 340,
          width: 1000,
          height: 420,
          borderRadius: 26,
          border: `2px dashed ${cor.azul}`,
          background: `${cor.azul}0c`,
          opacity: entrada(frame, tComp - 5),
        }}
      >
        <div style={{ position: "absolute", top: -22, left: 30, background: cor.fundo, padding: "0 16px", fontSize: 30, fontWeight: 800, color: cor.azulClaro, letterSpacing: 2 }}>
          COMPILADOR <span style={{ fontFamily: fonteMono, fontSize: 22, color: cor.suave, fontWeight: 400 }}>Npc.Compilar()</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, padding: "60px 40px" }}>
          {ETAPAS.map((e) => {
            const t = cue(e.cue);
            return (
              <div key={e.cue} style={surgir(frame, t)}>
                <Caixa titulo={e.nome} c={e.c} exemplo={e.exemplo} ativo={1} />
              </div>
            );
          })}
        </div>
      </div>

      {/* VM */}
      <div style={{ position: "absolute", left: 1480, top: 400, width: 340, ...surgir(frame, tVm) }}>
        <Caixa titulo="Máquina virtual" c={cor.laranja} exemplo="executa o assembly" ativo={1} grande />
      </div>

      {/* Setas */}
      <Seta x={365} y={490} p={entrada(frame, tComp)} />
      <Seta x={1425} y={490} p={entrada(frame, tVm - 10)} />

      <div style={{ position: "absolute", left: 420, top: 830, width: 1000, display: "flex", justifyContent: "space-between", fontSize: 30, color: cor.suave, opacity: entrada(frame, tVm) }}>
        <span>tempo de compilação</span>
        <span style={{ color: cor.laranja }}>tempo de execução →</span>
      </div>
    </Cena>
  );
};

const Caixa: React.FC<{ titulo: string; exemplo: string; c: string; ativo: number; grande?: boolean }> = ({ titulo, exemplo, c, grande }) => (
  <div
    style={{
      borderRadius: 18,
      border: `2.5px solid ${c}`,
      background: `${c}1f`,
      padding: grande ? "34px 30px" : "24px 28px",
    }}
  >
    <div style={{ fontSize: grande ? 40 : 36, fontWeight: 700 }}>{titulo}</div>
    <div style={{ fontFamily: fonteMono, fontSize: 24, color: cor.suave, marginTop: 8 }}>{exemplo}</div>
  </div>
);

const Seta: React.FC<{ x: number; y: number; p: number }> = ({ x, y, p }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 50 * p, height: 4, background: cor.suave, borderRadius: 2 }}>
    <div
      style={{
        position: "absolute",
        right: -2,
        top: -9,
        width: 0,
        height: 0,
        borderTop: "11px solid transparent",
        borderBottom: "11px solid transparent",
        borderLeft: `16px solid ${cor.suave}`,
        opacity: p,
      }}
    />
  </div>
);
