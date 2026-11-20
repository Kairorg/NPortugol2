using System.Globalization;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using NPortugol.Playground;

// O assembly da VM usa números decimais com vírgula e o módulo padrão interpreta datas no
// formato dd/MM/yyyy: ambos dependem da cultura pt-BR (ver ROADMAP.md, Fase 2).
var ptBr = new CultureInfo("pt-BR");
CultureInfo.DefaultThreadCurrentCulture = ptBr;
CultureInfo.DefaultThreadCurrentUICulture = ptBr;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

await builder.Build().RunAsync();
