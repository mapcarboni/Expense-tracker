import { supabase } from './supabase';

// ===============================
// CONFIGURAÇÃO
// ===============================
const YEARS_TO_RETAIN = 3; // Ex: 2025, 2024, 2023

// ===============================
// 🔄 Conversões camelCase ⇄ snake_case
// ===============================

/** front → banco */
function toSnakeCase(obj) {
  const newObj = {};
  for (const key in obj) {
    const snake = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    newObj[snake] = obj[key];
  }
  return newObj;
}

/** banco → front */
function toCamelCase(obj) {
  const newObj = {};
  for (const key in obj) {
    const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    newObj[camel] = obj[key];
  }
  return newObj;
}

// ===============================
// 🧮 Conversões específicas do módulo "decisions"
// ===============================

/** "R$ 1.234,56" → 1234.56 */
function parseToNumber(value) {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const cleaned = String(value).replace(/[^\d,.]/g, '');
  const normalized = cleaned.replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}

/** front → banco (com números tratados e snake_case aplicado) */
function toDbFormat(expense) {
  const formatted = {
    type: expense.type,
    description: expense.description,
    paymentChoice: expense.paymentChoice || null,
    destination: expense.destination || null,

    cashValue: parseToNumber(expense.cashValue),
    cashDueDate: expense.cashDueDate || null,

    installments: expense.installments ? parseInt(expense.installments) : null,
    installmentValue: parseToNumber(expense.installmentValue),
    firstInstallmentDate: expense.firstInstallmentDate || null,

    garbageTaxCash: parseToNumber(expense.garbageTaxCash),
    garbageTaxInstallment: parseToNumber(expense.garbageTaxInstallment),

    dpvatValue: parseToNumber(expense.dpvatValue),
    dpvatDueDate: expense.dpvatDueDate || null,

    licensingValue: parseToNumber(expense.licensingValue),
    licensingDueDate: expense.licensingDueDate || null,
  };

  return toSnakeCase(formatted);
}

/** banco → front (com camelCase restaurado e valores derivados) */
function fromDbFormat(dbExpense) {
  const camel = toCamelCase(dbExpense);

  return {
    ...camel,
    value: camel.cashValue || camel.installmentValue,
    dueDate: camel.cashDueDate || camel.firstInstallmentDate,
  };
}

// ======================================================
// 📌 OPERAÇÕES PRINCIPAIS
// ======================================================

/** Carrega planejamento */
export async function loadYearPlan(userId, year) {
  try {
    const { data, error } = await supabase
      .from('decisions')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year)
      .order('type', { ascending: true })
      .order('description', { ascending: true });

    if (error) throw error;

    return (data || []).map(fromDbFormat);
  } catch (error) {
    console.error('Erro ao carregar:', error);
    throw new Error('Falha ao carregar planejamento');
  }
}

/** Limpa anos antigos */
async function cleanOldYears(userId, currentYear) {
  try {
    const minYearAllowed = currentYear - (YEARS_TO_RETAIN - 1);

    const { error } = await supabase
      .from('decisions')
      .delete()
      .eq('user_id', userId)
      .lt('year', minYearAllowed);

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao limpar anos antigos:', error);
  }
}

/** Salvar planejamento */
export async function saveYearPlan(userId, year, expenses) {
  try {
    // Buscar despesas existentes
    const { data: existingExpenses, error: fetchError } = await supabase
      .from('decisions')
      .select('id')
      .eq('user_id', userId)
      .eq('year', year);

    if (fetchError) throw fetchError;

    const existingIds = new Set((existingExpenses || []).map((e) => e.id));
    const currentIds = new Set(expenses.filter((e) => e.id && e.id.includes('-')).map((e) => e.id));

    const toInsert = [];
    const toUpdate = [];

    // Separar INSERTs e UPDATEs
    expenses.forEach((expense) => {
      const dbData = toDbFormat(expense);
      const isUUID = expense.id && expense.id.includes('-');

      if (isUUID && existingIds.has(expense.id)) {
        toUpdate.push({ id: expense.id, user_id: userId, year, ...dbData });
      } else {
        toInsert.push({ user_id: userId, year, ...dbData });
      }
    });

    // Identificar DELETEs
    const toDelete = [...existingIds].filter((id) => !currentIds.has(id));

    const promises = [];

    if (toInsert.length > 0) {
      promises.push(supabase.from('decisions').insert(toInsert));
    }

    if (toUpdate.length > 0) {
      toUpdate.forEach(({ id, user_id, ...updateData }) => {
        promises.push(
          supabase.from('decisions').update(updateData).eq('id', id).eq('user_id', user_id),
        );
      });
    }

    if (toDelete.length > 0) {
      promises.push(supabase.from('decisions').delete().eq('user_id', userId).in('id', toDelete));
    }

    const results = await Promise.all(promises);

    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      throw new Error(`Falha ao salvar ${errors.length} despesa(s)`);
    }

    // Limpar anos antigos
    await cleanOldYears(userId, year);

    return { success: true };
  } catch (error) {
    console.error('Erro ao salvar:', error);
    throw error;
  }
}

/** Buscar anos disponíveis */
export async function getAvailableYears(userId) {
  try {
    const { data, error } = await supabase
      .from('decisions')
      .select('year')
      .eq('user_id', userId)
      .order('year', { ascending: false });

    if (error) throw error;

    return [...new Set(data?.map((d) => d.year) || [])];
  } catch (error) {
    console.error('Erro ao buscar anos:', error);
    return [];
  }
}

/** Deletar despesa */
export async function deleteExpense(userId, expenseId) {
  try {
    const { error } = await supabase
      .from('decisions')
      .delete()
      .eq('user_id', userId)
      .eq('id', expenseId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar:', error);
    throw new Error('Falha ao deletar despesa');
  }
}
