import { supabase } from './supabase';
import { MAX_YEARS_RETAINED } from '@/constants/app';

/**
 * Converte dados do frontend (camelCase) para banco (snake_case)
 */
function toDbFormat(expense) {
  return {
    type: expense.type,
    description: expense.description,
    payment_choice: expense.paymentChoice || null,
    destination: expense.destination || null,

    // Valores à vista
    cash_value: expense.cashValue ? parseFloat(expense.cashValue) : null,
    cash_due_date: expense.cashDueDate || null,

    // Valores parcelados
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
 * Converte dados do banco (snake_case) para frontend (camelCase)
 */
function fromDbFormat(dbExpense) {
  return {
    id: dbExpense.id,
    type: dbExpense.type,
    description: dbExpense.description,
    paymentChoice: dbExpense.payment_choice,
    destination: dbExpense.destination,

    // Valores à vista
    cashValue: dbExpense.cash_value,
    cashDueDate: dbExpense.cash_due_date,

    // Valores parcelados
    installments: dbExpense.installments,
    installmentValue: dbExpense.installment_value,
    firstInstallmentDate: dbExpense.first_installment_date,

    // IPTU específico
    garbageTaxCash: dbExpense.garbage_tax_cash,
    garbageTaxInstallment: dbExpense.garbage_tax_installment,

    // IPVA específico
    dpvatValue: dbExpense.dpvat_value,
    dpvatDueDate: dbExpense.dpvat_due_date,
    licensingValue: dbExpense.licensing_value,
    licensingDueDate: dbExpense.licensing_due_date,

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

    // Converte snake_case → camelCase
    return (data || []).map(fromDbFormat);
  } catch (error) {
    console.error('Erro ao carregar planejamento:', error);
    throw new Error('Falha ao carregar planejamento. Tente novamente.');
  }
}

/**
 * Salva planejamento completo de um ano
 * Remove despesas existentes e insere as novas
 * Mantém apenas os últimos 6 anos (incluindo atual)
 */
export async function saveYearPlan(userId, year, expenses) {
  try {
    // 1. Busca todos os anos do usuário
    const { data: allYears, error: yearsError } = await supabase
      .from('decisions')
      .select('year')
      .eq('user_id', userId);

    if (yearsError) throw yearsError;

    // 2. Anos únicos ordenados (mais recente primeiro)
    const uniqueYears = [...new Set(allYears?.map((d) => d.year) || [])];
    const sortedYears = uniqueYears.sort((a, b) => b - a);

    // 3. Deleta anos antigos se ultrapassar limite de 6
    if (sortedYears.length >= MAX_YEARS_RETAINED && !sortedYears.includes(year)) {
      const oldestYear = sortedYears[sortedYears.length - 1];

      const { error: deleteOldError } = await supabase
        .from('decisions')
        .delete()
        .eq('user_id', userId)
        .eq('year', oldestYear);

      if (deleteOldError) throw deleteOldError;
    }

    // 4. Deleta despesas existentes do ano atual
    const { error: deleteError } = await supabase
      .from('decisions')
      .delete()
      .eq('user_id', userId)
      .eq('year', year);

    if (deleteError) throw deleteError;

    // 5. Se não há despesas, retorna sucesso
    if (!expenses.length) return { success: true };

    // 6. Converte e insere novas despesas
    const expensesToInsert = expenses.map((expense) => ({
      user_id: userId,
      year,
      ...toDbFormat(expense),
    }));

    const { error: insertError } = await supabase.from('decisions').insert(expensesToInsert);

    if (insertError) throw insertError;

    return { success: true };
  } catch (error) {
    console.error('Erro ao salvar planejamento:', error);
    throw new Error('Falha ao salvar planejamento. Verifique os dados e tente novamente.');
  }
}

/**
 * Retorna lista de anos com despesas cadastradas
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
