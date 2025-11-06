import { supabase } from './supabase';

// ⚙️ CONFIGURAÇÃO: Quantos anos manter (ano atual + N anteriores)
const YEARS_TO_RETAIN = 3; // Ex: 2025, 2024, 2023

/**
 * Converte frontend → banco
 * "R$ 123,10" → 123.10 (DECIMAL)
 */
function toDbFormat(expense) {
  return {
    type: expense.type,
    description: expense.description,
    payment_choice: expense.paymentChoice || null,
    destination: expense.destination || null,

    cash_value: expense.cashValue ? parseToNumber(expense.cashValue) : 0,
    cash_due_date: expense.cashDueDate || null,

    installments: expense.installments ? parseInt(expense.installments) : null,
    installment_value: expense.installmentValue ? parseToNumber(expense.installmentValue) : 0,
    first_installment_date: expense.firstInstallmentDate || null,

    garbage_tax_cash: expense.garbageTaxCash ? parseToNumber(expense.garbageTaxCash) : 0,
    garbage_tax_installment: expense.garbageTaxInstallment
      ? parseToNumber(expense.garbageTaxInstallment)
      : 0,

    dpvat_value: expense.dpvatValue ? parseToNumber(expense.dpvatValue) : 0,
    dpvat_due_date: expense.dpvatDueDate || null,
    licensing_value: expense.licensingValue ? parseToNumber(expense.licensingValue) : 0,
    licensing_due_date: expense.licensingDueDate || null,
  };
}

/**
 * Converte banco → frontend
 * 123.10 (DECIMAL) → 123.10 (number)
 */
function fromDbFormat(dbExpense) {
  return {
    id: dbExpense.id,
    type: dbExpense.type,
    description: dbExpense.description,
    paymentChoice: dbExpense.payment_choice,
    destination: dbExpense.destination,

    cashValue: dbExpense.cash_value,
    cashDueDate: dbExpense.cash_due_date,

    installments: dbExpense.installments,
    installmentValue: dbExpense.installment_value,
    firstInstallmentDate: dbExpense.first_installment_date,

    garbageTaxCash: dbExpense.garbage_tax_cash,
    garbageTaxInstallment: dbExpense.garbage_tax_installment,

    dpvatValue: dbExpense.dpvat_value,
    dpvatDueDate: dbExpense.dpvat_due_date,
    licensingValue: dbExpense.licensing_value,
    licensingDueDate: dbExpense.licensing_due_date,

    value: dbExpense.cash_value || dbExpense.installment_value,
    dueDate: dbExpense.cash_due_date || dbExpense.first_installment_date,

    createdAt: dbExpense.created_at,
    updatedAt: dbExpense.updated_at,
  };
}

function parseToNumber(value) {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const cleaned = String(value).replace(/[^\d,.]/g, '');
  const normalized = cleaned.replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}

/**
 * Carrega planejamento do ano
 */
export async function loadYearPlan(userId, year) {
  try {
    const { data, error } = await supabase
      .from('decisions')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(fromDbFormat);
  } catch (error) {
    console.error('Erro ao carregar:', error);
    throw new Error('Falha ao carregar planejamento');
  }
}

/**
 * Limpa anos antigos
 */
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
    console.error('Erro ao limpar anos:', error);
  }
}

/**
 * Salva planejamento
 */
export async function saveYearPlan(userId, year, expenses) {
  try {
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

    expenses.forEach((expense) => {
      const dbData = toDbFormat(expense);
      const isUUID = expense.id && expense.id.includes('-');

      if (isUUID && existingIds.has(expense.id)) {
        toUpdate.push({ id: expense.id, user_id: userId, year, ...dbData });
      } else {
        toInsert.push({ user_id: userId, year, ...dbData });
      }
    });

    const toDelete = [...existingIds].filter((id) => !currentIds.has(id));
    const promises = [];

    if (toInsert.length > 0) {
      promises.push(
        supabase
          .from('decisions')
          .insert(toInsert)
          .then((res) => {
            if (res.error) console.error('❌ INSERT:', res.error);
            return res;
          }),
      );
    }

    if (toUpdate.length > 0) {
      toUpdate.forEach((expense) => {
        const { id, user_id, created_at, updated_at, ...updateData } = expense;
        promises.push(
          supabase
            .from('decisions')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user_id)
            .then((res) => {
              if (res.error) console.error('❌ UPDATE:', res.error);
              return res;
            }),
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

    await cleanOldYears(userId, year);
    return { success: true };
  } catch (error) {
    console.error('Erro ao salvar:', error);
    throw error;
  }
}

/**
 * Anos disponíveis
 */
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
