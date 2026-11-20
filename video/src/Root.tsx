import React from "react";
import { Composition, Folder } from "remotion";
import { Video, duracaoTotal } from "./Video";
import { framesDaCena } from "./tempo";
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
import { VideoLeigo, duracaoLeigo } from "./leigo/VideoLeigo";
import { LeigoAbertura } from "./leigo/Abertura";
import { Receita } from "./leigo/Receita";
import { Idioma } from "./leigo/Idioma";
import { Ingredientes } from "./leigo/Ingredientes";
import { Tradutor } from "./leigo/Tradutor";
import { Maquina } from "./leigo/Maquina";
import { NoRaioX } from "./leigo/NoRaioX";
import { Fim } from "./leigo/Fim";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="ComoFuncionaUmaLinguagem" component={Video} durationInFrames={duracaoTotal()} fps={30} width={1920} height={1080} />
      <Folder name="Cenas">
        <Composition id="Abertura" component={Abertura} durationInFrames={framesDaCena("abertura")} fps={30} width={1920} height={1080} />
        <Composition id="Linguagem" component={Linguagem} durationInFrames={framesDaCena("linguagem")} fps={30} width={1920} height={1080} />
        <Composition id="Pipeline" component={Pipeline} durationInFrames={framesDaCena("pipeline")} fps={30} width={1920} height={1080} />
        <Composition id="Lexico" component={Lexico} durationInFrames={framesDaCena("lexico")} fps={30} width={1920} height={1080} />
        <Composition id="Sintatico" component={Sintatico} durationInFrames={framesDaCena("sintatico")} fps={30} width={1920} height={1080} />
        <Composition id="Geracao" component={Geracao} durationInFrames={framesDaCena("geracao")} fps={30} width={1920} height={1080} />
        <Composition id="Anatomia" component={Anatomia} durationInFrames={framesDaCena("anatomia")} fps={30} width={1920} height={1080} />
        <Composition id="Laco" component={Laco} durationInFrames={framesDaCena("laco")} fps={30} width={1920} height={1080} />
        <Composition id="Despacho" component={Despacho} durationInFrames={framesDaCena("despacho")} fps={30} width={1920} height={1080} />
        <Composition id="PilhaEmAcao" component={PilhaEmAcao} durationInFrames={framesDaCena("pilha")} fps={30} width={1920} height={1080} />
        <Composition id="Desvio" component={Desvio} durationInFrames={framesDaCena("desvio")} fps={30} width={1920} height={1080} />
        <Composition id="Chamadas" component={Chamadas} durationInFrames={framesDaCena("chamadas")} fps={30} width={1920} height={1080} />
        <Composition id="Simulacao" component={Simulacao} durationInFrames={framesDaCena("simulacao")} fps={30} width={1920} height={1080} />
        <Composition id="RaioX" component={RaioX} durationInFrames={framesDaCena("raiox")} fps={30} width={1920} height={1080} />
        <Composition id="Encerramento" component={Encerramento} durationInFrames={framesDaCena("encerramento")} fps={30} width={1920} height={1080} />
      </Folder>
      <Composition id="LinguagemParaTodos" component={VideoLeigo} durationInFrames={duracaoLeigo()} fps={30} width={1920} height={1080} />
      <Folder name="Cenas-leigos">
        <Composition id="Leigo-Abertura" component={LeigoAbertura} durationInFrames={framesDaCena("leigo-abertura")} fps={30} width={1920} height={1080} />
        <Composition id="Leigo-Receita" component={Receita} durationInFrames={framesDaCena("leigo-receita")} fps={30} width={1920} height={1080} />
        <Composition id="Leigo-Idioma" component={Idioma} durationInFrames={framesDaCena("leigo-linguagem")} fps={30} width={1920} height={1080} />
        <Composition id="Leigo-Ingredientes" component={Ingredientes} durationInFrames={framesDaCena("leigo-ingredientes")} fps={30} width={1920} height={1080} />
        <Composition id="Leigo-Tradutor" component={Tradutor} durationInFrames={framesDaCena("leigo-tradutor")} fps={30} width={1920} height={1080} />
        <Composition id="Leigo-Maquina" component={Maquina} durationInFrames={framesDaCena("leigo-maquina")} fps={30} width={1920} height={1080} />
        <Composition id="Leigo-RaioX" component={NoRaioX} durationInFrames={framesDaCena("leigo-raiox")} fps={30} width={1920} height={1080} />
        <Composition id="Leigo-Fim" component={Fim} durationInFrames={framesDaCena("leigo-encerramento")} fps={30} width={1920} height={1080} />
      </Folder>
    </>
  );
};
