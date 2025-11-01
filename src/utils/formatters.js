export function allowOnlyNumbers(value) {
  return value.replace(/\D/g, '');
}

export function formatMoney(value) {
  const numbers = allowOnlyNumbers(value);
  if (!numbers) return '';

  const numberValue = parseFloat(numbers) / 100;
  return numberValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function parseToNumber(value) {
  if (typeof value === 'number') return value;
  const numbers = allowOnlyNumbers(value);
  return numbers ? parseFloat(numbers) / 100 : 0;
}
export const toNumber = parseToNumber;
