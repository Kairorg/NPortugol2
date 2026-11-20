// Gramática do assembly textual da VM do NPortugol (ANTLR 4.13.2).
//
// As instruções são montadas por NPortugol.Runtime.Asm.AsmProgramBuilder,
// que percorre a árvore sintática (sem ações embutidas na gramática).
//
// Para regenerar o parser: tools\antlr4\gerar.cmd

grammar ASM;

script
    : NEWLINE* (line (NEWLINE+ line)* NEWLINE*)? EOF
    ;

line
    : func
    | label
    | instruction
    ;

func
    : ID ':'
    ;

label
    : '.' ID
    ;

instruction
    : op=(EXIT | RET | SADD | SSUB | SMUL | SDIV | SMOD | SCNT | EMP)                          # noOperand
    | op=(DCL | NEG | INC | DEC | JMP | PUSH | POP | JE | JNE | JG | JL | JGE | JLE | CALL) operand   # oneOperand
    | op=(MOV | ADD | SUB | MUL | DIV | MOD | POW | CNT) operand ';' operand                 # twoOperands
    | op=HOST ID (';' ID)*                                                                 # hostOperands
    ;

operand
    : ID (':' index)?       # variableOperand
    | INT                   # intOperand
    | T                     # trueOperand
    | F                     # falseOperand
    | FLOAT                 # floatOperand
    | STRING                # stringOperand
    ;

index
    : INT
    | ID
    ;

// ---------------------------------------------------------------------------
// Léxico

EMP  : 'EMP' ;
MOV  : 'MOV' ;
DCL  : 'DCL' ;
ADD  : 'ADD' ;
SADD : 'SADD' ;
SUB  : 'SUB' ;
SSUB : 'SSUB' ;
MUL  : 'MUL' ;
SMUL : 'SMUL' ;
DIV  : 'DIV' ;
SDIV : 'SDIV' ;
MOD  : 'MOD' ;
SMOD : 'SMOD' ;
POW  : 'POW' ;
NEG  : 'NEG' ;
INC  : 'INC' ;
DEC  : 'DEC' ;
CNT  : 'CNT' ;
JMP  : 'JMP' ;
JE   : 'JE' ;
JNE  : 'JNE' ;
JG   : 'JG' ;
JL   : 'JL' ;
JGE  : 'JGE' ;
JLE  : 'JLE' ;
PUSH : 'PUSH' ;
POP  : 'POP' ;
CALL : 'CALL' ;
RET  : 'RET' ;
EXIT : 'EXIT' ;
HOST : 'HOST' ;
SCNT : 'SCNT' ;

T : 'True' ;
F : 'False' ;

ID  : [a-zA-Z_] [a-zA-Z0-9_]* ;
INT : [0-9]+ ;

// Usa vírgula como separador decimal, como o compilador emite (cultura pt-BR).
FLOAT
    : [0-9]+ ',' [0-9]* EXPONENT?
    | ',' [0-9]+ EXPONENT?
    | [0-9]+ EXPONENT
    ;

NEWLINE : '\r'? '\n' ;

COMMENT
    : ( '//' ~[\r\n]* | '/*' .*? '*/' ) -> channel(HIDDEN)
    ;

WS : [ \t\r]+ -> channel(HIDDEN) ;

STRING : '"' ( ESC_SEQ | ~[\\"] )* '"' ;

fragment EXPONENT    : [eE] [+-]? [0-9]+ ;
fragment HEX_DIGIT   : [0-9a-fA-F] ;
fragment ESC_SEQ     : '\\' [btnfr"'\\] | UNICODE_ESC | OCTAL_ESC ;
fragment OCTAL_ESC   : '\\' [0-3] [0-7] [0-7] | '\\' [0-7] [0-7] | '\\' [0-7] ;
fragment UNICODE_ESC : '\\' 'u' HEX_DIGIT HEX_DIGIT HEX_DIGIT HEX_DIGIT ;
