import React from "react";
import { Img, staticFile, useCurrentFrame, interpolate } from "remotion";
import { Cena, Nota, Painel, Titulo } from "../componentes/Base";
import { Codigo } from "../componentes/Codigo";
import { cor } from "../tema";
import { entrada, janela, surgir, useCues } from "../tempo";
import { ASM, PROGRAMA } from "../dados";

const NOTA_ESQ: React.CSSProperties = { right: 960, bottom: 150, justifyContent: "flex-start" };

const ASM_FATORIAL = ASM.filter((l) => l.i >= 6)
  .map((l) => l.texto)
  .join("\n");

export const Geracao: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = useCues("geracao");
  const tPilha = cue("pilha");
  const tExpr = cue("expr");
  const tSe = cue("se");
  const tMapa = cue("mapa");

  const expr = janela(frame, tExpr, tSe - 5);
  const se = janela(frame, tSe, tMapa - 5);
  const mapa = entrada(frame, tMapa - 5, 25);
  const emitidas = interpolate(frame, [15, tPilha], [0, 17], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Linha do ASM (base 1 dentro do trecho, que começa na instrução 6)
  const destaqueAsm = (l: number) => {
    const i = l + 5;
    const viaExpr = i >= 16 && i <= 18 ? expr : 0;
    const viaSe = i >= 10 && i <= 14 ? se * (i === 12 ? 1 : 0.6) : 0;
    return Math.max(viaExpr, viaSe);
  };

  // Seta do salto JNE label_0: de 12 para 15
  const alturaLinha = 27 * 1.5;
  const salto = entrada(frame, tSe + 40, 25) * se;

  return (
    <Cena id="geracao">
      <Titulo etapa="4 · Geração de código">A árvore vira instruções</Titulo>

      <div style={{ opacity: 1 - mapa }}>
        <Painel titulo="Fatorial.np" style={{ position: "absolute", left: 100, top: 250, width: 780, ...surgir(frame, 0) }}>
          <Codigo codigo={PROGRAMA} lang="np" tamanho={32} numeros destaque={(l) => Math.max(l === 7 ? expr : 0, l === 6 ? se : 0)} />
        </Painel>

        <Painel titulo="Assembly gerado" style={{ position: "absolute", left: 1000, top: 200, width: 540, ...surgir(frame, 10) }}>
          <div style={{ position: "relative" }}>
            <Codigo
              codigo={ASM_FATORIAL}
              lang="asm"
              tamanho={27}
              alturaLinha={1.5}
              numeros
              primeiroNumero={6}
              caracteres={emitidas >= 17 ? undefined : ASM_FATORIAL.split("\n").slice(0, Math.floor(emitidas)).join("\n").length}
              destaque={destaqueAsm}
              corDestaque={expr > 0 ? cor.verde : cor.laranja}
            />
            {/* seta do salto */}
            <div
              style={{
                position: "absolute",
                left: 380,
                top: alturaLinha * 6.5,
                width: 60,
                height: alturaLinha * 3 * salto,
                borderTop: `4px solid ${cor.laranja}`,
                borderRight: `4px solid ${cor.laranja}`,
                borderBottom: salto > 0.95 ? `4px solid ${cor.laranja}` : "none",
                borderRadius: "0 14px 14px 0",
                opacity: salto > 0.02 ? 1 : 0,
              }}
            />
          </div>
        </Painel>

        {/* Ideia de máquina de pilha */}
        <div style={{ position: "absolute", left: 1610, top: 300, width: 220, ...surgir(frame, tPilha) }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 3, color: cor.suave, textTransform: "uppercase", marginBottom: 12 }}>pilha</div>
          {["1", "3"].map((v, i) => (
            <div
              key={v}
              style={{
                height: 64,
                marginBottom: 8,
                borderRadius: 10,
                border: `2px solid ${cor.verde}`,
                background: `${cor.verde}22`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 34,
                fontWeight: 700,
                ...surgir(frame, tPilha + 15 + (1 - i) * 10, -30),
              }}
            >
              {v}
            </div>
          ))}
          <div style={{ fontSize: 26, color: cor.suave, marginTop: 10 }}>topo ↑</div>
        </div>
      </div>

      <Nota visivel={janela(frame, tPilha, tExpr - 5)} style={NOTA_ESQ}>
        Máquina de <span style={{ color: cor.verde }}>pilha</span>: valores são empilhados, operações consomem o topo
      </Nota>
      <Nota visivel={expr} style={NOTA_ESQ}>
        <span style={{ color: cor.verde }}>x - 1</span> → PUSH x · PUSH 1 · SSUB
      </Nota>
      <Nota visivel={se} style={NOTA_ESQ}>
        <span style={{ color: cor.laranja }}>se x == 0</span> → JNE salta se x ≠ 0
      </Nota>

      {/* Captura do Raio-X com o mapa instrução → linha */}
      <div
        style={{
          position: "absolute",
          left: 100,
          top: 230,
          width: 1720,
          height: 780,
          borderRadius: 20,
          overflow: "hidden",
          border: `2px solid ${cor.borda}`,
          opacity: mapa,
          boxShadow: "0 40px 120px #000c",
        }}
      >
        <Img
          src={staticFile("raiox/editor.png")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "100% 0%",
            scale: interpolate(frame, [tMapa, tMapa + 90], [1, 1.25], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            transformOrigin: "100% 15%",
          }}
        />
      </div>
      <Nota visivel={entrada(frame, tMapa + 30)}>
        As marcas <span style={{ color: cor.azulClaro }}>L2</span>, <span style={{ color: cor.azulClaro }}>L6</span>, <span style={{ color: cor.azulClaro }}>L7</span> ligam cada instrução à sua linha
      </Nota>
    </Cena>
  );
};
