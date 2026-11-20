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

    return {
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
