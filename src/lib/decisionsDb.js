import { supabase } from './supabase';
import { MAX_YEARS_RETAINED } from '@/constants/app';

/**
 * Converte dados do frontend (camelCase) para banco (snake_case)
 * Frontend envia valores como números decimais (123.45)
 */
function toDbFormat(expense) {
  return {
    type: expense.type,
    description: expense.description,
    payment_choice: expense.paymentChoice || null,
    destination: expense.destination || null,

    // Valores à vista - converte para decimal
    cash_value: expense.cashValue ? parseFloat(expense.cashValue) : null,
    cash_due_date: expense.cashDueDate || null,

    // Valores parcelados - converte para decimal
    installments: expense.installments ? parseInt(expense.installments) : null,
    installment_value: expense.installmentValue ? parseFloat(expense.installmentValue) : null,
    first_installment_date: expense.firstInstallmentDate || null,

    // IPTU específico - converte para decimal
    garbage_tax_cash: expense.garbageTaxCash ? parseFloat(expense.garbageTaxCash) : null,
    garbage_tax_installment: expense.garbageTaxInstallment
      ? parseFloat(expense.garbageTaxInstallment)
      : null,

    // IPVA específico - converte para decimal
    dpvat_value: expense.dpvatValue ? parseFloat(expense.dpvatValue) : null,
    dpvat_due_date: expense.dpvatDueDate || null,
    licensing_value: expense.licensingValue ? parseFloat(expense.licensingValue) : null,
    licensing_due_date: expense.licensingDueDate || null,
  };
}

/**
 * Converte dados do banco (snake_case, decimal) para frontend (camelCase, centavos como string)
 * Banco retorna valores como decimais (123.45)
 * Frontend espera centavos como string ("12345") para formatação
 */
function fromDbFormat(dbExpense) {
  // Função auxiliar para converter decimal do banco para centavos (string)
  const toFrontendValue = (dbValue) => {
    if (dbValue === null || dbValue === undefined) return null;
    // Converte decimal para centavos: 123.45 -> "12345"
    return String(Math.round(dbValue * 100));
  };

  return {
    id: dbExpense.id,
    type: dbExpense.type,
    description: dbExpense.description,
    paymentChoice: dbExpense.payment_choice,
    destination: dbExpense.destination,

    // Valores à vista - converte decimal para centavos
    cashValue: toFrontendValue(dbExpense.cash_value),
    cashDueDate: dbExpense.cash_due_date,

    // Valores parcelados - converte decimal para centavos
    installments: dbExpense.installments,
    installmentValue: toFrontendValue(dbExpense.installment_value),
    firstInstallmentDate: dbExpense.first_installment_date,

    // IPTU específico - converte decimal para centavos
    garbageTaxCash: toFrontendValue(dbExpense.garbage_tax_cash),
    garbageTaxInstallment: toFrontendValue(dbExpense.garbage_tax_installment),

    // IPVA específico - converte decimal para centavos
    dpvatValue: toFrontendValue(dbExpense.dpvat_value),
    dpvatDueDate: dbExpense.dpvat_due_date,
    licensingValue: toFrontendValue(dbExpense.licensing_value),
    licensingDueDate: dbExpense.licensing_due_date,

    // OUTROS específico - converte decimal para centavos
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

    // Converte snake_case → camelCase e decimal → centavos
    return (data || []).map(fromDbFormat);
  } catch (error) {
    console.error('Erro ao carregar planejamento:', error);
    throw new Error('Falha ao carregar planejamento. Tente novamente.');
  }
}

/**
 * Limpa anos antigos mantendo apenas os últimos 6 anos (incluindo atual)
 */
async function cleanOldYears(userId, currentYear) {
  try {
    const minYearAllowed = currentYear - 5; // Últimos 6 anos incluindo atual

    const { error } = await supabase
      .from('decisions')
      .delete()
      .eq('user_id', userId)
      .lt('year', minYearAllowed);

    if (error) throw error;

    console.log(`✅ Anos antigos removidos (< ${minYearAllowed})`);
  } catch (error) {
    console.error('Erro ao limpar anos antigos:', error);
    // Não falha o save por causa da limpeza
  }
}

/**
 * Salva planejamento completo de um ano usando UPSERT incremental
 * Estratégia:
 * 1. INSERT novas despesas (sem ID ou com ID temporário)
 * 2. UPDATE despesas existentes (com UUID do banco)
 * 3. DELETE despesas removidas (estão no banco mas não no array)
 * 4. Limpa anos antigos
 */
export async function saveYearPlan(userId, year, expenses) {
  try {
    // 1. Busca IDs existentes no banco para este ano
    const { data: existingExpenses, error: fetchError } = await supabase
      .from('decisions')
      .select('id')
      .eq('user_id', userId)
      .eq('year', year);

    if (fetchError) throw fetchError;

    const existingIds = new Set((existingExpenses || []).map((e) => e.id));
    const currentIds = new Set(
      expenses.filter((e) => e.id && e.id.includes('-')).map((e) => e.id), // Filtra UUIDs válidos
    );

    // 2. Separa despesas em: novas, existentes e a deletar
    const toInsert = [];
    const toUpdate = [];

    expenses.forEach((expense) => {
      const isUUID = expense.id && expense.id.includes('-'); // UUID tem formato "xxx-xxx-xxx"

      if (isUUID && existingIds.has(expense.id)) {
        // Despesa existe no banco → UPDATE
        toUpdate.push({
          id: expense.id,
          user_id: userId,
          year,
          ...toDbFormat(expense),
        });
      } else {
        // Despesa nova → INSERT
        toInsert.push({
          user_id: userId,
          year,
          ...toDbFormat(expense),
        });
      }
    });

    // 3. IDs a deletar (estão no banco mas não no array atual)
    const toDelete = [...existingIds].filter((id) => !currentIds.has(id));

    // 4. Executa operações no banco
    const promises = [];

    // INSERT novas despesas
    if (toInsert.length > 0) {
      promises.push(supabase.from('decisions').insert(toInsert));
    }

    // UPDATE despesas existentes
    if (toUpdate.length > 0) {
      // Supabase não tem bulk update, então fazemos um por vez
      toUpdate.forEach((expense) => {
        promises.push(
          supabase.from('decisions').update(expense).eq('id', expense.id).eq('user_id', userId),
        );
      });
    }

    // DELETE despesas removidas
    if (toDelete.length > 0) {
      promises.push(supabase.from('decisions').delete().eq('user_id', userId).in('id', toDelete));
    }

    // Aguarda todas as operações
    const results = await Promise.all(promises);

    // Verifica se alguma operação falhou
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      console.error('Erros ao salvar:', errors);
      throw new Error('Falha ao salvar algumas despesas');
    }

    // 5. Limpa anos antigos (não falha o save se der erro)
    await cleanOldYears(userId, year);

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
