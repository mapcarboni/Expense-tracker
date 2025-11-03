// ========================================
// CONFIGURAÇÕES GERAIS
// ========================================
export const MAX_YEARS_RETAINED = 6; // Últimos 6 anos incluindo atual

// ========================================
// DESTINOS DE DESPESAS
// ========================================
export const DESTINATIONS = [
  {
    value: 'fixed_first',
    label: 'Contas Fixas - 1ª Quinzena',
    icon: 'Calendar',
    description: '(dia 1-15)',
  },
  {
    value: 'fixed_second',
    label: 'Contas Fixas - 2ª Quinzena',
    icon: 'Calendar',
    description: '(dia 16-30)',
  },
  {
    value: 'credit_card_1',
    label: 'Cartão de Crédito Marc',
    icon: 'CreditCard',
  },
  {
    value: 'credit_card_2',
    label: 'Cartão de Crédito Neca',
    icon: 'CreditCard',
  },
];

export const DESTINATION_LABELS = {
  fixed_first: 'Contas Fixas - 1ª Quinzena',
  fixed_second: 'Contas Fixas - 2ª Quinzena',
  credit_card_1: 'Cartão de Crédito Marc',
  credit_card_2: 'Cartão de Crédito Neca',
};

// ========================================
// CATEGORIAS DE DESPESAS
// ========================================
export const EXPENSE_CATEGORIES = {
  IPTU: {
    label: 'IPTU',
    icon: '🏠',
    color: 'blue',
  },
  IPVA: {
    label: 'IPVA',
    icon: '🚗',
    color: 'green',
  },
  SEGURO: {
    label: 'Seguro',
    icon: '🛡️',
    color: 'purple',
  },
  OUTROS: {
    label: 'Outros',
    icon: '📋',
    color: 'gray',
  },
};

// ========================================
// CLASSES CSS REUTILIZÁVEIS
// ========================================
export const INPUT_CLASS =
  'w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-1.5 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all';

export const INPUT_ERROR_CLASS =
  'w-full rounded-md border-2 border-red-500 bg-gray-700 px-3 py-1.5 text-white placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all';

export const LABEL_CLASS = 'block text-sm font-medium text-gray-300 mb-1';

export const BUTTON_PRIMARY =
  'flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

export const BUTTON_SECONDARY =
  'rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-gray-600 transition-colors';

// ========================================
// VALIDAÇÕES
// ========================================
export const VALIDATION_RULES = {
  year: {
    min: new Date().getFullYear() - MAX_YEARS_RETAINED + 1,
    max: new Date().getFullYear() + 10,
  },
  installments: {
    min: 1,
    max: 24,
  },
  value: {
    min: 0.01,
    max: 9999999.99,
  },
};
