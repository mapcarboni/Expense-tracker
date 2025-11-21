'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Header } from '@/components/Header';
import { MonthSelector } from '@/components/MonthSelector';
import { useAuth } from '@/contexts/AuthContext';
import { loadMonthBills, getAvailableMonths } from '@/lib/billsDb';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

export default function BillsPage() {
  const { userId } = useAuth();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [bills, setBills] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId && selectedYear) {
      loadAvailableMonths();
    }
  }, [userId, selectedYear]);

  useEffect(() => {
    if (userId && selectedYear && selectedMonth) {
      loadBills();
    }
  }, [userId, selectedYear, selectedMonth]);

  const loadAvailableMonths = async () => {
    try {
      const months = await getAvailableMonths(userId, selectedYear);

      // Adiciona mês atual e anteriores
      const allMonths = new Set(months);
      for (let m = 1; m <= currentMonth; m++) {
        if (selectedYear === currentYear) {
          allMonths.add(m);
        } else if (selectedYear < currentYear) {
          allMonths.add(m);
          if (m === 12) break;
        }
      }

      setAvailableMonths([...allMonths].sort((a, b) => a - b));
    } catch (error) {
      console.error('Erro ao carregar meses:', error);
      setAvailableMonths([currentMonth]);
    }
  };

  const loadBills = async () => {
    setIsLoading(true);
    try {
      const data = await loadMonthBills(userId, selectedYear, selectedMonth);
      setBills(data);
    } catch (error) {
      console.error('Erro ao carregar bills:', error);
      toast.error('Erro ao carregar contas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Salvar bills aqui
      toast.success('Contas salvas!');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar contas');
    } finally {
      setIsSaving(false);
    }
  };

  const handleYearChange = (newYear) => {
    if (hasUnsavedChanges) return;
    setSelectedYear(newYear);
  };

  const handleMonthChange = (newMonth) => {
    if (hasUnsavedChanges) return;
    setSelectedMonth(newMonth);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950">
        <Header
          hasUnsavedChanges={hasUnsavedChanges}
          onSave={handleSave}
          saveLoading={isSaving}
          selectedYear={selectedYear}
          onYearChange={handleYearChange}
        />

        <main className="container mx-auto px-4">
          <MonthSelector
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onMonthChange={handleMonthChange}
            availableMonths={availableMonths}
            disabled={hasUnsavedChanges}
          />

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="py-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Contas de {selectedMonth}/{selectedYear}
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Componentes serão adicionados aqui */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-2">Saldo Bancário</h3>
                  <p className="text-gray-400 text-sm">Em desenvolvimento...</p>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-2">PIX/Transfer</h3>
                  <p className="text-gray-400 text-sm">Em desenvolvimento...</p>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-2">Contas Fixas</h3>
                  <p className="text-gray-400 text-sm">Em desenvolvimento...</p>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-2">Cartão Marc</h3>
                  <p className="text-gray-400 text-sm">Em desenvolvimento...</p>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-2">Cartão Neca</h3>
                  <p className="text-gray-400 text-sm">Em desenvolvimento...</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
