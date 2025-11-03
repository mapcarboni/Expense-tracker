import { supabase } from './supabase';

/**
 * Carrega planejamento de um ano específico
 */
export async function loadYearPlan(userId, year) {
  const { data, error } = await supabase
    .from('decisions')
    .select('*')
    .eq('user_id', userId)
    .eq('year', year)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Salva planejamento completo de um ano
 * Remove despesas existentes e insere as novas
 * Mantém apenas os últimos 6 anos no banco
 */
export async function saveYearPlan(userId, year, expenses) {
  // 1. Busca todos os anos do usuário
  const { data: allYears, error: yearsError } = await supabase
    .from('decisions')
    .select('year')
    .eq('user_id', userId);

  if (yearsError) throw yearsError;

  // 2. Identifica anos únicos e ordena (mais recente primeiro)
  const uniqueYears = [...new Set(allYears?.map((d) => d.year) || [])];
  const sortedYears = uniqueYears.sort((a, b) => b - a);

  // 3. Se já tem 6 anos E o ano atual não está entre eles, deleta o mais antigo
  if (sortedYears.length >= 6 && !sortedYears.includes(year)) {
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

  // 5. Se não há despesas, apenas retorna
  if (!expenses.length) return;

  // 6. Insere novas despesas
  const expensesToInsert = expenses.map((expense) => ({
    user_id: userId,
    year,
    type: expense.type,
    description: expense.description,
    payment_choice: expense.paymentChoice || null,
    destination: expense.destination || null,
    cash_value: expense.cashValue || null,
    cash_due_date: expense.cashDueDate || null,
    installments: expense.installments || null,
    installment_value: expense.installmentValue || null,
    first_installment_date: expense.firstInstallmentDate || null,
    garbage_tax_cash: expense.garbageTaxCash || null,
    garbage_tax_installment: expense.garbageTaxInstallment || null,
    dpvat_value: expense.dpvatValue || null,
    dpvat_due_date: expense.dpvatDueDate || null,
    licensing_value: expense.licensingValue || null,
    licensing_due_date: expense.licensingDueDate || null,
  }));

  const { error: insertError } = await supabase.from('decisions').insert(expensesToInsert);

  if (insertError) throw insertError;
}

/**
 * Retorna lista de anos com despesas cadastradas
 */
export async function getAvailableYears(userId) {
  const { data, error } = await supabase
    .from('decisions')
    .select('year')
    .eq('user_id', userId)
    .order('year', { ascending: false });

  if (error) throw error;

  const uniqueYears = [...new Set(data?.map((d) => d.year) || [])];
  return uniqueYears;
}
