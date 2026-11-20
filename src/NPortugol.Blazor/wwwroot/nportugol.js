// Integração do playground com o Monaco Editor: linguagem NPortugol, tema e marcação de erros.
window.nportugol = (function () {
    const LINGUAGEM = "nportugol";
    let registrada = false;

    const palavrasChave = ["função", "fim", "variável", "se", "então", "senão", "para", "até",
        "decrescente", "enquanto", "repita", "selecione", "caso", "retorne", "e", "ou"];
    const constantes = ["verdadeiro", "falso", "nulo"];
    const funcoesEmbutidas = [
        ["imprima", "imprima(${1:valor})", "Escreve o valor na saída."],
        ["imprimaLinha", "imprimaLinha(${1:valor})", "Escreve o valor e quebra a linha."],
        ["imprimaVetor", "imprimaVetor(${1:vetor})", "Escreve os elementos do vetor entre chaves."],
        ["leia", "leia()", "Lê a próxima linha do campo Entrada."],
        ["vetorizar", "vetorizar(${1:texto})", "Converte um texto num vetor de caracteres."],
        ["data", "data(${1:\"15/04/2014\"})", "Converte um texto numa data."],
        ["hoje", "hoje()", "Data de hoje."],
        ["nomedia", "nomedia(${1:data})", "Nome do dia da semana de uma data."]
    ];
    const blocos = [
        ["função", "função ${1:nome}(${2})\n\t$0\nfim", "Declara uma função."],
        ["se", "se ${1:x} == ${2:1} então\n\t$0\nfim", "Executa o bloco se a condição for verdadeira."],
        ["se senão", "se ${1:x} == ${2:1} então\n\t$3\nsenão\n\t$0\nfim", "Condição com alternativa."],
        ["para", "para ${1:i} = ${2:0} até ${3:10}\n\t$0\nfim", "Repete com contador (o limite não é incluído)."],
        ["enquanto", "enquanto ${1:x} < ${2:10}\n\t$0\nfim", "Repete enquanto a condição for verdadeira."],
        ["repita", "repita\n\t$0\naté ${1:x} == ${2:10}", "Repete até a condição ser verdadeira."],
        ["selecione", "selecione ${1:x}\n\tcaso ${2:1}:\n\t\t$0\n\tfim\nfim", "Escolhe um bloco pelo valor."]
    ];

    function registrar() {
        if (registrada) return;
        registrada = true;

        monaco.languages.register({ id: LINGUAGEM });

        monaco.languages.setMonarchTokensProvider(LINGUAGEM, {
            palavrasChave: palavrasChave,
            constantes: constantes,
            tokenizer: {
                root: [
                    [/[a-zA-Z_À-ÿ][\wÀ-ÿ]*/, {
                        cases: { "@palavrasChave": "keyword", "@constantes": "constant", "@default": "identifier" }
                    }],
                    [/\d+\.\d+/, "number.float"],
                    [/\d+/, "number"],
                    [/"([^"\\]|\\.)*"/, "string"],
                    [/"/, "string.invalid"],
                    [/[<>=!]=?|[+\-*\/%]/, "operator"],
                    [/[()\[\]{}]/, "@brackets"],
                    [/[#,;:.]/, "delimiter"]
                ]
            }
        });

        monaco.languages.setLanguageConfiguration(LINGUAGEM, {
            brackets: [["(", ")"], ["[", "]"], ["{", "}"]],
            autoClosingPairs: [
                { open: "(", close: ")" }, { open: "[", close: "]" },
                { open: "{", close: "}" }, { open: "\"", close: "\"", notIn: ["string"] }
            ],
            surroundingPairs: [{ open: "(", close: ")" }, { open: "\"", close: "\"" }],
            indentationRules: {
                increaseIndentPattern: /^\s*(função|se|senão|para|enquanto|repita|selecione|caso)\b.*$/,
                decreaseIndentPattern: /^\s*(fim|senão|até)\b/
            }
        });

        monaco.languages.registerCompletionItemProvider(LINGUAGEM, {
            provideCompletionItems: function (model, position) {
                const palavra = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber, endLineNumber: position.lineNumber,
                    startColumn: palavra.startColumn, endColumn: palavra.endColumn
                };
                const regraSnippet = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
                const sugestoes = [];

                blocos.forEach(([rotulo, texto, doc]) => sugestoes.push({
                    label: rotulo, kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: texto, insertTextRules: regraSnippet, documentation: doc, range: range
                }));
                funcoesEmbutidas.forEach(([nome, texto, doc]) => sugestoes.push({
                    label: nome, kind: monaco.languages.CompletionItemKind.Function,
                    insertText: texto, insertTextRules: regraSnippet, documentation: doc, range: range
                }));
                palavrasChave.concat(constantes).forEach(p => sugestoes.push({
                    label: p, kind: monaco.languages.CompletionItemKind.Keyword, insertText: p, range: range
                }));

                return { suggestions: sugestoes };
            }
        });
    }

    function editor(id) {
        const holder = window.blazorMonaco.editors.find(h => h.id === id);
        return holder ? holder.editor : null;
    }

    // Coleções de decorações por editor e por finalidade ("linha" da depuração, "trecho" da AST).
    const decoracoes = {};

    function decorar(id, finalidade, lista) {
        const e = editor(id);
        if (!e) return;
        const chave = id + ":" + finalidade;
        if (!decoracoes[chave]) decoracoes[chave] = e.createDecorationsCollection();
        decoracoes[chave].set(lista);
    }

    const temaEscuro = window.matchMedia("(prefers-color-scheme: dark)");

    function aplicarTema() {
        monaco.editor.setTheme(temaEscuro.matches ? "vs-dark" : "vs");
    }

    return {
        // Chamado quando o editor termina de inicializar.
        conectar: function (id) {
            registrar();
            const e = editor(id);
            if (e) monaco.editor.setModelLanguage(e.getModel(), LINGUAGEM);
            aplicarTema();
            temaEscuro.addEventListener("change", aplicarTema);
        },

        marcarErro: function (id, linha, coluna, comprimento, mensagem) {
            const e = editor(id);
            if (!e) return;
            monaco.editor.setModelMarkers(e.getModel(), LINGUAGEM, [{
                severity: monaco.MarkerSeverity.Error, message: mensagem,
                startLineNumber: linha, startColumn: coluna + 1,
                endLineNumber: linha, endColumn: coluna + 1 + comprimento
            }]);
            e.revealLineInCenterIfOutsideViewport(linha);
        },

        limparErros: function (id) {
            const e = editor(id);
            if (e) monaco.editor.setModelMarkers(e.getModel(), LINGUAGEM, []);
        },

        // Linha em execução durante a depuração (0 remove o destaque).
        destacarLinha: function (id, linha) {
            if (!linha) {
                decorar(id, "linha", []);
                return;
            }
            decorar(id, "linha", [{
                range: new monaco.Range(linha, 1, linha, 1),
                options: { isWholeLine: true, className: "np-linha-atual", linesDecorationsClassName: "np-seta" }
            }]);
            const e = editor(id);
            if (e) e.revealLineInCenterIfOutsideViewport(linha);
        },

        // Trecho do código (linha e coluna iniciais e finais, base 1); coluna2 = 0 vai até o fim da linha.
        destacarTrecho: function (id, linha1, coluna1, linha2, coluna2) {
            if (!linha1) {
                decorar(id, "trecho", []);
                return;
            }
            const ed = editor(id);
            if (!coluna2 && ed) coluna2 = ed.getModel().getLineMaxColumn(linha2);
            decorar(id, "trecho", [{
                range: new monaco.Range(linha1, coluna1, linha2, coluna2),
                options: { className: "np-trecho", inlineClassName: "np-trecho-texto" }
            }]);
            const e = editor(id);
            if (e) e.revealRangeInCenterIfOutsideViewport(new monaco.Range(linha1, coluna1, linha2, coluna2));
        },

        // Rola um elemento (ex.: a instrução atual na lista do assembly) para dentro da área visível.
        rolarAte: function (idElemento) {
            const el = document.getElementById(idElemento);
            if (el) el.scrollIntoView({ block: "nearest" });
        },

        definirFragmento: function (fragmento) {
            history.replaceState(null, "", fragmento ? "#" + fragmento : location.pathname + location.search);
        },

        copiar: async function (texto) {
            try {
                await navigator.clipboard.writeText(texto);
                return true;
            } catch {
                return false;
            }
        }
    };
})();
