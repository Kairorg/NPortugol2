// Programa de exemplo usado no vídeo e o assembly que o compilador do NPortugol gera para ele
// (copiado do painel Assembly do Raio-X).

export const PROGRAMA = `função principal()
    imprima(fatorial(3))
fim

função fatorial(x)
    se x == 0 retorne 1 fim
    retorne fatorial(x - 1) * x
fim`;

export type LinhaAsm = { i: number; texto: string; fonte?: number };

export const ASM: LinhaAsm[] = [
  { i: 0, texto: "main:" },
  { i: 1, texto: "EMP" },
  { i: 2, texto: "PUSH 3", fonte: 2 },
  { i: 3, texto: "CALL fatorial", fonte: 2 },
  { i: 4, texto: "CALL imprima", fonte: 2 },
  { i: 5, texto: "RET", fonte: 2 },
  { i: 6, texto: "fatorial:" },
  { i: 7, texto: "DCL x" },
  { i: 8, texto: "POP x" },
  { i: 9, texto: "EMP" },
  { i: 10, texto: "PUSH x", fonte: 6 },
  { i: 11, texto: "PUSH 0", fonte: 6 },
  { i: 12, texto: "JNE label_0", fonte: 6 },
  { i: 13, texto: "PUSH 1", fonte: 6 },
  { i: 14, texto: "RET", fonte: 6 },
  { i: 15, texto: ".label_0" },
  { i: 16, texto: "PUSH x", fonte: 7 },
  { i: 17, texto: "PUSH 1", fonte: 7 },
  { i: 18, texto: "SSUB", fonte: 7 },
  { i: 19, texto: "CALL fatorial", fonte: 7 },
  { i: 20, texto: "PUSH x", fonte: 7 },
  { i: 21, texto: "SMUL", fonte: 7 },
  { i: 22, texto: "RET", fonte: 7 },
];
