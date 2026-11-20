import React from "react";
import { useCurrentFrame } from "remotion";
import { Arquivo, Cena, Painel, Titulo } from "../componentes/Base";
import { Codigo } from "../componentes/Codigo";
import { cor, fonteMono } from "../tema";
import { entrada, janela, surgir, useCues } from "../tempo";

// Trecho de src/NPortugol/Runtime/Executor.cs.
const CODIGO = `public void ExecuteInstruction()
{
    var opcode = Instruction.OpCode;
    switch (opcode)
    {
        case OpCode.MOV:  ProcessMOV(); break;
        case OpCode.DCL:  ProcessDCL(); break;
        case OpCode.SADD: ProcessArithmetic(true); break;
        case OpCode.SSUB: ProcessArithmetic(true); break;
        case OpCode.SMUL: ProcessArithmetic(true); break;
        // ... SDIV, SMOD, ADD, SUB, MUL, DIV, INC, DEC ...
        case OpCode.JMP:  ProcessBranching(); break;
        case OpCode.JNE:  ProcessBranching(); break;
        // ... JE, JG, JL, JGE, JLE
        case OpCode.PUSH: ProcessPUSH(); break;
        case OpCode.POP:  ProcessPOP(); break;
        case OpCode.CALL: ProcessCALL(); break;
        case OpCode.RET:  ProcessRET(); break;
        case OpCode.EXIT: ProcessEXIT(); break;
        // ... CNT, SCNT, HOST
    }
}`;

type Grupo = { cue: string; nome: string; linhas: number[]; c: string; ops: string };
const GRUPOS: Grupo[] = [
  { cue: "memoria", nome: "Memória", linhas: [6, 7], c: cor.ciano, ops: "MOV · DCL" },
  { cue: "aritmetica", nome: "Aritmética", linhas: [8, 9, 10, 11], c: cor.verde, ops: "SADD · SSUB · SMUL …" },
  { cue: "desvios", nome: "Desvios", linhas: [12, 13, 14], c: cor.laranja, ops: "JMP · JNE · JG …" },
  { cue: "pilha", nome: "Pilha", linhas: [15, 16], c: cor.rosa, ops: "PUSH · POP" },
  { cue: "fluxo", nome: "Funções", linhas: [17, 18, 19], c: cor.azul, ops: "CALL · RET · EXIT" },
];

export const Despacho: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = useCues("despacho");
  const tCasos = cue("casos");
  const tEx = cue("exemplo");
  const fimGrupos = tEx - 4;

  const ativoGrupo = (g: Grupo, i: number) => {
    const ini = cue(g.cue);
    const fim = i < GRUPOS.length - 1 ? cue(GRUPOS[i + 1].cue) - 2 : fimGrupos;
    return janela(frame, ini, fim, 6);
  };
  const exemplo = entrada(frame, tEx, 20);
  const voo = entrada(frame, tEx + 10, 30);

  const destaque = (l: number) => {
    if (frame >= tEx) return l === 9 ? exemplo : l === 3 || l === 4 ? exemplo * 0.6 : 0;
    let v = l === 3 || l === 4 ? janela(frame, 15, tCasos, 8) : 0;
    GRUPOS.forEach((g, i) => {
      if (g.linhas.includes(l)) v = Math.max(v, ativoGrupo(g, i));
    });
    return v;
  };
  const grupoAtual = GRUPOS.findIndex((g, i) => ativoGrupo(g, i) > 0.5);

  return (
    <Cena id="despacho">
      <Titulo etapa="7 · Decodificar">Um switch por opcode</Titulo>

      <Painel style={{ position: "absolute", left: 100, top: 220, width: 1080, padding: "20px 32px", ...surgir(frame, 5) }}>
        <Arquivo nome="Runtime/Executor.cs" nota="trecho" />
        <Codigo
          codigo={CODIGO}
          lang="cs"
          tamanho={24}
          alturaLinha={1.4}
          destaque={destaque}
          corDestaque={frame >= tEx ? cor.verde : grupoAtual >= 0 ? GRUPOS[grupoAtual].c : cor.azul}
        />
      </Painel>

      <div style={{ position: "absolute", left: 1260, top: 240, width: 560, display: "flex", flexDirection: "column", gap: 18, opacity: 1 - exemplo }}>
        {GRUPOS.map((g, i) => {
          const a = ativoGrupo(g, i);
          return (
            <div
              key={g.cue}
              style={{
                ...surgir(frame, cue(g.cue) - 4),
                borderRadius: 16,
                border: `3px solid ${g.c}`,
                background: `${g.c}${a > 0.5 ? "33" : "10"}`,
                padding: "16px 26px",
                scale: 1 + a * 0.04,
              }}
            >
              <div style={{ fontSize: 34, fontWeight: 700 }}>{g.nome}</div>
              <div style={{ fontFamily: fonteMono, fontSize: 24, color: cor.suave }}>{g.ops}</div>
            </div>
          );
        })}
      </div>

      {/* Exemplo: SSUB é despachado */}
      <div style={{ position: "absolute", left: 1260, top: 300, width: 560, opacity: exemplo, display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
        <div style={{ fontSize: 28, color: cor.suave }}>instrução atual</div>
        <div
          style={{
            fontFamily: fonteMono,
            fontSize: 64,
            fontWeight: 700,
            padding: "18px 44px",
            borderRadius: 18,
            border: `3px solid ${cor.verde}`,
            background: `${cor.verde}22`,
            translate: `${(1 - voo) * 0}px ${(1 - voo) * -30}px`,
          }}
        >
          SSUB
        </div>
        <div style={{ fontSize: 60, color: cor.suave, opacity: voo }}>↓</div>
        <div style={{ fontFamily: fonteMono, fontSize: 40, fontWeight: 700, color: "#ffcb6b", opacity: voo }}>ProcessArithmetic(true)</div>
        <div style={{ fontSize: 26, color: cor.suave, opacity: voo }}>true = operandos vêm da pilha</div>
      </div>
    </Cena>
  );
};
