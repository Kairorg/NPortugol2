import React from "react";
import { useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { framesDaCena, TRANSICAO } from "./tempo";
import { Abertura } from "./cenas/Abertura";
import { Linguagem } from "./cenas/Linguagem";
import { Pipeline } from "./cenas/Pipeline";
import { Lexico } from "./cenas/Lexico";
import { Sintatico } from "./cenas/Sintatico";
import { Geracao } from "./cenas/Geracao";
import { Anatomia } from "./cenas/Anatomia";
import { Laco } from "./cenas/Laco";
import { Despacho } from "./cenas/Despacho";
import { PilhaEmAcao } from "./cenas/PilhaEmAcao";
import { Desvio } from "./cenas/Desvio";
import { Chamadas } from "./cenas/Chamadas";
import { Simulacao } from "./cenas/Simulacao";
import { RaioX } from "./cenas/RaioX";
import { Encerramento } from "./cenas/Encerramento";

export const CENAS = [
  "abertura", "linguagem", "pipeline", "lexico", "sintatico", "geracao", "anatomia", "laco",
  "despacho", "pilha", "desvio", "chamadas", "simulacao", "raiox", "encerramento",
];

export const duracaoTotal = () => CENAS.reduce((s, id) => s + framesDaCena(id), 0) - (CENAS.length - 1) * TRANSICAO;

const Transicao = () => <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSICAO })} />;

export const Video: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <TransitionSeries name="Cenas">
      <TransitionSeries.Sequence name="Abertura" durationInFrames={framesDaCena("abertura")} premountFor={fps}>
        <Abertura />
      </TransitionSeries.Sequence>
      {Transicao()}
      <TransitionSeries.Sequence name="Linguagem" durationInFrames={framesDaCena("linguagem")} premountFor={fps}>
        <Linguagem />
      </TransitionSeries.Sequence>
      {Transicao()}
      <TransitionSeries.Sequence name="Pipeline" durationInFrames={framesDaCena("pipeline")} premountFor={fps}>
        <Pipeline />
      </TransitionSeries.Sequence>
      {Transicao()}
      <TransitionSeries.Sequence name="Léxico" durationInFrames={framesDaCena("lexico")} premountFor={fps}>
        <Lexico />
      </TransitionSeries.Sequence>
      {Transicao()}
      <TransitionSeries.Sequence name="Sintático" durationInFrames={framesDaCena("sintatico")} premountFor={fps}>
        <Sintatico />
      </TransitionSeries.Sequence>
      {Transicao()}
      <TransitionSeries.Sequence name="Geração" durationInFrames={framesDaCena("geracao")} premountFor={fps}>
        <Geracao />
      </TransitionSeries.Sequence>
      {Transicao()}
      <TransitionSeries.Sequence name="Anatomia da VM" durationInFrames={framesDaCena("anatomia")} premountFor={fps}>
        <Anatomia />
      </TransitionSeries.Sequence>
      {Transicao()}
      <TransitionSeries.Sequence name="Laço da VM" durationInFrames={framesDaCena("laco")} premountFor={fps}>
        <Laco />
      </TransitionSeries.Sequence>
      {Transicao()}
      <TransitionSeries.Sequence name="Despacho" durationInFrames={framesDaCena("despacho")} premountFor={fps}>
        <Despacho />
      </TransitionSeries.Sequence>
      {Transicao()}
      <TransitionSeries.Sequence name="Pilha em ação" durationInFrames={framesDaCena("pilha")} premountFor={fps}>
        <PilhaEmAcao />
      </TransitionSeries.Sequence>
      {Transicao()}
      <TransitionSeries.Sequence name="Desvio" durationInFrames={framesDaCena("desvio")} premountFor={fps}>
        <Desvio />
      </TransitionSeries.Sequence>
      {Transicao()}
      <TransitionSeries.Sequence name="Chamadas" durationInFrames={framesDaCena("chamadas")} premountFor={fps}>
        <Chamadas />
      </TransitionSeries.Sequence>
      {Transicao()}
      <TransitionSeries.Sequence name="Simulação" durationInFrames={framesDaCena("simulacao")} premountFor={fps}>
        <Simulacao />
      </TransitionSeries.Sequence>
      {Transicao()}
      <TransitionSeries.Sequence name="Raio-X" durationInFrames={framesDaCena("raiox")} premountFor={fps}>
        <RaioX />
      </TransitionSeries.Sequence>
      {Transicao()}
      <TransitionSeries.Sequence name="Encerramento" durationInFrames={framesDaCena("encerramento")} premountFor={fps}>
        <Encerramento />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
