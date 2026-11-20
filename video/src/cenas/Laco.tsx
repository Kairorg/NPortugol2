import React from "react";
import { useCurrentFrame } from "remotion";
import { Arquivo, Cena, Painel, Titulo } from "../componentes/Base";
import { Codigo } from "../componentes/Codigo";
import { cor, fonteMono } from "../tema";
import { entrada, janela, surgir, useCues } from "../tempo";
import { ASM } from "../dados";

// Trecho de src/NPortugol/Runtime/RuntimeContext.cs (sem o modo de depuração).
const CODIGO = `public void Execute()
{
    InitWithMain();          // IP = início de main
    while (!Completed)
    {
        ExecuteInstruction();
    }
}

private void ExecuteInstruction()
{
    ExecutedInstructions++;
    if (MaxInstructions > 0 && ExecutedInstructions > MaxInstructions)
        throw new RuntimeException("... laço infinito.");

    CurrentInst = Runnable.Instructions[Runnable.IP];
    Runnable.IP++;
    executor.ExecuteInstruction();
}`;

const FASES = ["BUSCA", "DECODIFICA", "EXECUTA"] as const;

export const Laco: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = useCues("laco");
  const tWhile = cue("while");
  const tBusca = cue("busca");
  const tAvanca = cue("avanca");
  const tExec = cue("executa");
  const tLimite = cue("limite");
  const tCiclo = cue("ciclo");

  const passoCiclo = frame >= tCiclo ? Math.floor((frame - tCiclo) / 7) : -1;
  const linhaCiclo = passoCiclo >= 0 ? [16, 17, 18][passoCiclo % 3] : 0;

  const destaque = (l: number) => {
    if (frame >= tCiclo) return l === linhaCiclo || (l >= 4 && l <= 7) ? 1 : 0;
    return Math.max(
      l >= 4 && l <= 7 ? janela(frame, tWhile, tBusca - 4) : 0,
      l === 16 ? janela(frame, tBusca, tAvanca - 4) : 0,
      l === 17 ? janela(frame, tAvanca, tExec - 4) : 0,
      l === 18 ? janela(frame, tExec, tLimite - 4) : 0,
      l >= 12 && l <= 14 ? janela(frame, tLimite, tCiclo - 4) : 0,
    );
  };

  // Fase ativa no diagrama
  let fase = -1;
  if (frame >= tCiclo) fase = passoCiclo % 3;
  else if (frame >= tExec && frame < tLimite) fase = frame - tExec < 45 ? 1 : 2;
  else if (frame >= tBusca && frame < tExec) fase = 0;

  // Registradores ilustrativos
  let ip = 2;
  if (frame >= tAvanca + 10) ip = 3;
  if (passoCiclo >= 0) ip = 3 + Math.floor((passoCiclo + 1) / 3);
  const instrucao = ASM.find((l) => l.i === Math.min(ip - (frame >= tAvanca + 10 ? 1 : 0), 22))?.texto ?? "";
  const executadas = 1 + Math.max(0, Math.floor((passoCiclo + 1) / 3));

  return (
    <Cena id="laco">
      <Titulo etapa="6 · O laço da VM">Busca, decodifica, executa</Titulo>

      <Painel style={{ position: "absolute", left: 100, top: 230, width: 1130, padding: "22px 34px", ...surgir(frame, 5) }}>
        <Arquivo nome="Runtime/RuntimeContext.cs" nota="trecho" />
        <Codigo codigo={CODIGO} lang="cs" tamanho={25} alturaLinha={1.48} destaque={destaque} escurecer={0.5} />
      </Painel>

      {/* Diagrama do ciclo */}
      <div style={{ position: "absolute", left: 1300, top: 240, width: 520, height: 470, ...surgir(frame, tWhile) }}>
        <svg width={520} height={470} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <marker id="ponta" markerWidth="10" markerHeight="10" refX="6" refY="5" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill={cor.suave} />
            </marker>
          </defs>
          <circle cx={260} cy={235} r={165} fill="none" stroke={cor.borda} strokeWidth={4} strokeDasharray="10 12" />
          {[0, 120, 240].map((a) => {
            const rad = ((a + 60 - 90) * Math.PI) / 180;
            const x = 260 + 165 * Math.cos(rad);
            const y = 235 + 165 * Math.sin(rad);
            const rot = a + 60 + 0;
            return <path key={a} d="M-8,-9 L8,0 L-8,9 z" fill={cor.suave} transform={`translate(${x},${y}) rotate(${rot})`} />;
          })}
        </svg>
        {FASES.map((f, i) => {
          const ang = ((i * 120 - 90) * Math.PI) / 180;
          const x = 260 + 165 * Math.cos(ang);
          const y = 235 + 165 * Math.sin(ang);
          const ativo = fase === i;
          const c = [cor.azul, cor.roxo, cor.verde][i];
          return (
            <div
              key={f}
              style={{
                position: "absolute",
                left: x - 115,
                top: y - 40,
                width: 230,
                height: 80,
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: 2,
                background: ativo ? c : cor.painel,
                border: `3px solid ${c}`,
                color: ativo ? "#0b0d12" : cor.texto,
                scale: ativo ? 1.08 : 1,
                boxShadow: ativo ? `0 0 40px ${c}88` : "none",
              }}
            >
              {f}
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 110, top: 215, width: 300, textAlign: "center", fontFamily: fonteMono, fontSize: 26, color: cor.suave }}>
          while (!Completed)
        </div>
      </div>

      {/* Registradores */}
      <div style={{ position: "absolute", left: 1300, top: 750, width: 520, display: "flex", gap: 20 }}>
        <Registro titulo="IP" valor={String(ip)} c={cor.laranja} visivel={entrada(frame, tBusca)} pulso={janela(frame, tAvanca + 6, tAvanca + 30, 4)} />
        <Registro titulo="CurrentInst" valor={instrucao} c={cor.azul} visivel={entrada(frame, tBusca + 15)} largo />
      </div>
      <div style={{ position: "absolute", left: 1300, top: 900, width: 520, fontSize: 28, color: cor.suave, opacity: entrada(frame, tLimite) }}>
        instruções executadas: <span style={{ fontFamily: fonteMono, color: cor.texto }}>{executadas}</span>
        <span style={{ color: cor.vermelho }}> / MaxInstructions</span>
      </div>
    </Cena>
  );
};

const Registro: React.FC<{ titulo: string; valor: string; c: string; visivel: number; pulso?: number; largo?: boolean }> = ({
  titulo,
  valor,
  c,
  visivel,
  pulso = 0,
  largo,
}) => (
  <div
    style={{
      flex: largo ? 2 : 1,
      opacity: visivel,
      borderRadius: 14,
      border: `3px solid ${c}`,
      background: `${c}${pulso > 0.3 ? "55" : "1c"}`,
      padding: "12px 20px",
      scale: 1 + pulso * 0.06,
    }}
  >
    <div style={{ fontFamily: fonteMono, fontSize: 22, color: cor.suave }}>{titulo}</div>
    <div style={{ fontFamily: fonteMono, fontSize: 38, fontWeight: 700, whiteSpace: "nowrap" }}>{valor}</div>
  </div>
);
