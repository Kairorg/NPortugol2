using System;
using System.Diagnostics;
using System.IO;
using GrammarIDE.Core;
using GrammarIDE.Views.Ast;
using NPortugol;
using NPortugol.Ast;

namespace GrammarIDE.Presenters
{
    public interface IAstPresenter
    {
        IAstView AstView { get; set; }

        Config Config { get; }

        IMainPresenter MainPresenter { get; set; }

        void Parse(string text);
    }

    public class AstPresenter : IAstPresenter
    {
        private IConfigRepo configRepo;

        public AstPresenter(IConfigRepo configRepo, IMainPresenter mainPresenter)
        {
            this.configRepo = configRepo;
            this.MainPresenter = mainPresenter;
        }

        public IAstView AstView { get; set; }

        public Config Config
        {
            get { return configRepo.GetConfig(); }
        }

        public IMainPresenter MainPresenter { get; set; }

        public void Parse(string script)
        {
            try
            {
                configRepo.SaveScript(script);

                MainPresenter.MainView.ClearOutput();

                CreateASTGraph(new Npc().GerarAst(script));
            }
            catch (CompilationException ex)
            {
                MainPresenter.Error(ex.Message);
            }
            catch (Exception ex)
            {
                throw new Exception((string.Format("Putz... Erro não identificado :( [{0}]", ex.Message)));
            }
        }

        private void CreateASTGraph(AstNode ast)
        {
            if (string.IsNullOrEmpty(Config.DotPath)) return;

            var dotpath = string.Format("{0}\\dot.exe", Config.DotPath);

            if (!Directory.Exists(Config.DotPath))
            {
                throw new Exception("Caminho da ferramenta dot.exe inválido.");
            }

            var dotgraph = new AstDotGenerator().ToDot(ast);

            dotgraph = new DotGraphStyle { FontSize = AstView.FontSize }.Apply(dotgraph);

            var writer = new StreamWriter("graph.dot");
            writer.Write(dotgraph);
            writer.Close();

            if (File.Exists("graph.png")) File.Delete("graph.png");

            var psi = new ProcessStartInfo(dotpath, "-Tpng graph.dot -o graph.png");
            var p = new Process { StartInfo = psi };
            p.Start();
            p.WaitForExit();

            AstView.LoadAstImage("graph.png");
        }
    }
}