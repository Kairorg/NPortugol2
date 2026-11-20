@echo off
setlocal
set BUILD_TARGET=%~1
if "%BUILD_TARGET%"=="" set /p BUILD_TARGET="Build Target: "
if not "%BUILD_TARGET%"=="" set BUILD_TARGET="/target:%BUILD_TARGET%"

rem Localiza o MSBuild do Visual Studio 2019+ (necessario para .NET 4.8 e pacotes NuGet).
set VSWHERE=%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe
if not exist "%VSWHERE%" goto :semvs
for /f "usebackq tokens=*" %%i in (`"%VSWHERE%" -latest -products * -requires Microsoft.Component.MSBuild -find MSBuild\**\Bin\MSBuild.exe`) do set MSBUILD=%%i
if not defined MSBUILD goto :semvs

"%MSBUILD%" build.config /nologo %BUILD_TARGET% %2 %3 %4 %5 %6 %7 %8 %9
endlocal
if errorlevel 1 pause
exit /b

:semvs
echo MSBuild do Visual Studio nao encontrado. Instale o Visual Studio 2019+ ou o Build Tools
echo com a carga de trabalho ".NET desktop" e o pacote de direcionamento do .NET Framework 4.8.
endlocal
pause
exit /b 1
