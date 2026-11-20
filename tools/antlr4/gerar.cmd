@echo off
rem Regenera os parsers C# a partir das gramaticas em src\grammar (requer Java 11+).
setlocal
set ROOT=%~dp0..\..
set JAR=%~dp0antlr-4.13.2-complete.jar
set OUT=%ROOT%\src\NPortugol\Generated

java -jar "%JAR%" -Dlanguage=CSharp -visitor -no-listener -encoding UTF-8 -Xexact-output-dir ^
  -package NPortugol -o "%OUT%" "%ROOT%\src\grammar\NPortugol.g4" || goto :erro

java -jar "%JAR%" -Dlanguage=CSharp -visitor -no-listener -encoding UTF-8 -Xexact-output-dir ^
  -package NPortugol.Runtime.Asm -o "%OUT%" "%ROOT%\src\grammar\ASM.g4" || goto :erro

del /q "%OUT%\*.interp" "%OUT%\*.tokens" 2>nul
echo Parsers gerados em %OUT%
exit /b 0

:erro
echo Falha ao gerar os parsers.
exit /b 1
