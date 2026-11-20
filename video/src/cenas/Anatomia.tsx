import React from "react";
import { useCurrentFrame } from "remotion";
import { Cena, Painel, Titulo } from "../componentes/Base";
import { Codigo } from "../componentes/Codigo";
import { Pilha } from "../componentes/Pilha";
import { cor, fonteMono } from "../tema";
import { entrada, surgir, useCues } from "../tempo";
import { ASM } from "../dados";

const TAM = 21;
const ALTURA = TAM * 1.4;

export const Anatomia: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = useCues("anatomia");
  const tIns = cue("instrucoes");
  const tIp = cue("ip");
  const tAv = cue("avaliacao");
  const tCh = cue("chamadas");
  const tSim = cue("simbolos");
  const ip = entrada(frame, tIp);

  return (
    <Cena id="anatomia">
      <Titulo etapa="5 · A máquina virtual">As peças da VM</Titulo>

      <Painel titulo="Instruções" style={{ position: "absolute", left: 100, top: 210, width: 440, padding: "16px 26px", ...surgir(frame, tIns) }}>
        <Rotulo>Runnable.Instructions</Rotulo>
        <div style={{ position: "relative" }}>
          <Codigo
            codigo={ASM.map((l) => l.texto).join("\n")}
            lang="asm"
            tamanho={TAM}
            alturaLinha={1.4}
            numeros
            primeiroNumero={0}
            destaque={(l) => (l === 3 ? ip : 0)}
            corDestaque={cor.laranja}
          />
          {/* IP, ancorado na linha 2 */}
          <div
            style={{
              position: "absolute",
              left: "100%",
              marginLeft: 50,
              top: ALTURA * 2.5 - 50,
              height: 100,
              display: "flex",
              alignItems: "center",
              gap: 18,
              opacity: ip,
              translate: `${(1 - ip) * 40}px 0px`,
            }}
          >
            <div style={{ fontSize: 50, color: cor.laranja }}>◀</div>
            <div style={{ borderRadius: 16, border: `3px solid ${cor.laranja}`, background: `${cor.laranja}22`, padding: "12px 26px", whiteSpace: "nowrap" }}>
              <div style={{ fontFamily: fonteMono, fontSize: 44, fontWeight: 700 }}>IP = 2</div>
              <div style={{ fontFamily: fonteMono, fontSize: 22, color: cor.suave }}>Runnable.IP</div>
            </div>
          </div>
        </div>
      </Painel>

      <div style={{ position: "absolute", left: 1010, top: 250, display: "flex", gap: 50 }}>
        <div style={surgir(frame, tAv)}>
          <Pilha titulo="Pilha de avaliação" largura={330} corItem={cor.verde} itens={[{ chave: "a", texto: "1" }, { chave: "b", texto: "3" }]} />
          <Rotulo>ParamStack</Rotulo>
          <Explica>valores intermediários</Explica>
        </div>
        <div style={surgir(frame, tCh)}>
          <Pilha
            titulo="Pilha de chamadas"
            largura={420}
            tamanho={26}
            corItem={cor.azul}
            itens={[
              { chave: "f", texto: "fatorial #1", sub: "volta p/ 4" },
              { chave: "p", texto: "principal" },
            ]}
          />
          <Rotulo>RuntimeStack</Rotulo>
          <Explica>para onde voltar</Explica>
        </div>
      </div>

      <Painel titulo="Tabela de símbolos" style={{ position: "absolute", left: 1010, top: 720, width: 800, ...surgir(frame, tSim) }}>
        <div style={{ display: "flex", gap: 30, fontFamily: fonteMono, fontSize: 32 }}>
          <span style={{ color: cor.suave }}>fatorial #1</span>
          <span style={{ color: "#82aaff" }}>x</span>
          <span>=</span>
          <span style={{ color: cor.laranja, fontWeight: 700 }}>3</span>
        </div>
        <div style={{ marginTop: 12 }}>
          <Rotulo>Runnable.ScriptSymbolTable</Rotulo>
        </div>
      </Painel>
    </Cena>
  );
};

const Rotulo: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: fonteMono, fontSize: 22, color: cor.azulClaro, marginTop: 10, marginBottom: 10 }}>{children}</div>
);
const Explica: React.FC<{ children: React.ReactNode }> = ({ children }) => <div style={{ fontSize: 28, color: cor.suave }}>{children}</div>;
