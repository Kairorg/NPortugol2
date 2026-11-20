using System;
using System.Collections.Generic;
using NPortugol.Runtime.Exceptions;
using NPortugol.Runtime.Interop;

namespace NPortugol.Runtime
{
    public class RuntimeContext : IRuntimeContext
    {
        private readonly Executor executor;

        private Dictionary<int, int> sourceMap;

        public RuntimeContext(Runnable runnable)
        {
            Runnable = runnable;

            Hospedagem = new Hospedagem();

            executor = new Executor(this);
        }

        public RuntimeContext(Runnable runnable, IHospedagem hospedagem)
        {
            Runnable = runnable;

            Hospedagem = hospedagem;

            executor = new Executor(this);
        }

        public bool Debug { get; set; }

        public bool Debugging { get; set; }

        public bool Completed { get; set; }

        public bool EnableGC { get; set; }

        /// <summary>
        /// Número máximo de instruções executadas desde a criação do contexto (0 = sem limite).
        /// Protege hosts que não podem interromper a execução, como o navegador.
        /// </summary>
        public long MaxInstructions { get; set; }

        /// <summary>Instruções executadas desde a criação do contexto.</summary>
        public long ExecutedInstructions { get; private set; }

        public Instruction CurrentInst { get; private set; }

        public FunctionCall CurrentFunction { get; set; }

        public Runnable Runnable { get; private set; }

        public IHospedagem Hospedagem { get; set; }

        public void Execute()
        {
            if (!Debugging)
            {
                InitWithMain();

                EnsureInstructions();   
            }                
            
            while (!Completed)
            {
                ExecuteInstruction();

                if (!Debug) continue;

                Debugging = true;

                if (sourceMap == null) return;

                if (!sourceMap.ContainsKey(CurrentInst.Index)) continue;

                return;
            }

            Runnable.ParamStack.Clear();

            Debugging = false;
            
        }

        public object Execute(string function, object parameter)
        {
            return Execute(function, new[] {parameter});
        }

        public object Execute(string function, object[] parameters)
        {
            Init(function, parameters);

            EnsureInstructions();

            while (!Completed)
            {
                ExecuteInstruction();
            }

            if (Runnable.ParamStack.Count == 1)
            {
                var operand = (Operand) Runnable.ParamStack.Pop();
                
                if (operand.Type == OperandType.Variable)
                {
                    return GetSymbolValue(operand.Value.ToString());
                }
                
                return operand.Value;
            }

            return null;
        }

        private void EnsureInstructions()
        {
            Completed = Runnable.InstrucStream.Size == 0 ? true : false;
        }

        public object GetSymbolValue(string id)
        {
            return Runnable.GetSymbolValue(id);
        }

        public object GetSymbolValue(string id, int index)
        {
            return Runnable.GetSymbolValue(id, index);
        }

        private void Init(Function function, object[] parameters)
        {
            Runnable.RuntimeStack.Clear();

            Runnable.RuntimeStack.Push(function);

            Runnable.IP = function.EntryPoint;

            Completed = false;

            if (parameters != null)
                foreach (object param in parameters)
                {
                    Runnable.ParamStack.Push(new Operand(OperandType.Literal, param));
                }
        }

        public void InitWithMain()
        {
            if (!Runnable.HasMainFunction())
                throw new MainNotFoundException();

            Init(Runnable.MainFunction, null);
        }

        public void Init(string function)
        {
            if (!Runnable.HasFunction(function))
                throw new FunctionNotFoundException(function);

            var target = Runnable.RetrieveFunction(function);

            Init(target, null);
        }

        public void LoadDebugInfo(Dictionary<int, int> info)
        {
            sourceMap = info;
        }

        private void Init(string function, object[] parameters)
        {
            if (!Runnable.HasFunction(function))
                throw new FunctionNotFoundException(function);
            
            var target = Runnable.RetrieveFunction(function);
            
            Init(target, parameters);
        }

        private void ExecuteInstruction()
        {
            ExecutedInstructions++;

            if (MaxInstructions > 0 && ExecutedInstructions > MaxInstructions)
                throw new RuntimeException(string.Format(
                    "Execução interrompida: limite de {0} instruções atingido. Verifique se há um laço infinito.",
                    MaxInstructions));

            if (CurrentFunction == null)
                CurrentFunction = Runnable.RuntimeStack.Peek() as FunctionCall;
            
            CurrentInst = Runnable.Instructions[Runnable.IP];
            Runnable.IP++;

            executor.ExecuteInstruction();
        }
    }
}