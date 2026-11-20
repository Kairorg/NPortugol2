import React from "react";
import { useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { framesDaCena, TRANSICAO } from "../tempo";
import { LeigoAbertura } from "./Abertura";
import { Receita } from "./Receita";
import { Idioma } from "./Idioma";
import { Ingredientes } from "./Ingredientes";
import { Tradutor } from "./Tradutor";
import { Maquina } from "./Maquina";
import { NoRaioX } from "./NoRaioX";
import { Fim } from "./Fim";

export const CENAS_LEIGO = [
  "leigo-abertura", "leigo-receita", "leigo-linguagem", "leigo-ingredientes",
  "leigo-tradutor", "leigo-maquina", "leigo-raiox", "leigo-encerramento",
];

export const duracaoLeigo = () => CENAS_LEIGO.reduce((s, id) => s + framesDaCena(id), 0) - (CENAS_LEIGO.length - 1) * TRANSICAO;

const Transicao = () => <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSICAO })} />;

/** Segundo vídeo: para leigos, sem detalhes do compilador ou da VM. */
export const VideoLeigo: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <TransitionSeries name="Cenas (leigos)">
      <TransitionSeries.Sequence name="Abertura" durationInFrames={framesDaCena("leigo-abertura")} premountFor={fps}>
        <LeigoAbertura />
      </TransitionSeries.Sequence>
      {Transicao()}
      <TransitionSeries.Sequence name="Receita" durationInFrames={framesDaCena("leigo-receita")} premountFor={fps}>
        <Receita />
      </TransitionSeries.Sequence>
      {Transicao()}
      <TransitionSeries.Sequence name="Idioma" durationInFrames={framesDaCena("leigo-linguagem")} premountFor={fps}>
        <Idioma />
      </TransitionSeries.Sequence>
      {Transicao()}
      <TransitionSeries.Sequence name="Ingredientes" durationInFrames={framesDaCena("leigo-ingredientes")} premountFor={fps}>
        <Ingredientes />
      </TransitionSeries.Sequence>
      {Transicao()}
      <TransitionSeries.Sequence name="Tradutor" durationInFrames={framesDaCena("leigo-tradutor")} premountFor={fps}>
        <Tradutor />
      </TransitionSeries.Sequence>
      {Transicao()}
      <TransitionSeries.Sequence name="Máquina" durationInFrames={framesDaCena("leigo-maquina")} premountFor={fps}>
        <Maquina />
      </TransitionSeries.Sequence>
      {Transicao()}
      <TransitionSeries.Sequence name="Raio-X" durationInFrames={framesDaCena("leigo-raiox")} premountFor={fps}>
        <NoRaioX />
      </TransitionSeries.Sequence>
      {Transicao()}
      <TransitionSeries.Sequence name="Encerramento" durationInFrames={framesDaCena("leigo-encerramento")} premountFor={fps}>
        <Fim />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
