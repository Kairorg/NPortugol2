# Vídeo: como funciona uma linguagem de programação

Vídeo explicativo (Remotion) sobre linguagem, compilador e máquina virtual, usando o
NPortugol e o Raio-X como exemplo. Composição principal: `ComoFuncionaUmaLinguagem`
(1920×1080, 30 fps); cada cena também está registrada sozinha na pasta **Cenas** do Studio.

## Comandos (nesta pasta)

```bash
npm i
npm run dev                      # Remotion Studio (pré-visualização)
npx remotion render ComoFuncionaUmaLinguagem out/video.mp4
npm run narracao                 # gera a narração das cenas novas ou alteradas
```

## Narração

- O roteiro está em `src/narracao.ts`. Os marcadores `{nome}` no texto marcam o instante em
  que a animação correspondente começa; as cenas os usam com `useCues("cena")("nome")`.
- `npm run narracao` chama a ElevenLabs (`with-timestamps`), grava `public/voiceover/<cena>.mp3`
  e o tempo de cada marcador em `src/data/voiceover.json`. A duração de cada cena sai do áudio.
- A chave fica em `ELEVENLABS_API_KEY`, no `.env` da raiz do repositório (ignorado pelo git).
  Opcionais: `ELEVENLABS_VOICE_ID` e `ELEVENLABS_MODEL_ID` (padrão `eleven_multilingual_v2`).
- Sem áudio gerado, o tempo é estimado a partir do tamanho do texto.

## Capturas do Raio-X

`public/raiox/` tem capturas reais do Raio-X: o editor, a árvore sintática, um passo por
instrução de uma depuração de `fatorial(3)` (`passos/`) e o estado de cada passo
(`passos.json`). `src/data/trace.ts` foi gerado a partir de `passos.json` e alimenta a cena
de simulação. Para refazer as capturas, rode o Raio-X (`dotnet run --project src/NPortugol.RaioX`)
e um script com puppeteer que carregue o programa no Monaco e aperte F11 a cada passo.
