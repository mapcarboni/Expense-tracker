import { supabase } from './supabase';
import { toDbFormat, fromDbFormat } from './dbHelpers';

const YEARS_TO_RETAIN = 3;

// ==================== OPERAÇÕES PRINCIPAIS ====================

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

    const MONEY_FIELDS = [
      'cashValue',
      'installmentValue',
      'garbageTaxCash',
      'garbageTaxInstallment',
      'dpvatValue',
      'licensingValue',
    ];

    expenses.forEach((expense) => {
      const dbData = toDbFormat(expense, MONEY_FIELDS);
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

    await cleanOldYears(userId, year);

    return { success: true };
  } catch (error) {
    console.error('Erro ao salvar:', error);
    throw error;
  }
}

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
