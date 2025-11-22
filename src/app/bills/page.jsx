'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Header } from '@/components/Header';
import { MonthSelector } from '@/components/MonthSelector';
import { SaldoBancario } from '@/components/bills/SaldoBancario';
import { useAuth } from '@/contexts/AuthContext';
import { loadMonthBills, getAvailableMonths, getBalance, getAvailableYears } from '@/lib/billsDb';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

export default function BillsPage() {
  const { userId } = useAuth();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [availableYears, setAvailableYears] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [bills, setBills] = useState([]);
  const [balance, setBalance] = useState({ balanceB: 0, balanceI: 0 });
  const [incomeData, setIncomeData] = useState({
    salario: '',
    adiantamento: '',
    ferias: '',
    decimoTerceiro: '',
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadAvailableYears();
    }
  }, [userId]);

  useEffect(() => {
    if (userId && selectedYear) {
      loadAvailableMonthsList();
    }
  }, [userId, selectedYear]);

  useEffect(() => {
    if (userId && selectedYear && selectedMonth) {
      loadData();
    }
  }, [userId, selectedYear, selectedMonth]);

  const loadAvailableYears = async () => {
    try {
      const years = await getAvailableYears(userId);
      setAvailableYears(years);
    } catch (error) {
      console.error('Erro ao carregar anos:', error);
      setAvailableYears([currentYear]);
    }
  };

  const loadAvailableMonthsList = async () => {
    try {
      const months = await getAvailableMonths(userId, selectedYear);
      const allMonths = new Set(months);

      for (let m = 1; m <= 12; m++) {
        if (selectedYear < currentYear || (selectedYear === currentYear && m <= currentMonth)) {
          allMonths.add(m);
        }
      }

      setAvailableMonths([...allMonths].sort((a, b) => a - b));
    } catch (error) {
      console.error('Erro ao carregar meses:', error);
      setAvailableMonths([currentMonth]);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [billsData, balanceData] = await Promise.all([
        loadMonthBills(userId, selectedYear, selectedMonth),
        getBalance(userId, selectedYear, selectedMonth),
      ]);

      setBills(billsData);
      setBalance(balanceData);

      const salaryBill = billsData.find((b) => b.category === 'salary');
      const advanceBill = billsData.find((b) => b.category === 'advance');
      const vacationBill = billsData.find((b) => b.category === 'vacation');
      const thirteenthBill = billsData.find((b) => b.category === 'thirteenth');

      setIncomeData({
        salario: salaryBill?.value || '',
        adiantamento: advanceBill?.value || '',
        ferias: vacationBill?.value || '',
        decimoTerceiro: thirteenthBill?.value || '',
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar contas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleIncomeChange = (changes) => {
    setIncomeData((prev) => ({ ...prev, ...changes }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
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
      <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900">
        <Header
          hasUnsavedChanges={hasUnsavedChanges}
          onSave={handleSave}
          saveLoading={isSaving}
          selectedYear={selectedYear}
          onYearChange={handleYearChange}
          availableYears={availableYears}
        />

        <main className="container mx-auto px-4 py-8">
          <MonthSelector
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
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <SaldoBancario
                balanceB={balance.balanceB}
                balanceI={balance.balanceI}
                salario={incomeData.salario}
                adiantamento={incomeData.adiantamento}
                ferias={incomeData.ferias}
                decimoTerceiro={incomeData.decimoTerceiro}
                month={selectedMonth}
                onChange={handleIncomeChange}
                disabled={hasUnsavedChanges}
              />

              <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
                <h3 className="text-white font-semibold mb-2">PIX/Transfer</h3>
                <p className="text-gray-400 text-sm">Em desenvolvimento...</p>
              </div>

              <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
                <h3 className="text-white font-semibold mb-2">Contas Fixas</h3>
                <p className="text-gray-400 text-sm">Em desenvolvimento...</p>
              </div>

              <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
                <h3 className="text-white font-semibold mb-2">Cartão Marc</h3>
                <p className="text-gray-400 text-sm">Em desenvolvimento...</p>
              </div>

              <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
                <h3 className="text-white font-semibold mb-2">Cartão Neca</h3>
                <p className="text-gray-400 text-sm">Em desenvolvimento...</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
