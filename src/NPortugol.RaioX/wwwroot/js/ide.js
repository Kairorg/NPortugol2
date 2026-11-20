// Comportamentos de IDE do Raio-X: divisórias arrastáveis, atalhos de teclado e navegação no editor.
window.raiox = (function () {
    const CHAVE = "raiox.tamanhos";
    const raiz = document.documentElement;

    function lerTamanhos() {
        try {
            return JSON.parse(localStorage.getItem(CHAVE) || "{}");
        } catch {
            return {};
        }
    }

    function salvarTamanho(variavel, valor) {
        try {
            const tamanhos = lerTamanhos();
            tamanhos[variavel] = valor;
            localStorage.setItem(CHAVE, JSON.stringify(tamanhos));
        } catch {
            // Sem armazenamento (navegação privada etc.): os tamanhos valem só nesta visita.
        }
    }

    // Restaura os tamanhos salvos assim que o script carrega.
    Object.entries(lerTamanhos()).forEach(([variavel, valor]) => raiz.style.setProperty(variavel, valor));

    // Divisórias: elementos com data-divisor="--variavel", data-direcao="x|y" e data-sinal="1|-1".
    document.addEventListener("pointerdown", e => {
        const divisor = e.target.closest("[data-divisor]");
        if (!divisor) return;

        e.preventDefault();
        const variavel = divisor.dataset.divisor;
        const horizontal = divisor.dataset.direcao === "x";
        const sinal = Number(divisor.dataset.sinal || 1);
        const minimo = Number(divisor.dataset.min || 120);
        const maximo = Number(divisor.dataset.max || 900);
        const inicio = horizontal ? e.clientX : e.clientY;
        const valorInicial = parseFloat(getComputedStyle(raiz).getPropertyValue(variavel)) || 0;

        divisor.setPointerCapture(e.pointerId);
        divisor.classList.add("arrastando");
        document.body.classList.add(horizontal ? "redimensionando-x" : "redimensionando-y");

        const mover = ev => {
            const delta = ((horizontal ? ev.clientX : ev.clientY) - inicio) * sinal;
            const valor = Math.min(maximo, Math.max(minimo, valorInicial + delta));
            raiz.style.setProperty(variavel, valor + "px");
        };

        const soltar = () => {
            divisor.removeEventListener("pointermove", mover);
            divisor.classList.remove("arrastando");
            document.body.classList.remove("redimensionando-x", "redimensionando-y");
            salvarTamanho(variavel, getComputedStyle(raiz).getPropertyValue(variavel).trim());
        };

        divisor.addEventListener("pointermove", mover);
        divisor.addEventListener("pointerup", soltar, { once: true });
        divisor.addEventListener("pointercancel", soltar, { once: true });
    });

    function editor(id) {
        const holder = window.blazorMonaco.editors.find(h => h.id === id);
        return holder ? holder.editor : null;
    }

    // ---- Assembly da VM (src/grammar/ASM.g4) como linguagem do Monaco ----

    const ASM = "nportugol-asm";
    let asmRegistrado = false;

    const instrucoes = [
        ["MOV", "MOV ${1:x}; ${2:valor}", "x = valor."],
        ["DCL", "DCL ${1:x}", "Declara a variável x (sem valor)."],
        ["PUSH", "PUSH ${1:valor}", "Empilha um valor ou o conteúdo de uma variável."],
        ["POP", "POP ${1:x}", "Desempilha o topo da pilha para a variável x."],
        ["ADD", "ADD ${1:x}; ${2:valor}", "x = x + valor."],
        ["SUB", "SUB ${1:x}; ${2:valor}", "x = x - valor."],
        ["MUL", "MUL ${1:x}; ${2:valor}", "x = x * valor."],
        ["DIV", "DIV ${1:x}; ${2:valor}", "x = x / valor."],
        ["MOD", "MOD ${1:x}; ${2:valor}", "x = resto de x / valor."],
        ["POW", "POW ${1:x}; ${2:valor}", "x = x elevado a valor."],
        ["INC", "INC ${1:x}", "x = x + 1."],
        ["DEC", "DEC ${1:x}", "x = x - 1."],
        ["NEG", "NEG ${1:x}", "x = -x."],
        ["CNT", "CNT ${1:x}; ${2:texto}", "Concatena: x = x seguido de texto."],
        ["SADD", "SADD", "Desempilha b e a, empilha a + b."],
        ["SSUB", "SSUB", "Desempilha b e a, empilha a - b."],
        ["SMUL", "SMUL", "Desempilha b e a, empilha a * b."],
        ["SDIV", "SDIV", "Desempilha b e a, empilha a / b."],
        ["SMOD", "SMOD", "Desempilha b e a, empilha o resto de a / b."],
        ["SCNT", "SCNT", "Desempilha b e a, empilha os dois textos concatenados."],
        ["JMP", "JMP ${1:rotulo}", "Salta para o rótulo."],
        ["JE", "JE ${1:rotulo}", "Desempilha b e a; salta se a == b."],
        ["JNE", "JNE ${1:rotulo}", "Desempilha b e a; salta se a != b."],
        ["JG", "JG ${1:rotulo}", "Desempilha b e a; salta se a > b."],
        ["JL", "JL ${1:rotulo}", "Desempilha b e a; salta se a < b."],
        ["JGE", "JGE ${1:rotulo}", "Desempilha b e a; salta se a >= b."],
        ["JLE", "JLE ${1:rotulo}", "Desempilha b e a; salta se a <= b."],
        ["CALL", "CALL ${1:funcao}", "Chama uma função do script ou do host (os argumentos já estão na pilha)."],
        ["RET", "RET", "Volta para quem chamou a função."],
        ["EXIT", "EXIT", "Encerra o programa."],
        ["HOST", "HOST ${1:objeto}; ${2:propriedade}", "Empilha uma propriedade de um objeto do host (ex.: tamanho de um vetor)."],
        ["EMP", "EMP", "Não faz nada."]
    ];
    const funcoesDoHost = ["imprima", "imprimaLinha", "imprimaVetor", "leia", "vetorizar", "data", "hoje", "nomedia"];

    function registrarAssembly() {
        if (asmRegistrado) return;
        asmRegistrado = true;

        monaco.languages.register({ id: ASM });

        monaco.languages.setMonarchTokensProvider(ASM, {
            instrucoes: instrucoes.map(i => i[0]),
            tokenizer: {
                root: [
                    [/\/\/.*$/, "comment"],
                    [/\/\*/, "comment", "@comentario"],
                    [/^\s*[a-zA-Z_]\w*\s*:/, "type"],            // cabeçalho de função: "main:"
                    [/\.[a-zA-Z_]\w*/, "tag"],                   // rótulo: ".label_0"
                    [/\b(True|False)\b/, "constant"],
                    [/[a-zA-Z_]\w*/, { cases: { "@instrucoes": "keyword", "@default": "identifier" } }],
                    [/\d*,\d+([eE][+-]?\d+)?|\d+[eE][+-]?\d+/, "number.float"],
                    [/\d+/, "number"],
                    [/"([^"\\]|\\.)*"/, "string"],
                    [/"/, "string.invalid"],
                    [/[;:]/, "delimiter"]
                ],
                comentario: [
                    [/[^*]+/, "comment"],
                    [/\*\//, "comment", "@pop"],
                    [/\*/, "comment"]
                ]
            }
        });

        monaco.languages.setLanguageConfiguration(ASM, {
            comments: { lineComment: "//", blockComment: ["/*", "*/"] },
            autoClosingPairs: [{ open: "\"", close: "\"", notIn: ["string"] }]
        });

        monaco.languages.registerCompletionItemProvider(ASM, {
            provideCompletionItems: function (model, position) {
                const palavra = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber, endLineNumber: position.lineNumber,
                    startColumn: palavra.startColumn, endColumn: palavra.endColumn
                };
                const regraSnippet = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
                const sugestoes = instrucoes.map(([nome, texto, doc]) => ({
                    label: nome, kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: texto, insertTextRules: regraSnippet, documentation: doc, range: range
                }));
                funcoesDoHost.forEach(nome => sugestoes.push({
                    label: nome, kind: monaco.languages.CompletionItemKind.Function,
                    insertText: nome, documentation: "Função do host (use com CALL).", range: range
                }));
                return { suggestions: sugestoes };
            }
        });

        monaco.languages.registerHoverProvider(ASM, {
            provideHover: function (model, position) {
                const palavra = model.getWordAtPosition(position);
                const instrucao = palavra && instrucoes.find(i => i[0] === palavra.word);
                if (!instrucao) return null;
                return {
                    range: new monaco.Range(position.lineNumber, palavra.startColumn, position.lineNumber, palavra.endColumn),
                    contents: [{ value: "**" + instrucao[0] + "**" }, { value: instrucao[2] }]
                };
            }
        });
    }

    return {
        // Troca a linguagem do editor: "nportugol" ou "nportugol-asm".
        definirLinguagem: function (id, linguagem) {
            if (linguagem === ASM) registrarAssembly();
            const e = editor(id);
            if (e) monaco.editor.setModelLanguage(e.getModel(), linguagem);
        },

        telaEstreita: function () {
            return window.matchMedia("(max-width: 900px)").matches;
        },

        // Atalhos de IDE, tratados antes do navegador (F5 recarregaria a página).
        registrarAtalhos: function (dotnet) {
            window.addEventListener("keydown", e => {
                let atalho = null;
                if (e.key === "F5" && e.shiftKey) atalho = "parar";
                else if (e.key === "F5" && (e.ctrlKey || e.metaKey)) atalho = "executar";
                else if (e.key === "F5") atalho = "depurar";
                else if (e.key === "F10") atalho = "proxima-linha";
                else if (e.key === "F11") atalho = "proxima-instrucao";
                if (!atalho) return;

                e.preventDefault();
                e.stopPropagation();
                dotnet.invokeMethodAsync("Atalho", atalho);
            }, true);
        },

        // Leva o cursor do editor a uma posição (linha e coluna base 1).
        irPara: function (id, linha, coluna) {
            const e = editor(id);
            if (!e) return;
            e.setPosition({ lineNumber: linha, column: coluna || 1 });
            e.revealLineInCenterIfOutsideViewport(linha);
            e.focus();
        }
    };
})();
