import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { Cena, Painel, Titulo } from "../componentes/Base";
import { Codigo } from "../componentes/Codigo";
import { Pilha } from "../componentes/Pilha";
import { cor, fonteMono } from "../tema";
import { entrada, surgir, useCues, ATRASO_FALA, infoCena } from "../tempo";
import { ASM, PROGRAMA } from "../dados";
import { trace } from "../data/trace";

/** Índice do passo do trace em cada frame, sincronizado com a narração. */
export function passoNoFrame(frame: number, marcos: number[], fim: number) {
  return Math.floor(
    interpolate(frame, [...marcos, fim], [0, 3, 42, 46, 55, trace.length - 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
}

export const Simulacao: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = useCues("simulacao");
  const fimFala = Math.round((ATRASO_FALA + infoCena("simulacao").duracao) * 30);
  const marcos = [cue("inicio"), cue("recursao"), cue("base"), cue("volta"), cue("final")];
  const k = passoNoFrame(frame, marcos, fimFala - 15);
  const passo = trace[k];
  const terminou = passo.ip < 0;
  const linhaFonte = ASM.find((l) => l.i === passo.ip)?.fonte ?? 0;

  return (
    <Cena id="simulacao">
      <Titulo etapa="11 · Tudo junto">Executando fatorial(3)</Titulo>

      <Painel titulo="Assembly" style={{ position: "absolute", left: 100, top: 210, width: 430, padding: "18px 26px", ...surgir(frame, 0) }}>
        <Codigo
          codigo={ASM.map((l) => l.texto).join("\n")}
          lang="asm"
          tamanho={23}
          alturaLinha={1.42}
          numeros
          primeiroNumero={0}
          escurecer={0.35}
          destaque={(l) => (l - 1 === passo.ip ? 1 : 0)}
          corDestaque={cor.laranja}
        />
      </Painel>

      <Painel titulo="Fatorial.np" style={{ position: "absolute", left: 570, top: 210, width: 640, padding: "18px 26px", ...surgir(frame, 6) }}>
        <Codigo codigo={PROGRAMA} lang="np" tamanho={25} numeros destaque={(l) => (l === linhaFonte ? 1 : 0)} corDestaque={cor.laranja} />
      </Painel>

      <Painel titulo="Variáveis" style={{ position: "absolute", left: 570, top: 650, width: 640, minHeight: 250, ...surgir(frame, 12) }}>
        {passo.vars.length === 0 ? <div style={{ color: cor.suave, fontSize: 26, fontStyle: "italic" }}>nenhuma ainda</div> : null}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 30px" }}>
          {passo.vars.map((v) => (
            <div key={v.frame} style={{ fontFamily: fonteMono, fontSize: 25, display: "flex", gap: 14, whiteSpace: "nowrap" }}>
              <span style={{ color: cor.suave }}>{v.frame}</span>
              <span>
                <span style={{ color: "#82aaff" }}>{v.name}</span> = <span style={{ color: cor.laranja, fontWeight: 700 }}>{v.value}</span>
              </span>
            </div>
          ))}
        </div>
      </Painel>

      <div style={{ position: "absolute", left: 1260, top: 210, width: 560, ...surgir(frame, 18) }}>
        <div style={{ display: "flex", gap: 20, marginBottom: 30 }}>
          <Contador titulo="IP" valor={terminou ? "—" : String(passo.ip)} c={cor.laranja} />
          <Contador titulo="executadas" valor={String(k + 2)} c={cor.suave} />
        </div>
        <Pilha
          titulo="Pilha de avaliação"
          largura={560}
          alturaItem={50}
          tamanho={28}
          corItem={cor.verde}
          itens={passo.stack.map((s, i) => ({ chave: `${passo.stack.length - i}:${s}`, texto: s }))}
          vazio="vazia"
        />
        <div style={{ height: 30 }} />
        <Pilha
          titulo="Pilha de chamadas"
          largura={560}
          alturaItem={50}
          tamanho={26}
          corItem={cor.azul}
          itens={passo.calls.map((c, i) => ({ chave: `${passo.calls.length - i}`, texto: c.name, sub: c.ret ? `volta p/ ${c.ret}` : undefined }))}
          vazio="vazia"
        />
      </div>

      {/* Saída */}
      <div style={{ position: "absolute", left: 1260, bottom: 80, opacity: entrada(frame, marcos[4] + 30), display: "flex", alignItems: "center", gap: 20 }}>
        <span style={{ fontSize: 30, color: cor.suave }}>Saída:</span>
        <span style={{ fontFamily: fonteMono, fontSize: 64, fontWeight: 800, color: cor.verde }}>6</span>
      </div>
    </Cena>
  );
};

const Contador: React.FC<{ titulo: string; valor: string; c: string }> = ({ titulo, valor, c }) => (
  <div style={{ flex: 1, borderRadius: 14, border: `3px solid ${c}`, background: `${c}1c`, padding: "8px 20px" }}>
    <div style={{ fontFamily: fonteMono, fontSize: 20, color: cor.suave }}>{titulo}</div>
    <div style={{ fontFamily: fonteMono, fontSize: 40, fontWeight: 700 }}>{valor}</div>
  </div>
);
