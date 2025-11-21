import { supabase } from './supabase';
import { toSnakeCase, toDbFormat, fromDbFormat, parseToNumber } from './dbHelpers';

// ==================== BILLS ====================

export async function loadMonthBills(userId, year, month) {
  try {
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year)
      .eq('month', month)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return (data || []).map(fromDbFormat);
  } catch (error) {
    console.error('Erro ao carregar bills:', error);
    throw error;
  }
}

export async function saveBill(userId, billData) {
  try {
    const MONEY_FIELDS = ['value'];
    const dbData = toDbFormat(billData, MONEY_FIELDS);

    if (billData.id) {
      const { error } = await supabase
        .from('bills')
        .update({ ...dbData, user_id: userId })
        .eq('id', billData.id)
        .eq('user_id', userId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('bills').insert({ ...dbData, user_id: userId });
      if (error) throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao salvar bill:', error);
    throw error;
  }
}

export async function deleteBill(userId, billId) {
  try {
    const { error } = await supabase.from('bills').delete().eq('id', billId).eq('user_id', userId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar bill:', error);
    throw error;
  }
}

export async function getAvailableMonths(userId, year) {
  try {
    const { data, error } = await supabase
      .from('bills')
      .select('month')
      .eq('user_id', userId)
      .eq('year', year)
      .order('month', { ascending: true });

    if (error) throw error;
    return [...new Set(data?.map((d) => d.month) || [])];
  } catch (error) {
    console.error('Erro ao buscar meses:', error);
    return [];
  }
}

// ==================== BALANCE ====================

export async function getBalance(userId, year, month) {
  try {
    const { data, error } = await supabase
      .from('bank_balance')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year)
      .eq('month', month)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? fromDbFormat(data) : { balance: 0 };
  } catch (error) {
    console.error('Erro ao buscar saldo:', error);
    throw error;
  }
}

export async function updateBalance(userId, year, month, newBalance) {
  try {
    const { error } = await supabase
      .from('bank_balance')
      .upsert(
        { user_id: userId, year, month, balance: newBalance },
        { onConflict: 'user_id,year,month' },
      );

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar saldo:', error);
    throw error;
  }
}

// ==================== GERAR BILLS DE DECISIONS ====================

export async function generateBillsFromDecisions(userId, year) {
  try {
    const { data: decisions, error: fetchError } = await supabase
      .from('decisions')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year);

    if (fetchError) throw fetchError;

    const billsToInsert = [];
    decisions.forEach((decision) => {
      const bills = generateBillsFromDecision(fromDbFormat(decision));
      billsToInsert.push(...bills);
    });

    if (billsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('bills')
        .insert(billsToInsert.map((b) => toSnakeCase({ ...b, user_id: userId })));
      if (insertError) throw insertError;
    }

    return { success: true, count: billsToInsert.length };
  } catch (error) {
    console.error('Erro ao gerar bills:', error);
    throw error;
  }
}

function generateBillsFromDecision(decision) {
  const bills = [];
  const choice = decision.paymentChoice;

  if (!choice || !decision.destination) return bills;

  const isCash = choice === 'cash';

  // IPTU
  if (decision.type === 'IPTU') {
    if (isCash) {
      const dueDate = new Date(decision.cashDueDate);
      bills.push({
        decisionId: decision.id,
        year: decision.year,
        month: dueDate.getMonth() + 1,
        category: 'expense',
        type: 'expense',
        description: `${decision.description} - IPTU`,
        value: parseToNumber(decision.cashValue),
        dueDate: decision.cashDueDate,
        destination: decision.destination,
      });

      bills.push({
        decisionId: decision.id,
        year: decision.year,
        month: dueDate.getMonth() + 1,
        category: 'expense',
        type: 'expense',
        description: `${decision.description} - Taxa Lixo`,
        value: parseToNumber(decision.garbageTaxCash),
        dueDate: decision.cashDueDate,
        destination: decision.destination,
      });
    } else {
      const firstDate = new Date(decision.firstInstallmentDate);
      for (let i = 0; i < decision.installments; i++) {
        const dueDate = new Date(firstDate);
        dueDate.setMonth(firstDate.getMonth() + i);

        bills.push({
          decisionId: decision.id,
          year: dueDate.getFullYear(),
          month: dueDate.getMonth() + 1,
          category: 'expense',
          type: 'expense',
          description: `${decision.description} - Parcela ${i + 1}/${decision.installments}`,
          value: parseToNumber(decision.installmentValue),
          dueDate: dueDate.toISOString().split('T')[0],
          destination: decision.destination,
          installmentNumber: i + 1,
          totalInstallments: decision.installments,
        });
      }

      bills.push({
        decisionId: decision.id,
        year: decision.year,
        month: firstDate.getMonth() + 1,
        category: 'expense',
        type: 'expense',
        description: `${decision.description} - Taxa Lixo`,
        value: parseToNumber(decision.garbageTaxInstallment),
        dueDate: decision.firstInstallmentDate,
        destination: decision.destination,
      });
    }
  }

  // IPVA
  if (decision.type === 'IPVA') {
    if (isCash) {
      const dueDate = new Date(decision.cashDueDate);
      bills.push({
        decisionId: decision.id,
        year: decision.year,
        month: dueDate.getMonth() + 1,
        category: 'expense',
        type: 'expense',
        description: `${decision.description} - IPVA`,
        value: parseToNumber(decision.cashValue),
        dueDate: decision.cashDueDate,
        destination: decision.destination,
      });
    } else {
      const firstDate = new Date(decision.firstInstallmentDate);
      for (let i = 0; i < decision.installments; i++) {
        const dueDate = new Date(firstDate);
        dueDate.setMonth(firstDate.getMonth() + i);

        bills.push({
          decisionId: decision.id,
          year: dueDate.getFullYear(),
          month: dueDate.getMonth() + 1,
          category: 'expense',
          type: 'expense',
          description: `${decision.description} - Parcela ${i + 1}/${decision.installments}`,
          value: parseToNumber(decision.installmentValue),
          dueDate: dueDate.toISOString().split('T')[0],
          destination: decision.destination,
          installmentNumber: i + 1,
          totalInstallments: decision.installments,
        });
      }
    }

    // DPVAT
    if (decision.dpvatValue && parseToNumber(decision.dpvatValue) > 0) {
      const dpvatDate = new Date(decision.dpvatDueDate);
      bills.push({
        decisionId: decision.id,
        year: decision.year,
        month: dpvatDate.getMonth() + 1,
        category: 'expense',
        type: 'expense',
        description: `${decision.description} - DPVAT`,
        value: parseToNumber(decision.dpvatValue),
        dueDate: decision.dpvatDueDate,
        destination: decision.destination,
      });
    }

    // Licenciamento
    if (decision.licensingValue && parseToNumber(decision.licensingValue) > 0) {
      const licensingDate = new Date(decision.licensingDueDate);
      bills.push({
        decisionId: decision.id,
        year: decision.year,
        month: licensingDate.getMonth() + 1,
        category: 'expense',
        type: 'expense',
        description: `${decision.description} - Licenciamento`,
        value: parseToNumber(decision.licensingValue),
        dueDate: decision.licensingDueDate,
        destination: decision.destination,
      });
    }
  }

  // SEGURO
  if (decision.type === 'SEGURO') {
    if (isCash) {
      const dueDate = new Date(decision.cashDueDate);
      bills.push({
        decisionId: decision.id,
        year: decision.year,
        month: dueDate.getMonth() + 1,
        category: 'expense',
        type: 'expense',
        description: decision.description,
        value: parseToNumber(decision.cashValue),
        dueDate: decision.cashDueDate,
        destination: decision.destination,
      });
    } else {
      const firstDate = new Date(decision.firstInstallmentDate);
      for (let i = 0; i < decision.installments; i++) {
        const dueDate = new Date(firstDate);
        dueDate.setMonth(firstDate.getMonth() + i);

        bills.push({
          decisionId: decision.id,
          year: dueDate.getFullYear(),
          month: dueDate.getMonth() + 1,
          category: 'expense',
          type: 'expense',
          description: `${decision.description} - Parcela ${i + 1}/${decision.installments}`,
          value: parseToNumber(decision.installmentValue),
          dueDate: dueDate.toISOString().split('T')[0],
          destination: decision.destination,
          installmentNumber: i + 1,
          totalInstallments: decision.installments,
        });
      }
    }
  }

  // OUTROS
  if (decision.type === 'OUTROS') {
    const firstDate = new Date(decision.firstInstallmentDate || decision.dueDate);
    const value = parseToNumber(decision.installmentValue || decision.value || decision.cashValue);

    for (let i = 0; i < decision.installments; i++) {
      const dueDate = new Date(firstDate);
      dueDate.setMonth(firstDate.getMonth() + i);

      bills.push({
        decisionId: decision.id,
        year: dueDate.getFullYear(),
        month: dueDate.getMonth() + 1,
        category: 'expense',
        type: 'expense',
        description:
          decision.installments > 1
            ? `${decision.description} - Parcela ${i + 1}/${decision.installments}`
            : decision.description,
        value: value,
        dueDate: dueDate.toISOString().split('T')[0],
        destination: decision.destination,
        installmentNumber: decision.installments > 1 ? i + 1 : null,
        totalInstallments: decision.installments > 1 ? decision.installments : null,
      });
    }
  }

  return bills;
}
