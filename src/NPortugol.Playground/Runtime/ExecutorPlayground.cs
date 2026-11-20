using System.Diagnostics;
using NPortugol.Blazor;
using NPortugol.Runtime;

namespace NPortugol.Playground.Runtime;

public sealed record ErroDeCompilacao(string Mensagem, int Linha, int Coluna, int Comprimento);

public sealed record ResultadoExecucao(
    string Saida,
    bool Sucesso,
    string? Erro,
    ErroDeCompilacao? ErroDeCompilacao,
    TimeSpan Duracao);

/// <summary>Compila e executa um script NPortugol inteiramente no navegador.</summary>
public static class ExecutorPlayground
{
    // O navegador não consegue interromper a execução; o limite evita travar a aba num laço infinito.
    public const long LimiteDeInstrucoes = 2_000_000;

    public static ResultadoExecucao Executar(string codigo, string? entrada)
    {
        var modulo = new ModuloEntradaSaida(entrada);
        var cronometro = Stopwatch.StartNew();

        try
        {
            var motor = new Motor { MaxInstructions = LimiteDeInstrucoes };
            motor.Instalar(modulo);
            motor.Compilar(codigo);
            motor.Executar();

            return new ResultadoExecucao(modulo.Saida, true, null, null, cronometro.Elapsed);
        }
        catch (CompilationException e)
        {
            var erro = new ErroDeCompilacao(e.Message, e.Line, e.Column, Math.Max(1, e.OffendingText?.Length ?? 1));

            return new ResultadoExecucao(modulo.Saida, false, e.Message, erro, cronometro.Elapsed);
        }
        catch (Exception e)
        {
            // Erros de execução ainda não informam a linha do script (ver ROADMAP.md, Fase 3).
            var mensagem = string.IsNullOrWhiteSpace(e.Message) ? e.GetType().Name : e.Message;

            return new ResultadoExecucao(modulo.Saida, false, "Erro de execução: " + mensagem, null, cronometro.Elapsed);
        }
    }
}
