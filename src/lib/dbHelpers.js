// ==================== CONVERSÕES ====================

export function toSnakeCase(obj) {
  const newObj = {};
  for (const key in obj) {
    const snake = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    newObj[snake] = obj[key];
  }
  return newObj;
}

export function toCamelCase(obj) {
  const newObj = {};
  for (const key in obj) {
    const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    newObj[camel] = obj[key];
  }
  return newObj;
}

// ==================== FORMATAÇÃO MONETÁRIA ====================

export function parseToNumber(value) {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const cleaned = String(value).replace(/[^\d,.]/g, '');
  const normalized = cleaned.replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}

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

// ==================== DATAS ====================

export function formatDateToBR(date) {
  if (!date) return '';
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR');
}

export function parseDate(dateStr) {
  if (!dateStr) return null;
  return dateStr.split('T')[0];
}

// ==================== HELPERS BANCO → FRONT ====================

export function toDbFormat(data, parseFields = []) {
  const formatted = { ...data };

  // Converte campos monetários
  parseFields.forEach((field) => {
    if (formatted[field] !== undefined) {
      formatted[field] = parseToNumber(formatted[field]);
    }
  });

  return toSnakeCase(formatted);
}

export function fromDbFormat(data) {
  return toCamelCase(data);
}
