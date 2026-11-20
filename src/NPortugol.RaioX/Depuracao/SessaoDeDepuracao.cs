using System.Collections;
using NPortugol.Blazor;
using NPortugol.RaioX.Analise;
using NPortugol.Runtime;

namespace NPortugol.RaioX.Depuracao;

public sealed record Variavel(string Funcao, string Nome, string Valor);

/// <summary>
/// Execução passo a passo de um programa compilado com DebugInfo.
/// </summary>
/// <remarks>
/// Usa o modo de depuração da VM (<c>Motor.Debug</c>) sem carregar o SourceMap no contexto: assim
/// cada <c>Executar()</c> roda uma única instrução e devolve o controle. O passo por linha repete
/// isso até a próxima instrução pertencer a outra linha do editor, segundo o
/// <see cref="MapaDeLinhas"/>. Como cada chamada é curta, a página não trava.
///
/// Antes de um <c>leia()</c> sem linha de entrada disponível, a sessão para em
/// <see cref="AguardandoEntrada"/> até a página entregar o valor com <see cref="Fornecer"/>.
/// </remarks>
public sealed class SessaoDeDepuracao
{
    // Mesmo limite do playground: o navegador não consegue interromper a execução.
    public const long LimiteDeInstrucoes = 2_000_000;

    private readonly Motor motor;
    private readonly MapaDeLinhas mapa;
    private readonly ModuloEntradaSaida entradaSaida;
    private bool iniciada;

    public SessaoDeDepuracao(Bytecode bytecode, MapaDeLinhas mapa, string? entrada)
    {
        this.mapa = mapa;
        entradaSaida = new ModuloEntradaSaida(entrada);

        motor = new Motor { Debug = true, MaxInstructions = LimiteDeInstrucoes };
        motor.Instalar(entradaSaida);
        motor.Load(bytecode);
    }

    private RuntimeContext Contexto => (RuntimeContext)motor.RuntimeContext;

    public bool Concluida => Erro is not null || (iniciada && Contexto.Completed);

    /// <summary>A próxima instrução chama <c>leia()</c> e não há linha de entrada para ela.</summary>
    public bool AguardandoEntrada =>
        entradaSaida.LinhasPendentes == 0
        && ProximaInstrucao is int i
        && Contexto.Runnable.Instructions[i] is { OpCode: OpCode.CALL } chamada
        && chamada.Operands[0].Value as string == "leia";

    /// <summary>Entrega a linha digitada pelo usuário para o <c>leia()</c> que está esperando.</summary>
    public void Fornecer(string linha) => entradaSaida.Fornecer(linha);

    public string? Erro { get; private set; }

    public string Saida => entradaSaida.Saida;

    public long InstrucoesExecutadas => Contexto.ExecutedInstructions;

    /// <summary>Índice (no assembly) da próxima instrução a executar, ou null se terminou.</summary>
    public int? ProximaInstrucao
    {
        get
        {
            if (Concluida) return null;
            if (iniciada) return Contexto.Runnable.IP;

            // Antes do primeiro passo: a entrada da função principal (se existir).
            return Contexto.Runnable.HasMainFunction() ? Contexto.Runnable.MainFunction.EntryPoint : null;
        }
    }

    /// <summary>Linha do editor da próxima instrução (a linha destacada).</summary>
    public int? LinhaAtual => ProximaInstrucao is int i ? mapa.LinhaDe(i) : null;

    public void ProximaInstrucaoPasso()
    {
        if (Concluida || AguardandoEntrada) return;

        try
        {
            motor.Executar();
            iniciada = true;
        }
        catch (Exception e)
        {
            iniciada = true;
            Erro = string.IsNullOrWhiteSpace(e.Message) ? e.GetType().Name : e.Message;
        }
    }

    /// <summary>
    /// Executa até a próxima instrução pertencer a outra linha do script ou a outro nível da pilha
    /// de chamadas (assim, entrar numa função e voltar dela também param, mesmo na mesma linha).
    /// </summary>
    public void ProximaLinha()
    {
        var linhaInicial = LinhaAtual;
        var nivelInicial = NivelDeChamadas();

        do
        {
            ProximaInstrucaoPasso();
        }
        while (!Concluida && !AguardandoEntrada
               && (LinhaAtual is null || (LinhaAtual == linhaInicial && NivelDeChamadas() == nivelInicial)));
    }

    private int NivelDeChamadas() => iniciada ? Contexto.Runnable.RuntimeStack.OfType<FunctionCall>().Count() : 0;

    /// <summary>Executa até o fim, até o limite de instruções ou até um <c>leia()</c> sem entrada.</summary>
    public void Continuar()
    {
        while (!Concluida && !AguardandoEntrada)
            ProximaInstrucaoPasso();
    }

    public IReadOnlyList<Variavel> Variaveis()
    {
        if (!iniciada) return Array.Empty<Variavel>();

        return Contexto.Runnable.ScriptSymbolTable.Values
            .Select(s => (Simbolo: s, Quadro: Quadro(s.Function)))
            .OrderBy(x => x.Quadro.Indice).ThenBy(x => x.Simbolo.Name)
            .Select(x => new Variavel(x.Quadro.Nome, x.Simbolo.Name ?? "", Formatar(x.Simbolo.Value)))
            .ToList();
    }

    /// <summary>Pilha de avaliação (topo primeiro).</summary>
    public IReadOnlyList<string> PilhaDeAvaliacao()
    {
        if (!iniciada) return Array.Empty<string>();

        return ((IEnumerable)Contexto.Runnable.ParamStack).Cast<object>().Select(Descrever).ToList();
    }

    /// <summary>
    /// Pilha de chamadas (topo primeiro). A VM intercala os quadros das funções com os endereços
    /// de retorno; cada quadro é mostrado com a instrução para a qual vai voltar.
    /// </summary>
    public IReadOnlyList<string> PilhaDeChamadas()
    {
        if (!iniciada) return Array.Empty<string>();

        var itens = ((IEnumerable)Contexto.Runnable.RuntimeStack).Cast<object>().ToList();
        var quadros = new List<string>();

        for (var i = 0; i < itens.Count; i++)
        {
            if (itens[i] is not FunctionCall chamada) continue;

            var nome = Quadro(chamada.Name).Nome;
            var retorno = i + 1 < itens.Count && itens[i + 1] is Operand { Value: Instruction destino }
                ? $" (volta para a instrução {destino.Index})"
                : "";

            quadros.Add(nome + retorno);
        }

        return quadros;
    }

    // A VM identifica cada chamada como "função:número" (ex.: "fatorial:2"); "main" é a principal.
    private static (string Nome, int Indice) Quadro(string? idInterno)
    {
        var partes = (idInterno ?? "").Split(':');
        var funcao = partes[0] == "main" ? "principal" : partes[0];
        var indice = partes.Length > 1 && int.TryParse(partes[1], out var n) ? n : 0;

        return (funcao == "principal" ? funcao : $"{funcao} #{indice}", indice);
    }

    private static string Descrever(object item) => item switch
    {
        Operand { Type: OperandType.Literal } o => Formatar(o.Value),
        Operand o => $"{o.Value} ({o.Type})",
        _ => item.ToString() ?? "",
    };

    private static string Formatar(object? valor) => valor switch
    {
        null => "nulo",
        string s => "\"" + s + "\"",
        bool b => b ? "verdadeiro" : "falso",
        object[] vetor => "{" + string.Join(", ", vetor.Select(Formatar)) + "}",
        _ => valor.ToString() ?? "",
    };
}
