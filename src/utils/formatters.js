/**
 * Remove todos os caracteres não numéricos
 */
export function allowOnlyNumbers(value) {
  return value.replace(/\D/g, '');
}

/**
 * Formata valor em moeda brasileira (R$ 1.234,56)
 * Permite usuário digitar centavos naturalmente
 */
export function formatMoney(value) {
  // Se já está formatado, remove formatação
  const cleanValue = typeof value === 'string' ? value.replace(/\D/g, '') : String(value);

  if (!cleanValue || cleanValue === '0') return '';

  // Converte centavos para reais
  const numberValue = parseFloat(cleanValue) / 100;

  return numberValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Converte string formatada ou número para valor decimal
 * Exemplos:
 * - "R$ 1.234,56" -> 1234.56
 * - "123456" -> 1234.56
 * - 1234.56 -> 1234.56
 */
export function parseToNumber(value) {
  if (typeof value === 'number') return value;
  if (!value) return 0;

  // Remove tudo exceto números
  const numbers = allowOnlyNumbers(String(value));

  // Converte centavos para reais
  return numbers ? parseFloat(numbers) / 100 : 0;
}

// Alias para compatibilidade
export const toNumber = parseToNumber;

/**
 * Formata input de moeda enquanto usuário digita
 * Retorna objeto com valor formatado e valor numérico
 *
 * Uso:
 * const { formatted, numeric } = formatMoneyInput(e.target.value);
 * setValue(formatted);
 */
export function formatMoneyInput(value) {
  const formatted = formatMoney(value);
  const numeric = parseToNumber(value);

  return { formatted, numeric };
}

/**
 * Valida se valor está dentro dos limites permitidos
 */
export function isValidMoneyValue(value, min = 0.01, max = 9999999.99) {
  const numeric = parseToNumber(value);
  return numeric >= min && numeric <= max;
}
