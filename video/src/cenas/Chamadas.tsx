import React from "react";
import { useCurrentFrame } from "remotion";
import { Arquivo, Cena, Painel, Titulo } from "../componentes/Base";
import { Codigo } from "../componentes/Codigo";
import { Pilha, ItemPilha } from "../componentes/Pilha";
import { cor, fonteMono } from "../tema";
import { entrada, janela, surgir, useCues } from "../tempo";

// Trechos de src/NPortugol/Runtime/Executor.cs.
const CALL = `private void ProcessCALL()
{
    var name = opResolver.At(0).Name();

    if (Container.IsRegistered(name))   // imprima, leia, ...
    {
        ProcessHostedFunction(name);
        return;
    }

    var returnInst = context.Runnable.Instructions[Instruction.Index + 1];
    var returnAddress = new Operand(OperandType.InstructionRef, returnInst);
    RuntimeStack.Push(returnAddress);

    var function = context.Runnable.RetrieveFunction(name);
    context.Runnable.IP = function.EntryPoint;
    RuntimeStack.Push(function);
}`;

const RET = `private void ProcessRET()
{
    var lastFunction = RuntimeStack.Pop();
    // ... (coleta opcional das variáveis locais)

    var address = RuntimeStack.Count > 0 ? (Operand) RuntimeStack.Pop()
                      : new Operand(OperandType.Null, null);

    if (address.Type == OperandType.InstructionRef)
        context.Runnable.IP = ((Instruction) address.Value).Index;

    if (RuntimeStack.Count == 0)
        context.Completed = true;
}`;

export const Chamadas: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = useCues("chamadas");
  const tCall = cue("call");
  const tEnt = cue("entrada");
  const tHost = cue("hospedeiro");
  const tRet = cue("ret");
  const tFim = cue("fim");

  const trocar = entrada(frame, tRet - 8, 16);

  const destaqueCall = (l: number) =>
    Math.max(
      l >= 11 && l <= 13 ? janela(frame, tCall, tEnt - 4) : 0,
      l >= 15 && l <= 17 ? janela(frame, tEnt, tHost - 4) : 0,
      l >= 5 && l <= 9 ? janela(frame, tHost, tRet - 10) : 0,
    );
  const fr = (tFim - tRet) / 3;
  const destaqueRet = (l: number) =>
    Math.max(
      l === 3 ? janela(frame, tRet, tRet + fr) : 0,
      l >= 6 && l <= 7 ? janela(frame, tRet + fr, tRet + 2 * fr) : 0,
      l >= 9 && l <= 10 ? janela(frame, tRet + 2 * fr, tFim - 4) : 0,
      l >= 12 && l <= 13 ? janela(frame, tFim, tFim + 400) : 0,
    );

  // Pilha de chamadas (RuntimeStack), topo primeiro
  const principal: ItemPilha = { chave: "p", texto: "principal" };
  const retorno: ItemPilha = { chave: "r", texto: "↩ instrução 4", sub: "retorno" };
  const fatorial: ItemPilha = { chave: "f", texto: "fatorial", sub: "função" };
  let itens: ItemPilha[] = [principal];
  let topo = 1;
  if (frame >= tCall + 20) {
    itens = [retorno, principal];
    topo = entrada(frame, tCall + 20, 14);
  }
  if (frame >= tEnt + 15) {
    itens = [fatorial, retorno, principal];
    topo = entrada(frame, tEnt + 15, 14);
  }
  if (frame >= tRet + fr * 0.4) itens = [retorno, principal];
  if (frame >= tRet + fr * 1.4) itens = [principal];
  if (frame >= tFim + 15) itens = [];

  let ip = "3";
  if (frame >= tEnt + 15) ip = "6";
  if (frame >= tRet + fr * 2.2) ip = "4";
  const concluido = entrada(frame, tFim + 30);
  const host = janela(frame, tHost, tRet - 10);

  return (
    <Cena id="chamadas">
      <Titulo etapa="10 · Funções">CALL e RET</Titulo>

      <Painel style={{ position: "absolute", left: 100, top: 220, width: 1150, padding: "20px 32px", opacity: 1 - trocar, ...(trocar < 1 ? surgir(frame, 5) : {}) }}>
        <Arquivo nome="Executor.cs · ProcessCALL" />
        <Codigo codigo={CALL} lang="cs" tamanho={23} alturaLinha={1.45} destaque={destaqueCall} corDestaque={cor.azul} />
      </Painel>
      <Painel style={{ position: "absolute", left: 100, top: 220, width: 1150, padding: "20px 32px", opacity: trocar }}>
        <Arquivo nome="Executor.cs · ProcessRET" nota="trecho" />
        <Codigo codigo={RET} lang="cs" tamanho={25} alturaLinha={1.5} destaque={destaqueRet} corDestaque={cor.azul} />
      </Painel>

      <div style={{ position: "absolute", left: 1330, top: 240, width: 490, ...surgir(frame, tCall - 10) }}>
        <div style={{ display: "flex", gap: 20, marginBottom: 40 }}>
          <div style={{ borderRadius: 14, border: `3px solid ${cor.laranja}`, background: `${cor.laranja}1c`, padding: "10px 22px", fontFamily: fonteMono, fontSize: 40, fontWeight: 700 }}>
            IP = {ip}
          </div>
          <div style={{ fontFamily: fonteMono, fontSize: 30, alignSelf: "center", color: cor.suave }}>
            {frame < tRet ? "CALL fatorial" : "RET"}
          </div>
        </div>
        <Pilha titulo="Pilha de chamadas" itens={itens} entradaTopo={topo} corItem={cor.azul} largura={460} alturaItem={72} tamanho={32} vazio="vazia" />
        <div style={{ fontFamily: fonteMono, fontSize: 22, color: cor.azulClaro, marginTop: 10 }}>RuntimeStack</div>
        <div
          style={{
            marginTop: 30,
            fontFamily: fonteMono,
            fontSize: 34,
            fontWeight: 700,
            color: cor.verde,
            opacity: concluido,
          }}
        >
          Completed = true
        </div>
      </div>

      {/* Função do hospedeiro */}
      <div style={{ position: "absolute", left: 1330, top: 760, width: 490, opacity: host, translate: `0px ${(1 - host) * 20}px` }}>
        <Painel style={{ borderColor: cor.ciano }}>
          <div style={{ fontSize: 30, fontWeight: 600 }}>
            <span style={{ fontFamily: fonteMono, color: cor.ciano }}>CALL imprima</span> → código C# do hospedeiro
          </div>
          <div style={{ fontSize: 24, color: cor.suave, marginTop: 8 }}>registrado com Hospedagem.Registrar(...)</div>
        </Painel>
      </div>
    </Cena>
  );
};
