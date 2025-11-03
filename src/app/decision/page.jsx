'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Header } from '@/components/Header';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';

export default function DecisionPage() {
  const { userId } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [pendingSaves, setPendingSaves] = useState([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const isSaved = pendingSaves.length === 0;

  useEffect(() => {
    if (userId) {
      fetchExpenses();
    }
  }, [userId, selectedYear]);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('decisions')
        .select('*')
        .eq('user_id', userId)
        .eq('year', selectedYear)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Erro ao buscar despesas:', error);
      toast.error('Erro ao carregar despesas');
    }
  };

  const saveExpense = async (expense) => {
    try {
      const payload = {
        ...expense,
        user_id: userId,
      };

      const { error } = expense.id
        ? await supabase.from('decisions').update(payload).eq('id', expense.id)
        : await supabase.from('decisions').insert([payload]);

      if (error) throw error;

      toast.success(expense.id ? 'Despesa atualizada!' : 'Despesa criada!');
      await fetchExpenses();
      return true;
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      toast.error('Falha ao salvar. Tente novamente.');

      setPendingSaves((prev) => {
        const exists = prev.find((p) => p.tempId === expense.tempId);
        return exists ? prev : [...prev, { ...expense, tempId: expense.tempId || Date.now() }];
      });
      return false;
    }
  };

  const handleRetryPendingSaves = async () => {
    if (pendingSaves.length === 0) return;

    setSaveLoading(true);
    const failed = [];

    for (const expense of pendingSaves) {
      const success = await saveExpense(expense);
      if (!success) {
        failed.push(expense);
      }
    }

    setPendingSaves(failed);
    setSaveLoading(false);

    if (failed.length === 0) {
      toast.success('Todas as despesas foram salvas!');
    } else {
      toast.warning(`${failed.length} despesa(s) ainda pendente(s)`);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950">
        <Header
          isSaved={isSaved}
          onSave={handleRetryPendingSaves}
          saveLoading={saveLoading}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
        />

        <main className="p-6">
          <p className="text-gray-400 text-center">
            Funcionalidades em breve - {expenses.length} despesa(s) carregada(s)
          </p>
          {pendingSaves.length > 0 && (
            <p className="text-orange-400 text-center text-sm mt-2">
              {pendingSaves.length} despesa(s) pendente(s)
            </p>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
