import { supabase } from './supabase';
import { MAX_YEARS_RETAINED } from '@/constants/app';

/**
 * Converte dados do frontend (camelCase) para banco (snake_case)
 * ⚠️ IMPORTANTE: Sempre envia TODOS os campos para satisfazer constraints
 */
function toDbFormat(expense) {
  // Para OUTROS, precisa lidar com os campos especiais
  const isOutros = expense.type === 'OUTROS';

  return {
    type: expense.type,
    description: expense.description,
    payment_choice: expense.paymentChoice || null,
    destination: expense.destination || null,

    // À vista
    cash_value: expense.cashValue ? parseFloat(expense.cashValue) : null,
    cash_due_date: expense.cashDueDate || null,

    // Parcelado
    installments: expense.installments ? parseInt(expense.installments) : null,
    installment_value: expense.installmentValue ? parseFloat(expense.installmentValue) : null,
    first_installment_date: expense.firstInstallmentDate || null,

    // IPTU específico
    garbage_tax_cash: expense.garbageTaxCash ? parseFloat(expense.garbageTaxCash) : null,
    garbage_tax_installment: expense.garbageTaxInstallment
      ? parseFloat(expense.garbageTaxInstallment)
      : null,

    // IPVA específico
    dpvat_value: expense.dpvatValue ? parseFloat(expense.dpvatValue) : null,
    dpvat_due_date: expense.dpvatDueDate || null,
    licensing_value: expense.licensingValue ? parseFloat(expense.licensingValue) : null,
    licensing_due_date: expense.licensingDueDate || null,
  };
}

/**
 * Converte dados do banco para frontend
 */
function fromDbFormat(dbExpense) {
  const toFrontendValue = (dbValue) => {
    if (dbValue === null || dbValue === undefined) return null;
    return String(Math.round(dbValue * 100));
  };

  return {
    id: dbExpense.id,
    type: dbExpense.type,
    description: dbExpense.description,
    paymentChoice: dbExpense.payment_choice,
    destination: dbExpense.destination,

    cashValue: toFrontendValue(dbExpense.cash_value),
    cashDueDate: dbExpense.cash_due_date,

    installments: dbExpense.installments,
    installmentValue: toFrontendValue(dbExpense.installment_value),
    firstInstallmentDate: dbExpense.first_installment_date,

    garbageTaxCash: toFrontendValue(dbExpense.garbage_tax_cash),
    garbageTaxInstallment: toFrontendValue(dbExpense.garbage_tax_installment),

    dpvatValue: toFrontendValue(dbExpense.dpvat_value),
    dpvatDueDate: dbExpense.dpvat_due_date,
    licensingValue: toFrontendValue(dbExpense.licensing_value),
    licensingDueDate: dbExpense.licensing_due_date,

    value: toFrontendValue(dbExpense.cash_value || dbExpense.installment_value),
    dueDate: dbExpense.cash_due_date || dbExpense.first_installment_date,

    createdAt: dbExpense.created_at,
    updatedAt: dbExpense.updated_at,
  };
}

/**
 * Carrega planejamento de um ano específico
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
    console.error('Erro ao carregar planejamento:', error);
    throw new Error('Falha ao carregar planejamento. Tente novamente.');
  }
}

/**
 * Limpa anos antigos
 */
async function cleanOldYears(userId, currentYear) {
  try {
    const minYearAllowed = currentYear - 5;

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

/**
 * Salva planejamento usando UPSERT incremental
 */
export async function saveYearPlan(userId, year, expenses) {
  try {
    // 1. Busca despesas existentes
    const { data: existingExpenses, error: fetchError } = await supabase
      .from('decisions')
      .select('id')
      .eq('user_id', userId)
      .eq('year', year);

    if (fetchError) throw fetchError;

    const existingIds = new Set((existingExpenses || []).map((e) => e.id));
    const currentIds = new Set(expenses.filter((e) => e.id && e.id.includes('-')).map((e) => e.id));

    // 2. Separa em INSERT, UPDATE, DELETE
    const toInsert = [];
    const toUpdate = [];

    expenses.forEach((expense) => {
      const isUUID = expense.id && expense.id.includes('-');

      if (isUUID && existingIds.has(expense.id)) {
        // UPDATE: Envia TODOS os campos para satisfazer constraints
        toUpdate.push({
          id: expense.id,
          user_id: userId,
          year,
          ...toDbFormat(expense),
        });
      } else {
        // INSERT
        toInsert.push({
          user_id: userId,
          year,
          ...toDbFormat(expense),
        });
      }
    });

    const toDelete = [...existingIds].filter((id) => !currentIds.has(id));

    // 3. Executa operações
    const promises = [];

    // INSERT
    if (toInsert.length > 0) {
      promises.push(supabase.from('decisions').insert(toInsert));
    }

    // UPDATE - Um por vez para melhor controle de erros
    if (toUpdate.length > 0) {
      toUpdate.forEach((expense) => {
        // ⚠️ Remove campos read-only antes do UPDATE
        const { id, user_id, created_at, updated_at, ...updateData } = expense;

        promises.push(
          supabase.from('decisions').update(updateData).eq('id', id).eq('user_id', user_id),
        );
      });
    }

    // DELETE
    if (toDelete.length > 0) {
      promises.push(supabase.from('decisions').delete().eq('user_id', userId).in('id', toDelete));
    }

    // Aguarda todas as operações
    const results = await Promise.all(promises);

    // Verifica erros
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      console.error('Erros ao salvar:', errors);
      throw new Error('Falha ao salvar algumas despesas');
    }

    // 4. Limpa anos antigos
    await cleanOldYears(userId, year);

    return { success: true };
  } catch (error) {
    console.error('Erro ao salvar planejamento:', error);
    throw new Error('Falha ao salvar planejamento. Verifique os dados e tente novamente.');
  }
}

/**
 * Retorna lista de anos com despesas
 */
export async function getAvailableYears(userId) {
  try {
    const { data, error } = await supabase
      .from('decisions')
      .select('year')
      .eq('user_id', userId)
      .order('year', { ascending: false });

    if (error) throw error;

    const uniqueYears = [...new Set(data?.map((d) => d.year) || [])];
    return uniqueYears;
  } catch (error) {
    console.error('Erro ao buscar anos:', error);
    return [];
  }
}

/**
 * Deleta uma despesa específica
 */
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
    console.error('Erro ao deletar despesa:', error);
    throw new Error('Falha ao deletar despesa. Tente novamente.');
  }
}
