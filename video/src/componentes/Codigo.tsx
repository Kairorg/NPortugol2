import React from "react";
import { cor, fonteMono } from "../tema";

export type Linguagem = "cs" | "np" | "asm";

const PALAVRAS_CS = new Set([
  "public", "private", "protected", "void", "var", "if", "else", "return", "while", "switch", "case", "break",
  "new", "continue", "true", "false", "null", "foreach", "in", "as", "bool", "int", "object", "string", "float",
  "class", "throw", "long", "using", "namespace", "readonly", "static",
]);
const PALAVRAS_NP = new Set([
  "função", "fim", "se", "então", "senão", "retorne", "variável", "enquanto", "para", "até", "faça", "repita", "e", "ou",
]);
const EMBUTIDAS_NP = new Set(["imprima", "leia", "imprimaLinha"]);

type Pedaco = { t: string; c?: string; i?: boolean; b?: boolean };

function tokenizar(linha: string, lang: Linguagem): Pedaco[] {
  const out: Pedaco[] = [];
  if (lang === "asm") {
    const m = /^(\s*)(\S+)(.*)$/.exec(linha);
    if (!m) return [{ t: linha }];
    const [, esp, primeiro, resto] = m;
    out.push({ t: esp });
    if (primeiro.endsWith(":")) out.push({ t: primeiro, c: cor.azulClaro, b: true });
    else if (primeiro.startsWith(".")) out.push({ t: primeiro, c: cor.suave });
    else out.push({ t: primeiro, c: cor.roxo, b: true });
    for (const p of resto.split(/(\d+)/)) out.push({ t: p, c: /^\d+$/.test(p) ? cor.laranja : undefined });
    return out;
  }
  const re = /(\/\/.*$)|("(?:[^"\\]|\\.)*")|(\b\d+(?:\.\d+)?f?\b)|(@?[\p{L}_][\p{L}\p{N}_]*)|(\s+)|(.)/gu;
  let anterior = "";
  for (let m = re.exec(linha); m; m = re.exec(linha)) {
    const [t, coment, str, num, palavra] = m;
    if (coment) out.push({ t, c: "#6b7489", i: true });
    else if (str) out.push({ t, c: "#a5e3a1" });
    else if (num) out.push({ t, c: cor.laranja });
    else if (palavra) {
      if (lang === "cs") {
        if (PALAVRAS_CS.has(palavra)) out.push({ t, c: cor.roxo });
        else if (/^[A-Z]/.test(palavra) && anterior !== ".") out.push({ t, c: "#82aaff" });
        else if (/^[A-Z]/.test(palavra)) out.push({ t, c: "#ffcb6b" });
        else out.push({ t });
      } else {
        if (PALAVRAS_NP.has(palavra)) out.push({ t, c: cor.roxo });
        else if (EMBUTIDAS_NP.has(palavra)) out.push({ t, c: cor.ciano });
        else out.push({ t, c: "#82aaff" });
      }
    } else out.push({ t });
    if (t.trim()) anterior = t;
  }
  return out;
}

type Props = {
  codigo: string;
  lang: Linguagem;
  tamanho?: number;
  alturaLinha?: number;
  /** Intensidade do destaque (0..1) de cada linha, base 1. */
  destaque?: (linha: number) => number;
  /** Quanto as linhas sem destaque escurecem (0..1) quando há destaque. */
  escurecer?: number;
  numeros?: boolean;
  /** Primeiro número de linha exibido. */
  primeiroNumero?: number;
  /** Quantos caracteres mostrar (efeito de digitação). */
  caracteres?: number;
  corDestaque?: string;
  style?: React.CSSProperties;
};

export const Codigo: React.FC<Props> = ({
  codigo,
  lang,
  tamanho = 30,
  alturaLinha = 1.55,
  destaque,
  escurecer = 0.55,
  numeros = false,
  primeiroNumero = 1,
  caracteres,
  corDestaque = cor.azul,
  style,
}) => {
  const linhas = codigo.replace(/\n$/, "").split("\n");
  const h = tamanho * alturaLinha;
  const maxDestaque = destaque ? Math.max(0, ...linhas.map((_, i) => destaque(i + 1))) : 0;
  let restante = caracteres ?? Infinity;

  return (
    <div style={{ fontFamily: fonteMono, fontSize: tamanho, color: cor.texto, position: "relative", fontVariantLigatures: "none", ...style }}>
      {linhas.map((linha, i) => {
        const n = i + 1;
        const d = destaque ? destaque(n) : 0;
        const opacidade = 1 - escurecer * maxDestaque * (1 - d);
        let visivel = linha;
        if (restante !== Infinity) {
          visivel = linha.slice(0, Math.max(0, restante));
          restante -= linha.length + 1;
        }
        const pedacos = tokenizar(visivel, lang);
        return (
          <div key={i} style={{ height: h, lineHeight: `${h}px`, position: "relative", whiteSpace: "pre", display: "flex" }}>
            <div
              style={{
                position: "absolute",
                inset: `0 -18px 0 ${numeros ? -18 : -18}px`,
                background: corDestaque,
                opacity: d * 0.2,
                borderRadius: 8,
                borderLeft: `5px solid ${corDestaque}`,
              }}
            />
            {numeros ? (
              <span style={{ width: tamanho * 2.2, color: cor.suave, opacity: 0.6, textAlign: "right", paddingRight: tamanho * 0.9, flexShrink: 0 }}>
                {n + primeiroNumero - 1}
              </span>
            ) : null}
            <span style={{ opacity: opacidade, position: "relative" }}>
              {pedacos.map((p, j) => (
                <span key={j} style={{ color: p.c, fontStyle: p.i ? "italic" : undefined, fontWeight: p.b ? 700 : undefined }}>
                  {p.t}
                </span>
              ))}
            </span>
          </div>
        );
      })}
    </div>
  );
};
