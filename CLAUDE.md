# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

NPortugol is a scripting language with Portuguese syntax (`função`, `variável`, `fim`, ...) meant to run inside .NET host applications. The library targets **`net48` and `netstandard2.0`**. The Windows tools target .NET Framework 4.8, and the web playground targets .NET 10 (Blazor WebAssembly). Identifiers, error messages and public APIs are mostly in Portuguese (`Compilar`, `Executar`, `Hospedagem`, `Registrar`, `Modulo`). `ROADMAP.md` lists the planned evolution, including known language limitations and the error-handling plan.

## Build & test

- Two solution files list the same projects and folders: `src/NPortugol.slnx` (Visual Studio 2026) and `src/NPortugol.sln` (Visual Studio 2022 format). If you add or remove a project, update **both**, and also the project list in `build.config`. Don't use `dotnet sln add` on the `.sln`: it adds back unused `x64`/`x86` platforms. `WebSample` (ASP.NET, packages.config) is not in either solution.
- **Library and tests only** (SDK-style projects): `dotnet test src/NPortugol.Tests/NPortugol.Tests.csproj` runs the suite on `net48` and on `net10.0` (which exercises the `netstandard2.0` library). Run one fixture or test with `--filter "FullyQualifiedName~CompilerRegressionTestCase"`, and one runtime with `-f net10.0`.
- **Playground**: `dotnet run --project src/NPortugol.Playground` serves it locally. `dotnet publish src/NPortugol.Playground -c Release -o <dir>` produces a static site in `<dir>/wwwroot` that any static host can serve.
- **Whole solution**: needs the Visual Studio MSBuild, because `dotnet build` can't compile the `.resx` files of the old-style WinForms projects. `build.cmd <Target>` finds it with `vswhere` and runs `build.config`, which builds an explicit list of projects (everything except the playground) into `build/`. Targets: `Clean`, `Build` (restores NuGet first), `Rebuild`, `Test` (both runtimes), `Merge` (ILMerge 3 merges `Npc.exe` with its DLLs), `Package*` (`PackagePlayground` publishes the site to `build/playground` and zips it), and `Integrate` (the default: rebuild, test, package into `pkg/`). `ClickToBuild.cmd` runs `build.cmd integrate`.
- With `OutDir` forced to `build/`, the `netstandard2.0` library and the `net10.0` tests go into `build/netstandard2.0/` and `build/net10.0/`. The `TreatAsLocalProperty="OutDir"` block in their `.csproj` handles this; without it the two `NPortugol.dll` files would overwrite each other.
- Tests use NUnit 3, Moq and `Microsoft.NET.Test.Sdk` from NuGet.

## Architecture

The pipeline is **source → ANTLR 4 parse tree → AST → textual assembly ("ASM") → parsed into instructions → run on a stack VM**.

1. **Grammars (`src/grammar/*.g4`, ANTLR 4.13.2)**: `NPortugol.g4` is the language and `ASM.g4` is the VM assembly. The C# parsers generated from them live in `src/NPortugol/Generated/` and are checked in. Never hand-edit them: change the `.g4` file and run `tools\antlr4\gerar.cmd` (needs Java 11+; the tool jar is bundled). The runtime package is `Antlr4.Runtime.Standard` 4.13.1, the newest on NuGet, which is compatible with the 4.13.2 tool output. Grammar actions and predicates call members defined in `src/NPortugol/Ast/NPortugolParser.Members.cs` (a partial class), which keeps C# out of the grammar.
2. **Compiler (`src/NPortugol/Npc.cs`, `src/NPortugol/Ast/`)**: `AstBuilder` turns the parse tree into an `AstNode` tree with the same shape the old ANTLR 3 rewrite rules produced (imaginary nodes `FUNC`, `SLIST`, `ASGN`, `LOOP`...). `NPortugolWalker`, a hand-written port of the old ANTLR 3 tree grammar, walks it and calls `Emissor`, which uses the string templates in `AsmTemplate`. `Npc.Compilar` returns a `Bytecode` (the ASM lines, the function names and a source map). `BytecodeSerializer` saves and loads `.npx` files.
3. **Errors**: lexer and parser errors go through `ThrowingErrorListener` and become a `CompilationException` (`Line`, `Column`, `OffendingText`) at the first error. Valid syntax that the compiler can't handle (`e`/`ou`, chained comparisons, a condition that isn't a comparison) also throws `CompilationException` from the walker.
4. **Runtime (`src/NPortugol/Runtime/`)**: `AntlrRunnableBuilder` uses `AsmProgramBuilder` to turn the ASM into a `Runnable` (`Instruction`, `OpCode`, `Operand`, `FunctionTable`). The ASM parser is deliberately **lenient**: it reproduces ANTLR 3's error recovery, drops malformed lines and collects errors in `Errors` instead of throwing. `RuntimeContext` and `Executor` run the program using `RuntimeStack` and `ParamStack`. `Motor` is the main host-facing facade: `Compilar(script)`, `Load(asm|bytecode)`, `Executar()` and `Executar(funcName, params)`.
5. **Interop (`Runtime/Interop/`)**: host functions are registered on an `IHospedagem` (`Hospedagem.Registrar(name, Func<object[],object> | IFuncaoHospedada, isVoid)`). An `IModulo` is a named bundle of host functions that you install with `Motor.Instalar(...)`. `ModuloPadrao` (standard library: `vetorizar`, `data`, `hoje`, `nomedia`) is installed automatically. Host-specific modules live in `src/Npc/Modules/` and `src/NPortugol.Web/Modules/`.
6. **ILTranslator**: a proof of concept that translates a `Bytecode` into a `DynamicMethod`. It only exists in the `net48` build, because `netstandard2.0` has no `Reflection.Emit`, and it is covered by `TranslationTestCase` (net48 only).

### Hosts and tools built on the core library
- **Npc**: command-line compiler and runner.
- **GrammarIDE**: WinForms tool (MVP: `Presenters/`, `Views/`) for viewing the AST (rendered with Graphviz through `Core/AstDotGenerator`) and stepping through execution.
- **TurboNPortugol**: WinForms IDE for end users, with example scripts in `Exemplos/`.
- **NPortugol.Web**: an ASP.NET `IHttpHandler` (`NPHttpHandler`) that routes requests to Classic, MVC (`App/Mvc`) or Asm apps written in `.np` scripts. `WebSample` is a sample site that uses it.
- **NPortugol.Playground**: Blazor WebAssembly site that compiles and runs scripts entirely in the browser, with no server.
  - The Monaco editor comes from the BlazorMonaco package. `wwwroot/js/nportugol.js` registers the language (Monarch highlighting, indentation, keyword and built-in function completion) and draws error markers.
  - `Runtime/ExecutorPlayground` runs a script with `Motor.MaxInstructions` set, because the browser can't interrupt a running loop.
  - `Runtime/ModuloPlayground` provides `imprima`, `imprimaLinha`, `imprimaVetor` and `leia` (which reads lines from the Entrada box).
  - `Runtime/LinkCompartilhavel` stores the program in the URL fragment (`#c=`, Deflate + Base64).
  - Examples are `Exemplos/*.np`, embedded as resources; register new ones in `Runtime/Exemplos.cs`.
  - Gotchas: `Program.cs` forces the pt-BR culture, and the `.csproj` loads all ICU data so that works in any browser. `TrimmerRootAssembly` keeps NPortugol intact because the VM reads properties by reflection (`v.tamanho`, `data.numerodia`).

### Tests (`src/NPortugol.Tests`)
- `GrammarTestCase` checks AST shapes (`BaseTest.BuildAST` returns the first `FUNC` node). `CompilerTestCase` checks ASM emission. `CompilerRegressionTestCase` pins the bugs fixed in the ANTLR 4 migration and the `CompilationException` behaviour.
- `Runtime/` holds the instruction-level VM tests (`Instructions/`), integration tests that run whole scripts (`Integration/`), and BDD-style specs (`Specs/*Design.cs`).

## Gotchas
- **ASM output is a compatibility contract.** Compiled scripts, saved `.npx` files and the tests depend on the exact instruction sequence and label numbering. If you change the walker or `Emissor`, compare the generated ASM before and after on real scripts (the `TurboNPortugol/Exemplos` scripts are a good corpus).
- Behaviours preserved on purpose: `então` is optional (the bundled examples omit it), a method call on a host object pushes its arguments but emits no call, `para ... até N` excludes `N`, and decimals are parsed and printed with the current culture (only pt-BR works). See `ROADMAP.md` before "fixing" any of these.
- `+` adds numbers only; it fails at run time on text (`"a" + nome`). To print several values, pass them all to `imprima(...)`.
- The library and the tests use C# 7.3 (the default for .NET Framework 4.8). The playground uses the C# version of .NET 10.
- Many source files are **ISO-8859-1 (Latin-1)**, not UTF-8 (for example `Runtime/Interop/Hospedagem.cs` and `Modulos/ModuloPadrao.cs`). Keep the existing encoding when editing files with accented strings, or they will be garbled. The grammars and new files are UTF-8. Script files (`.np`) are UTF-8 with a BOM.
- `build/` and `pkg/` at the repo root are build output and are git-ignored. `*.xml` files are also git-ignored.
