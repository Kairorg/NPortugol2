// Gera a narração de cada cena com a ElevenLabs e grava:
//   public/voiceover/<cena>.mp3
//   src/data/voiceover.json  ({ cena: { arquivo, duracao, texto, cues: { nome: segundos } } })
//
// Uso (na pasta video/):
//   npm run narracao                 gera as cenas novas ou cujo texto mudou
//   npm run narracao -- --forcar     regera todas
//   npm run narracao -- laco pilha   regera só essas cenas
//   npm run narracao -- --vozes      lista as vozes da conta
//
// Variáveis (no .env da raiz do repositório ou em video/.env):
//   ELEVENLABS_API_KEY   obrigatória
//   ELEVENLABS_VOICE_ID  opcional (padrão abaixo)
//   ELEVENLABS_MODEL_ID  opcional (padrão eleven_multilingual_v2)

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { narracao } from "../src/narracao.ts";

const chave = process.env.ELEVENLABS_API_KEY;
const voz = process.env.ELEVENLABS_VOICE_ID ?? "JBFqnCBsd6RMkjVDRZzb";
const modelo = process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2";
const arquivoJson = "src/data/voiceover.json";

if (!chave) {
  console.error("Defina ELEVENLABS_API_KEY no .env da raiz");
  process.exit(1);
}

const args = process.argv.slice(2);

if (args.includes("--vozes")) {
  const r = await fetch("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": chave } });
  if (!r.ok) { console.error(r.status, await r.text()); process.exit(1); }
  const dados = (await r.json()) as { voices: { voice_id: string; name: string; labels?: Record<string, string> }[] };
  for (const v of dados.voices) console.log(v.voice_id, "-", v.name, JSON.stringify(v.labels ?? {}));
  process.exit(0);
}

const forcar = args.includes("--forcar");
const escolhidas = args.filter((a) => !a.startsWith("--"));

type Entrada = { arquivo: string; duracao: number; texto: string; cues: Record<string, number> };
const saida: Record<string, Entrada> = existsSync(arquivoJson) ? JSON.parse(readFileSync(arquivoJson, "utf8")) : {};

mkdirSync("public/voiceover", { recursive: true });

// Remove os marcadores {nome} e guarda a posição (no texto falado) de cada um.
function separar(texto: string) {
  const cues: Record<string, number> = {};
  let falado = "";
  const re = /\{(\w+)\}/g;
  let ultimo = 0;
  for (let m = re.exec(texto); m; m = re.exec(texto)) {
    falado += texto.slice(ultimo, m.index);
    cues[m[1]] = falado.length;
    ultimo = m.index + m[0].length;
  }
  falado += texto.slice(ultimo);
  return { falado, cues };
}

for (const cena of narracao) {
  if (escolhidas.length > 0 && !escolhidas.includes(cena.id)) continue;
  const atual = saida[cena.id];
  if (!forcar && escolhidas.length === 0 && atual && atual.texto === cena.texto && existsSync("public/" + atual.arquivo)) {
    console.log("=", cena.id, "(sem mudanças)");
    continue;
  }

  const { falado, cues } = separar(cena.texto);
  process.stdout.write(`> ${cena.id} ... `);

  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voz}/with-timestamps?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": chave, "Content-Type": "application/json" },
    body: JSON.stringify({
      text: falado,
      model_id: modelo,
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.2, use_speaker_boost: true },
    }),
  });
  if (!r.ok) {
    console.error(`falhou (${r.status}): ${await r.text()}`);
    process.exit(1);
  }
  const dados = (await r.json()) as {
    audio_base64: string;
    alignment: { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] };
  };

  const arquivo = `voiceover/${cena.id}.mp3`;
  writeFileSync("public/" + arquivo, Buffer.from(dados.audio_base64, "base64"));

  const a = dados.alignment;
  const tempos: Record<string, number> = {};
  for (const [nome, pos] of Object.entries(cues)) {
    let i = pos;
    while (i < a.characters.length - 1 && a.characters[i].trim() === "") i++;
    tempos[nome] = +(a.character_start_times_seconds[Math.min(i, a.characters.length - 1)] ?? 0).toFixed(3);
  }
  const duracao = +a.character_end_times_seconds[a.character_end_times_seconds.length - 1].toFixed(3);

  saida[cena.id] = { arquivo, duracao, texto: cena.texto, cues: tempos };
  writeFileSync(arquivoJson, JSON.stringify(saida, null, 2) + "\n");
  console.log(`${duracao.toFixed(1)} s`);
}

console.log("Pronto:", arquivoJson);
