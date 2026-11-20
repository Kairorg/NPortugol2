// Gramática da linguagem NPortugol (ANTLR 4.13.2).
//
// Diferente da versão ANTLR 3, esta gramática não constrói a AST com regras de
// reescrita (->): ela produz apenas a árvore sintática. A AST usada pelo compilador
// é montada por NPortugol.Ast.AstBuilder e percorrida por NPortugol.NPortugolWalker,
// que emite o assembly.
//
// Para regenerar o parser: tools\antlr4\gerar.cmd

grammar NPortugol;

script
    : declareFunction* EOF
    ;

declareFunction
    : 'função' name=ID '(' functionParamList* ')' statement* 'fim'
    ;

statement
    : declareLocal
    | ifStat
    | forStat
    | whileStat
    | repeatStat
    | selectStat
    | functionCall
    | assignVar
    | returnStat
    | asmCode
    ;

functionParamList
    : ID (',' ID)*
    ;

declareLocal
    : 'variável' ids+=ID (',' ids+=ID)* { DefineIds($ids); }
    ;

// 'então' é opcional: a versão ANTLR 3 aceitava sua ausência (por recuperação de erro)
// e os exemplos distribuídos usam "se x == 0 retorne 1 fim".
ifStat
    : 'se' logicExpression 'então'? statement* (senaoStat | 'fim')
    ;

senaoStat
    : 'senão' statement* 'fim'
    ;

forStat
    : 'para' assignVar 'até' index decrescente='decrescente'? statement* 'fim'
    ;

whileStat
    : 'enquanto' logicExpression statement* 'fim'
    ;

repeatStat
    : 'repita' statement* 'até' logicExpression
    ;

selectStat
    : 'selecione' atom selectCase+ 'fim'
    ;

selectCase
    : 'caso' atom ':' statement* 'fim'
    ;

functionCall
    : ID '(' functionArgList* ')'
    ;

propertyCall
    : obj=ID '.' prop=ID
    ;

methodCall
    : obj=ID '.' prop=ID '(' functionArgList* ')'
    ;

functionArgList
    : plusExpression (',' plusExpression)*
    ;

assignVar
    : ID '=' '[' INT '..' INT ']'               # assignRange
    | ID '=' '{' INT (';' INT)* '}'             # assignList
    | ID '[' index ']' '=' assignExpression     # assignIndexed
    | ID '=' assignExpression                   # assignSimple
    ;

returnStat
    : 'retorne' assignExpression
    ;

asmCode
    : '#' STRING* '#'
    ;

// ---------------------------------------------------------------------------
// Expressões

logicExpression
    : plusExpression (binop plusExpression)*
    ;

binop
    : '<' | '>' | '<=' | '>=' | '==' | '!=' | 'e' | 'ou'
    ;

assignExpression
    : plusExpression
    ;

plusExpression
    : mulExpression (('+' | '-') mulExpression)*
    ;

mulExpression
    : primaryArExpression (('/' | '%' | '*') primaryArExpression)*
    ;

// O predicado preserva a regra da gramática original: um identificador seguido
// de '(' só é chamada de função se não tiver sido declarado como variável.
primaryArExpression
    : {IsFunctionCallAhead()}? functionCall     # primaryCall
    | ID                                        # primaryId
    | T                                         # primaryTrue
    | F                                         # primaryFalse
    | ID '[' index ']'                          # primaryIndex
    | methodCall                                # primaryMethod
    | propertyCall                              # primaryProperty
    | constant                                  # primaryConstant
    | '(' plusExpression ')'                    # primaryParens
    ;

constant
    : INT | FLOAT | STRING
    ;

atom
    : constant | ID | T | F
    ;

index
    : INT | ID
    ;

// ---------------------------------------------------------------------------
// Léxico

T       : 'verdadeiro' ;
F       : 'falso' ;
ID      : [a-zA-Z_] [a-zA-Z0-9_]* ;
INT     : [0-9]+ ;
FLOAT   : INT '.' INT ;
WS      : [ \t\r\n]+ -> channel(HIDDEN) ;
STRING  : '"' ( ESC_SEQ | ~[\\"] )* '"' ;
CHAR    : '\'' ( ESC_SEQ | ~['\\] ) '\'' ;

fragment HEX_DIGIT   : [0-9a-fA-F] ;
fragment ESC_SEQ     : '\\' [btnfr"'\\] | UNICODE_ESC | OCTAL_ESC ;
fragment OCTAL_ESC   : '\\' [0-3] [0-7] [0-7] | '\\' [0-7] [0-7] | '\\' [0-7] ;
fragment UNICODE_ESC : '\\' 'u' HEX_DIGIT HEX_DIGIT HEX_DIGIT HEX_DIGIT ;
