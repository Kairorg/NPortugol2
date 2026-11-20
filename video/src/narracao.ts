// Roteiro da narração, cena a cena.
// Marcadores {nome} indicam o instante em que a animação correspondente começa;
// o script scripts/gerar-narracao.ts os remove do texto falado e grava o tempo
// de cada um em src/data/voiceover.json (a partir do alinhamento da ElevenLabs).
// Siglas são escritas como devem ser lidas (ex.: "J N E", "I P").

export type CenaNarrada = { id: string; texto: string };

export const narracao: CenaNarrada[] = [
  {
    id: "abertura",
    texto:
      "Você escreve algumas linhas de texto, aperta executar, e o computador faz exatamente o que você pediu. {pergunta}Mas o que acontece no meio do caminho? {raiox}Neste vídeo, vamos abrir o capô de uma linguagem de verdade, o NPortugol, usando o Raio-X, e seguir um programa desde o texto até a máquina virtual que o executa.",
  },
  {
    id: "linguagem",
    texto:
      "Uma linguagem de programação é um conjunto de regras. {sintaxe}A sintaxe diz como escrever: função, fim, se, retorne. {semantica}A semântica diz o que cada construção significa. {programa}Nosso exemplo é um fatorial recursivo: a função principal imprime o fatorial de três, {recursao}e fatorial chama a si mesma até chegar em zero.",
  },
  {
    id: "pipeline",
    texto:
      "Para o computador, esse texto é só uma sequência de caracteres. {compilador}O compilador o transforma em etapas: {lexico}análise léxica, {sintatico}análise sintática, {ast}uma árvore abstrata, {gerador}e a geração de código, que produz um assembly para uma máquina imaginária. {vm}Depois, a máquina virtual executa esse assembly, instrução por instrução.",
  },
  {
    id: "lexico",
    texto:
      "A primeira etapa é o analisador léxico. Ele lê os caracteres e os agrupa em tokens, as palavras da linguagem. {tokens}Na linha retorne fatorial de x menos um, vezes x, ele encontra uma palavra-chave, identificadores, símbolos, operadores e um número. {regras}Essas regras estão na gramática do NPortugol, escrita para o ANTLR. Espaços e comentários são descartados aqui mesmo.",
  },
  {
    id: "sintatico",
    texto:
      "Em seguida, o analisador sintático verifica se os tokens seguem a gramática. {gramatica}Uma função é a palavra função, um nome, os parâmetros, os comandos, e fim. {arvore}O resultado é uma árvore, e no Raio-X podemos vê-la: cada função vira um nó FUNC, com seu nome e sua lista de comandos. {precedencia}Repare que a árvore já resolve a precedência: a multiplicação fica acima da chamada de fatorial, e a subtração fica dentro do argumento.",
  },
  {
    id: "geracao",
    texto:
      "Agora o gerador de código percorre a árvore e emite instruções. {pilha}A máquina virtual do NPortugol é uma máquina de pilha: em vez de registradores, os valores são empilhados, e as operações consomem o topo. {expr}Então, x menos um vira: empilhe x, empilhe um, subtraia. {se}E o se x igual a zero vira uma comparação seguida de um desvio, J N E, que pula o retorne um quando x não é zero. {mapa}No Raio-X, cada instrução mostra de qual linha do código ela veio.",
  },
  {
    id: "anatomia",
    texto:
      "Vamos à máquina virtual. Ela tem poucas peças. {instrucoes}Uma lista de instruções. {ip}Um ponteiro de instrução, o I P, que indica a próxima a executar. {avaliacao}Uma pilha de avaliação, para os valores intermediários. {chamadas}Uma pilha de chamadas, que lembra para onde voltar quando uma função termina. {simbolos}E uma tabela de símbolos, com as variáveis de cada chamada.",
  },
  {
    id: "laco",
    texto:
      "O coração de toda máquina virtual é um laço. Este é o do NPortugol, em C#, na classe RuntimeContext. {while}Enquanto o programa não terminou, execute uma instrução. {busca}Executar uma instrução começa pela busca: pegar a instrução na posição do I P. {avanca}Logo em seguida, o I P avança. Assim, se a instrução não mexer nele, a próxima será a seguinte. {executa}Por fim, o executor decodifica e executa a instrução. {limite}No navegador há um detalhe: não dá para interromper um laço infinito, então a máquina conta as instruções e para ao atingir um limite. {ciclo}Busca, decodifica, executa. Milhões de vezes.",
  },
  {
    id: "despacho",
    texto:
      "A decodificação é um switch sobre o código da operação. {casos}Cada opcode tem o seu método: {memoria}MOV e D C L mexem na memória, {aritmetica}as operações aritméticas fazem contas, {desvios}JMP e J N E desviam, {pilha}PUSH e POP usam a pilha, {fluxo}e CALL e RET controlam as funções. {exemplo}Quando a instrução é S SUB, o switch despacha para ProcessArithmetic.",
  },
  {
    id: "pilha",
    texto:
      "Vejamos esses métodos por dentro. {push}PUSH cria um operando. Se ele for uma variável, busca o seu valor na tabela de símbolos, e empilha. {aritmetica}As operações de pilha desempilham dois valores, primeiro o da direita, depois o da esquerda, calculam, e empilham o resultado. {exemplo}Com x igual a três: empilha três, {um}empilha um, {ssub}e S SUB tira os dois e devolve dois.",
  },
  {
    id: "desvio",
    texto:
      "Desvios são ainda mais simples. {jne}J N E desempilha os dois valores comparados. {ip}Se forem diferentes, basta escrever um novo endereço no I P. {salto}Na próxima volta do laço, a busca já lê a instrução do rótulo. {conclusao}É assim que nascem o se, o enquanto e o para: só comparações e saltos.",
  },
  {
    id: "chamadas",
    texto:
      "E as funções? {call}CALL guarda na pilha de chamadas o endereço da instrução seguinte, o endereço de retorno, {entrada}e põe no I P o ponto de entrada da função. {hospedeiro}Se o nome for uma função do hospedeiro, como imprima, a máquina chama código C# diretamente. {ret}RET faz o caminho inverso: tira a função da pilha, recupera o endereço de retorno e volta para ele. {fim}Quando a pilha esvazia, o programa terminou.",
  },
  {
    id: "simulacao",
    texto:
      "Agora vamos juntar tudo e rodar o fatorial de três. {inicio}O I P começa em main. PUSH três, CALL fatorial, e a pilha de chamadas cresce. {recursao}Cada chamada recursiva cria um novo x: três, dois, um, zero. {base}Quando x é zero, o J N E não salta, e a função retorna um. {volta}Agora as chamadas se desfazem: um vezes um, vezes dois, vezes três. {final}O resultado, seis, chega a imprima. Foram sessenta instruções.",
  },
  {
    id: "raiox",
    texto:
      "Tudo isso você pode ver no Raio-X, o depurador web do NPortugol. {f11}Com F11, a máquina executa uma única instrução por vez, e o assembly destaca a instrução atual. {paineis}O painel de depuração mostra as variáveis, a pilha de chamadas e a pilha de avaliação, exatamente como na nossa animação. {saida}No final, a saída: seis.",
  },
  {
    id: "encerramento",
    texto:
      "Recapitulando: uma linguagem define regras; {compilador}o compilador transforma o texto em tokens, árvore e instruções; {vm}e a máquina virtual executa essas instruções num laço de busca, decodificação e execução. {convite}Abra o Raio-X, escreva o seu próprio programa, e veja cada passo por dentro.",
  },
  // ---------------------------------------------------------------------------------------------
  // Segundo vídeo, para leigos: "Como um computador entende o que você escreve" (ids leigo-*).
  // Sem detalhes técnicos do compilador ou da máquina virtual.
  {
    id: "leigo-abertura",
    texto:
      "Todo aplicativo que você usa, do jogo no celular ao banco na internet, começou do mesmo jeito: alguém escreveu um texto. {pergunta}Mas como um texto vira algo que o computador faz? {tema}É isso que vamos descobrir, de um jeito simples, com a ajuda do NPortugol, uma linguagem de programação em português.",
  },
  {
    id: "leigo-receita",
    texto:
      "Um programa é parecido com uma receita de bolo. {passos}É uma lista de passos, um depois do outro. {exato}A diferença é que o computador não tem bom senso. {literal}Se a receita disser bata os ovos, e não disser quando parar, ele bate para sempre. {conclusao}Por isso, cada passo precisa ser exato, sem nada que possa ser entendido de dois jeitos.",
  },
  {
    id: "leigo-linguagem",
    texto:
      "É para isso que existem as linguagens de programação. {idioma}Elas são como um idioma, só que com regras rígidas: um meio-termo entre o jeito que nós falamos e o que a máquina consegue seguir. {portugues}No NPortugol, as palavras são em português. {ola}Este programa manda o computador escrever na tela: Olá, mundo!",
  },
  {
    id: "leigo-ingredientes",
    texto:
      "Quase todo programa é feito com quatro ingredientes. {variavel}Variáveis, que são como caixinhas com etiqueta, onde guardamos valores. {decisao}Decisões: se acontecer isto, faça aquilo. {repeticao}Repetições: faça isto várias vezes, como escrever a tabuada do sete. {funcao}E funções, que são receitas dentro da receita, com um nome, para usar sempre que precisar.",
  },
  {
    id: "leigo-tradutor",
    texto:
      "Só que o computador não entende português. Ele entende apenas passos minúsculos e muito simples. {tradutor}Então, antes de rodar, um programa chamado compilador funciona como um tradutor. {palavras}Primeiro, ele separa o texto em palavras. {gramatica}Depois, confere a gramática, como um corretor ortográfico. Se faltar um parêntese, ele avisa onde está o erro. {passinhos}Por fim, reescreve tudo como uma lista de passos bem pequenos.",
  },
  {
    id: "leigo-maquina",
    texto:
      "Quem segue esses passos é a máquina virtual. {cozinheiro}Pense num cozinheiro muito rápido e muito obediente. {dedo}Ele mantém o dedo no passo atual, {anota}anota resultados num bloquinho, {proximo}e vai para o próximo. {rapido}Ele não pensa nem improvisa, mas faz isso milhões de vezes por segundo, e é dessa repetição que surge tudo o que um programa faz.",
  },
  {
    id: "leigo-raiox",
    texto:
      "No Raio-X do NPortugol, você vê tudo isso acontecendo. {codigo}De um lado, o seu programa. {passos}Do outro, os passos que o tradutor criou. {depurar}E você pode executar um passo de cada vez, vendo as caixinhas mudarem de valor, até o resultado aparecer na tela.",
  },
  {
    id: "leigo-encerramento",
    texto:
      "Resumindo: {receita}um programa é uma receita exata, {traducao}o tradutor transforma o texto em passos simples, {execucao}e a máquina segue esses passos, um por um, muito rápido. {convite}Errar faz parte. Abra o Raio-X, escreva o seu primeiro programa e veja o que acontece.",
  },
];
