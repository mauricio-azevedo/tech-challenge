/** numeric(15,2) no banco: 13 digitos inteiros e 2 decimais e o maximo que o valor comporta. */
const MAX_DIGITS = 15;

const amount = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Mascara de digitacao de moeda: so os digitos contam e o ultimo par sao os centavos, entao o
 * numero se forma da direita para a esquerda ("1" e 0,01; "12" e 0,12; "120" e 1,20) — como em
 * caixa eletronico e app de banco. Devolve `undefined` quando nao ha digito nenhum.
 */
export function digitsToValue(raw: string): number | undefined {
  const digits = raw
    .replace(/\D/gu, '')
    .replace(/^0+(?=\d)/u, '')
    .slice(0, MAX_DIGITS);
  return digits === '' ? undefined : Number(digits) / 100;
}

/** Texto do campo, sem o prefixo R$ (que fica fixo na borda do campo): "1.200,50". */
export function formatAmount(value: number): string {
  return amount.format(value);
}
