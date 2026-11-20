import { interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import voiceoverJson from "./data/voiceover.json";
import { narracao } from "./narracao";

export const FPS = 30;
/** Atraso entre o início da cena e o início da fala (s). */
export const ATRASO_FALA = 0.5;
/** Folga depois do fim da fala (s). */
export const FOLGA = 1.0;
/** Duração das transições entre cenas (frames). */
export const TRANSICAO = 15;

type Entrada = { arquivo: string; duracao: number; texto: string; cues: Record<string, number> };
const voiceover = voiceoverJson as Record<string, Entrada>;

// Sem áudio gerado, estima a fala a ~14 caracteres por segundo.
const CARACTERES_POR_SEGUNDO = 14;

export type InfoCena = { duracao: number; cues: Record<string, number>; arquivo: string | null };

export function infoCena(id: string): InfoCena {
  const v = voiceover[id];
  if (v) return { duracao: v.duracao, cues: v.cues, arquivo: v.arquivo };

  const cena = narracao.find((c) => c.id === id);
  if (!cena) throw new Error("Cena sem narração: " + id);
  const cues: Record<string, number> = {};
  let falado = "";
  let ultimo = 0;
  const re = /\{(\w+)\}/g;
  for (let m = re.exec(cena.texto); m; m = re.exec(cena.texto)) {
    falado += cena.texto.slice(ultimo, m.index);
    cues[m[1]] = falado.length / CARACTERES_POR_SEGUNDO;
    ultimo = m.index + m[0].length;
  }
  falado += cena.texto.slice(ultimo);
  return { duracao: falado.length / CARACTERES_POR_SEGUNDO, cues, arquivo: null };
}

/** Duração da cena em frames, incluindo a sobreposição da transição seguinte. */
export function framesDaCena(id: string) {
  return Math.ceil((ATRASO_FALA + infoCena(id).duracao + FOLGA) * FPS) + TRANSICAO;
}

/** Devolve uma função que converte um marcador da narração em frame da cena. */
export function useCues(id: string) {
  const { fps } = useVideoConfig();
  const info = infoCena(id);
  return (nome: string, deslocamento = 0) => {
    const t = info.cues[nome];
    if (t === undefined) throw new Error(`Marcador {${nome}} não existe na cena ${id}`);
    return Math.round((ATRASO_FALA + t + deslocamento) * fps);
  };
}

const suave = Easing.bezier(0.16, 1, 0.3, 1);

/** 0 → 1 a partir de `inicio`, em `duracao` frames. */
export function entrada(frame: number, inicio: number, duracao = 18) {
  return interpolate(frame, [inicio, inicio + duracao], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: suave,
  });
}

/** 1 entre `inicio` e `fim`, com rampas de `rampa` frames. */
export function janela(frame: number, inicio: number, fim: number, rampa = 8) {
  if (fim <= inicio) return 0;
  return interpolate(frame, [inicio, inicio + rampa, fim, fim + rampa], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

/** Estilo de surgimento: sobe e aparece. */
export function surgir(frame: number, inicio: number, distancia = 30, duracao = 18): React.CSSProperties {
  const p = entrada(frame, inicio, duracao);
  return { opacity: p, translate: `0px ${(1 - p) * distancia}px` };
}

export function useFrame() {
  return useCurrentFrame();
}
