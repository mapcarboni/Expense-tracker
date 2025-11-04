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
 * Aceita múltiplos formatos de entrada:
 * - String com centavos: "12345" → "R$ 123,45"
 * - String formatada: "R$ 123,45" → "R$ 123,45"
 * - Número decimal: 123.45 → "R$ 123,45"
 * - String com vírgula/ponto: "123,45" ou "123.45" → "R$ 123,45"
 */
export function formatMoney(value) {
  if (value === null || value === undefined || value === '') return '';

  // Se já está formatado, retorna como está
  if (typeof value === 'string' && value.startsWith('R$')) return value;

  // Se é número decimal (vindo do banco), converte para centavos primeiro
  if (typeof value === 'number') {
    value = String(Math.round(value * 100));
  }

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
 * Converte qualquer formato para valor decimal (número)
 * Aceita:
 * - String formatada: "R$ 1.234,56" → 1234.56
 * - String com centavos: "123456" → 1234.56
 * - String com vírgula/ponto: "1234,56" ou "1234.56" → 1234.56
 * - Número: 1234.56 → 1234.56
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

/**
 * Formata valores vindos do banco para exibição
 * Aceita centavos (string) ou decimal (number) e retorna formatado
 */
export function formatDbValue(dbValue) {
  if (dbValue === null || dbValue === undefined) return '';

  // Se for string (centavos), formata direto
  if (typeof dbValue === 'string') {
    return formatMoney(dbValue);
  }

  // Se for número decimal, formata
  if (typeof dbValue === 'number') {
    return formatMoney(dbValue);
  }

  return '';
}
