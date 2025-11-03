/**
 * Remove todos os caracteres não numéricos (exceto vírgula e ponto)
 */
export function allowOnlyNumbers(value) {
  return value.replace(/[^\d,\.]/g, '');
}

/**
 * Processa input permitindo vírgula/ponto para centavos
 * Ex: "1234,56" → "123456" ou "1234.56" → "123456"
 */
function normalizeInput(value) {
  if (!value) return '';

  const str = String(value);

  // Se tem vírgula ou ponto, trata como decimal
  if (str.includes(',') || str.includes('.')) {
    const parts = str.replace(',', '.').split('.');
    const inteiros = parts[0].replace(/\D/g, '');
    const centavos = parts[1] ? parts[1].replace(/\D/g, '').slice(0, 2).padEnd(2, '0') : '00';
    return inteiros + centavos;
  }

  // Senão, trata como centavos
  return str.replace(/\D/g, '');
}

/**
 * Formata valor em moeda brasileira (R$ 1.234,56)
 * Aceita: "1234,56", "1234.56", "123456" (centavos)
 */
export function formatMoney(value) {
  const cleanValue = normalizeInput(value);

  if (!cleanValue || cleanValue === '0' || cleanValue === '00') return '';

  // Converte centavos para reais
  const numberValue = parseFloat(cleanValue) / 100;

  return numberValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Converte string formatada ou número para valor decimal
 * Aceita: "R$ 1.234,56", "1234,56", "1234.56", "123456" (centavos)
 */
export function parseToNumber(value) {
  if (typeof value === 'number') return value;
  if (!value) return 0;

  const cleanValue = normalizeInput(String(value));

  // Converte centavos para reais
  return cleanValue ? parseFloat(cleanValue) / 100 : 0;
}

// Alias para compatibilidade
export const toNumber = parseToNumber;

/**
 * Formata input de moeda enquanto usuário digita
 * Retorna objeto com valor formatado e valor numérico
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
