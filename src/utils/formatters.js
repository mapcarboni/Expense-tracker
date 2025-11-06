/**
 * 💰 FORMATAÇÃO MONETÁRIA
 * Frontend: "123" ou "123,1" → Display: "R$ 123,10" → Banco: 123.10
 */

/**
 * Limpa input: aceita apenas números e vírgula
 */
export function cleanMoneyInput(value) {
  return String(value).replace(/[^\d,]/g, '');
}

/**
 * Formata para exibição
 * "123,1" | 123.10 (number) → "R$ 123,10"
 */
export function formatMoney(value) {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'string' && value.startsWith('R$')) return value;

  let numValue;

  if (typeof value === 'number') {
    numValue = value;
  } else if (typeof value === 'string' && value.includes(',')) {
    numValue = parseFloat(value.replace(',', '.'));
  } else {
    numValue = parseFloat(value);
  }

  if (isNaN(numValue)) return '';

  return numValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Converte para número (salvar no banco)
 * "R$ 123,10" | "123,10" → 123.10
 */
export function parseToNumber(value) {
  if (typeof value === 'number') return value;
  if (!value) return 0;

  const cleaned = String(value).replace(/[^\d,.]/g, '');
  const normalized = cleaned.replace(',', '.');
  const num = parseFloat(normalized);

  return isNaN(num) ? 0 : num;
}

export const toNumber = parseToNumber;
