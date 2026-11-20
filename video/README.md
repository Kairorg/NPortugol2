# Vídeos do NPortugol

Dois vídeos explicativos (Remotion, 1920×1080, 30 fps), publicados em `video.html` do Raio-X:

- `LinguagemParaTodos` (`src/leigo/`, cenas `leigo-*`): para leigos, com analogias (receita,
  tradutor, cozinheiro), sem detalhes do compilador ou da VM. Cerca de 3 min.
- `ComoFuncionaUmaLinguagem` (`src/cenas/`): linguagem, compilador e VM com o código C# real do
  laço da VM. Cerca de 7 min.

Cada cena também está registrada sozinha nas pastas **Cenas** e **Cenas-leigos** do Studio.

## Comandos (nesta pasta)

```bash
npm i
npm run dev                      # Remotion Studio (pré-visualização)
npx remotion render LinguagemParaTodos out/linguagem-para-todos.mp4
npx remotion render ComoFuncionaUmaLinguagem out/como-funciona-uma-linguagem.mp4
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

## Publicação

Os MP4 não vão para o git: ficam no release `video` do GitHub, e o workflow do Pages os baixa
para `video/` do site. Para atualizar: renderize, rode
`gh release upload video out/<arquivo>.mp4 --clobber` e execute o workflow de novo
(`gh workflow run pages.yml`). As capas ficam em `src/NPortugol.RaioX/wwwroot/video/`.
