import { loadFont as carregarInter } from "@remotion/google-fonts/Inter";
import { loadFont as carregarMono } from "@remotion/google-fonts/JetBrainsMono";

const inter = carregarInter("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin", "latin-ext"] });
const mono = carregarMono("normal", { weights: ["400", "500", "700"], subsets: ["latin", "latin-ext"] });

export const fonte = inter.fontFamily;
export const fonteMono = mono.fontFamily;

// Paleta inspirada no Raio-X (tema escuro, azul de destaque, laranja de depuração).
export const cor = {
  fundo: "#0d1016",
  fundo2: "#141821",
  painel: "#181c26",
  borda: "#2a3040",
  texto: "#e8ebf2",
  suave: "#8d96ab",
  azul: "#6d8cff",
  azulClaro: "#9db2ff",
  laranja: "#f5a524",
  verde: "#4ade80",
  rosa: "#f472b6",
  roxo: "#c792ea",
  ciano: "#67e8f9",
  vermelho: "#f87171",
};
