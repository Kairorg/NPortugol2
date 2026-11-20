import React from "react";
import { cor, fonteMono } from "../tema";

export type ItemPilha = { chave: string; texto: React.ReactNode; sub?: string };

/** Pilha desenhada de cima (topo) para baixo. `entradaTopo` anima o item do topo (0..1). */
export const Pilha: React.FC<{
  titulo: string;
  itens: ItemPilha[];
  corItem?: string;
  largura?: number;
  alturaItem?: number;
  tamanho?: number;
  entradaTopo?: number;
  vazio?: string;
  style?: React.CSSProperties;
}> = ({ titulo, itens, corItem = cor.azul, largura = 300, alturaItem = 64, tamanho = 30, entradaTopo = 1, vazio = "vazia", style }) => (
  <div style={{ width: largura, ...style }}>
    <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: cor.suave, marginBottom: 14 }}>
      {titulo}
    </div>
    <div
      style={{
        borderLeft: `3px solid ${cor.borda}`,
        borderRight: `3px solid ${cor.borda}`,
        borderBottom: `3px solid ${cor.borda}`,
        borderRadius: "0 0 14px 14px",
        padding: 10,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minHeight: alturaItem + 20,
      }}
    >
      {itens.length === 0 ? (
        <div style={{ height: alturaItem, display: "flex", alignItems: "center", justifyContent: "center", color: cor.suave, fontSize: 24, fontStyle: "italic" }}>
          {vazio}
        </div>
      ) : null}
      {itens.map((it, i) => {
        const p = i === 0 ? entradaTopo : 1;
        return (
          <div
            key={it.chave}
            style={{
              height: alturaItem,
              borderRadius: 10,
              background: `${corItem}${i === 0 ? "33" : "1c"}`,
              border: `2px solid ${corItem}${i === 0 ? "" : "66"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 18px",
              fontFamily: fonteMono,
              fontSize: tamanho,
              fontWeight: 700,
              opacity: p,
              translate: `0px ${(1 - p) * -40}px`,
            }}
          >
            <span>{it.texto}</span>
            {it.sub ? <span style={{ fontSize: tamanho * 0.62, fontWeight: 400, color: cor.suave }}>{it.sub}</span> : null}
          </div>
        );
      })}
    </div>
  </div>
);
