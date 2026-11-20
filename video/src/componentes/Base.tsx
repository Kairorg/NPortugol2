import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { cor, fonte, fonteMono } from "../tema";
import { ATRASO_FALA, infoCena, surgir } from "../tempo";

/** Fundo, narração e área segura comuns a todas as cenas. */
export const Cena: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
  const { fps } = useVideoConfig();
  const info = infoCena(id);
  return (
    <AbsoluteFill style={{ background: cor.fundo, fontFamily: fonte, color: cor.texto }}>
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(circle at 20% 0%, ${cor.azul}22, transparent 45%), radial-gradient(circle at 100% 100%, ${cor.roxo}14, transparent 40%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${cor.borda}33 1px, transparent 1px), linear-gradient(90deg, ${cor.borda}33 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
        }}
      />
      {children}
      {info.arquivo ? (
        <Audio name={`Narração: ${id}`} src={staticFile(info.arquivo)} from={Math.round(ATRASO_FALA * fps)} premountFor={fps} />
      ) : null}
    </AbsoluteFill>
  );
};

/** Sobretítulo + título da cena, no canto superior esquerdo. */
export const Titulo: React.FC<{ etapa: string; children: React.ReactNode; inicio?: number }> = ({ etapa, children, inicio = 0 }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 100, top: 70 }}>
      <div
        style={{
          ...surgir(frame, inicio, 20),
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: cor.azulClaro,
        }}
      >
        {etapa}
      </div>
      <div style={{ ...surgir(frame, inicio + 5, 30), fontSize: 64, fontWeight: 800, marginTop: 6, letterSpacing: -1 }}>{children}</div>
    </div>
  );
};

/** Painel com borda e título pequeno, no estilo do Raio-X. */
export const Painel: React.FC<{ titulo?: string; children: React.ReactNode; style?: React.CSSProperties; corTitulo?: string }> = ({
  titulo,
  children,
  style,
  corTitulo = cor.suave,
}) => (
  <div
    style={{
      background: `${cor.painel}ee`,
      border: `1.5px solid ${cor.borda}`,
      borderRadius: 18,
      padding: "22px 30px",
      boxShadow: "0 30px 80px #0008",
      ...style,
    }}
  >
    {titulo ? (
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: corTitulo, marginBottom: 14 }}>
        {titulo}
      </div>
    ) : null}
    {children}
  </div>
);

/** Etiqueta com o nome do arquivo de origem do trecho. */
export const Arquivo: React.FC<{ nome: string; nota?: string }> = ({ nome, nota }) => (
  <div style={{ display: "flex", gap: 14, alignItems: "baseline", marginBottom: 16 }}>
    <span style={{ fontFamily: fonteMono, fontSize: 24, color: cor.azulClaro }}>{nome}</span>
    {nota ? <span style={{ fontSize: 20, color: cor.suave }}>{nota}</span> : null}
  </div>
);

/** Legenda de apoio na parte de baixo. */
export const Nota: React.FC<{ children: React.ReactNode; visivel: number; style?: React.CSSProperties }> = ({ children, visivel, style }) => (
  <div
    style={{
      position: "absolute",
      left: 100,
      right: 100,
      bottom: 70,
      display: "flex",
      justifyContent: "center",
      opacity: visivel,
      translate: `0px ${(1 - visivel) * 20}px`,
      ...style,
    }}
  >
    <div
      style={{
        background: `${cor.fundo2}f2`,
        border: `1.5px solid ${cor.borda}`,
        borderRadius: 999,
        padding: "16px 34px",
        fontSize: 36,
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  </div>
);

/** Destaque de texto inline. */
export const Marca: React.FC<{ children: React.ReactNode; c?: string; mono?: boolean }> = ({ children, c = cor.azulClaro, mono }) => (
  <span style={{ color: c, fontFamily: mono ? fonteMono : undefined }}>{children}</span>
);
