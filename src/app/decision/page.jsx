'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, ChevronDown, Check, Edit2, Trash2, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';
import IPTUModal from '@/components/modals/IptuModal';
import IPVAModal from '@/components/modals/IPVAModal';
import SeguroModal from '@/components/modals/SeguroModal';
import OutrosModal from '@/components/modals/OutrosModal';
import DecisionModal from '@/components/modals/DecisionModal';
import { loadYearPlan, saveYearPlan, getAvailableYears } from '@/lib/decisionsDb';
import { parseToNumber, formatMoney } from '@/utils/formatters';

export default function DecisionPage() {
  const { userId } = useAuth();
  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [expenses, setExpenses] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [availableYears, setAvailableYears] = useState([currentYear]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isIPTUModalOpen, setIsIPTUModalOpen] = useState(false);
  const [isIPVAModalOpen, setIsIPVAModalOpen] = useState(false);
  const [isSeguroModalOpen, setIsSeguroModalOpen] = useState(false);
  const [isOutrosModalOpen, setIsOutrosModalOpen] = useState(false);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);

  const [editingExpense, setEditingExpense] = useState(null);
  const [decidingExpense, setDecidingExpense] = useState(null);

  const loadAvailableYears = async () => {
    try {
      const savedYears = await getAvailableYears(userId);
      const yearsSet = new Set([currentYear, ...savedYears]);
      const sortedYears = Array.from(yearsSet).sort((a, b) => b - a);
      setAvailableYears(sortedYears);
    } catch (error) {
      console.error('Erro ao carregar anos disponíveis:', error);
      setAvailableYears([currentYear]);
    }
  };

  useEffect(() => {
    if (userId) {
      loadAvailableYears();
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadPlan();
    }
  }, [userId, selectedYear]);

  const loadPlan = async () => {
    try {
      const data = await loadYearPlan(userId, selectedYear);
      setExpenses(data);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Erro ao carregar planejamento:', error);
      toast.error('Erro ao carregar planejamento');
    }
  };

  const openModal = (type) => {
    setIsDropdownOpen(false);
    setEditingExpense(null);

    if (type === 'IPTU') setIsIPTUModalOpen(true);
    if (type === 'IPVA') setIsIPVAModalOpen(true);
    if (type === 'SEGURO') setIsSeguroModalOpen(true);
    if (type === 'OUTROS') setIsOutrosModalOpen(true);
  };

  const handleSaveExpense = (expenseData) => {
    if (expenses.find((e) => e.id === expenseData.id)) {
      setExpenses((prev) =>
        prev.map((e) => (e.id === expenseData.id ? { ...expenseData, createdAt: e.createdAt } : e)),
      );
    } else {
      const newExpense = {
        ...expenseData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      setExpenses((prev) => [...prev, newExpense]);
    }

    setHasUnsavedChanges(true);
    closeAllExpenseModals();

    // ✅ NÃO abre modal de decisão automaticamente
    toast.success('Despesa salva!', {
      toastId: 'expense-saved',
    });
  };

  const handleConfirmDecision = (expenseWithDecision) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === expenseWithDecision.id ? expenseWithDecision : e)),
    );
    setHasUnsavedChanges(true);
    toast.success('Decisão confirmada!');
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);

    if (expense.type === 'IPTU') setIsIPTUModalOpen(true);
    if (expense.type === 'IPVA') setIsIPVAModalOpen(true);
    if (expense.type === 'SEGURO') setIsSeguroModalOpen(true);
    if (expense.type === 'OUTROS') setIsOutrosModalOpen(true);
  };

  const handleChangeDecision = (expense) => {
    setDecidingExpense(expense);
    setIsDecisionModalOpen(true);
  };

  const handleDeleteExpense = (expenseId) => {
    if (confirm('Tem certeza que deseja excluir esta despesa?')) {
      setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
      setHasUnsavedChanges(true);
      toast.success('Despesa excluída');
    }
  };

  const handleSavePlanning = async () => {
    setIsSaving(true);

    try {
      await saveYearPlan(userId, selectedYear, expenses);
      setHasUnsavedChanges(false);
      toast.success(`Planejamento ${selectedYear} salvo com sucesso!`);
      await loadAvailableYears();
    } catch (error) {
      console.error('Erro ao salvar planejamento:', error);
      toast.error('Erro ao salvar planejamento');
    } finally {
      setIsSaving(false);
    }
  };

  const closeAllExpenseModals = () => {
    setIsIPTUModalOpen(false);
    setIsIPVAModalOpen(false);
    setIsSeguroModalOpen(false);
    setIsOutrosModalOpen(false);
    setEditingExpense(null);
  };

  const getExpenseDetails = (expense) => {
    if (!expense.paymentChoice) return { value: 0, date: '' };

    const isCash = expense.paymentChoice === 'cash';
    let value = 0;

    switch (expense.type) {
      case 'IPTU':
        if (isCash) {
          value = parseToNumber(expense.cashValue) + parseToNumber(expense.garbageTaxCash);
        } else {
          const perMonth =
            parseToNumber(expense.installmentValue) + parseToNumber(expense.garbageTaxInstallment);
          value = perMonth * parseToNumber(expense.installments);
        }
        break;
      case 'OUTROS':
        value = parseToNumber(expense.value) * (isCash ? 1 : parseToNumber(expense.installments));
        break;
      default:
        value = isCash
          ? parseToNumber(expense.cashValue)
          : parseToNumber(expense.installmentValue) * parseToNumber(expense.installments);
    }

    const date = isCash
      ? expense.type === 'OUTROS'
        ? expense.dueDate
        : expense.cashDueDate
      : expense.type === 'OUTROS'
      ? expense.dueDate
      : expense.firstInstallmentDate;

    return { value, date };
  };

  const renderExpenseCard = (expense) => {
    const { value, date } = getExpenseDetails(expense);

    const destinationLabels = {
      fixed_first: 'Contas Fixas - 1ª Quinzena',
      fixed_second: 'Contas Fixas - 2ª Quinzena',
      credit_card_1: 'Cartão de Crédito Marc',
      credit_card_2: 'Cartão de Crédito Neca',
    };

    const categoryIcons = {
      IPTU: '🏠',
      IPVA: '🚗',
      SEGURO: '🛡️',
      OUTROS: '📋',
    };

    if (!expense.paymentChoice || !expense.destination) {
      return (
        <div
          key={expense.id}
          className="rounded-lg border border-gray-600 bg-gray-700 p-4 hover:bg-gray-650 transition-all">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{categoryIcons[expense.type]}</span>
                <span className="rounded bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                  {expense.type}
                </span>
                <p className="font-semibold text-white">{expense.description}</p>
              </div>
              <div className="flex items-center justify-between gap-3 p-3 rounded-md bg-yellow-900/20 border border-yellow-600">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400">⚠️</span>
                  <p className="text-sm text-yellow-200">Aguardando decisão</p>
                </div>
                <button
                  onClick={() => handleChangeDecision(expense)}
                  className="flex items-center gap-1.5 rounded-md bg-yellow-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-yellow-700 transition-colors">
                  <Check className="h-3.5 w-3.5" />
                  Decidir Agora
                </button>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => handleEdit(expense)}
                className="rounded p-1.5 text-gray-400 hover:bg-gray-600 hover:text-white transition-colors"
                title="Editar">
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeleteExpense(expense.id)}
                className="rounded p-1.5 text-gray-400 hover:bg-red-600 hover:text-white transition-colors"
                title="Excluir">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    const isInstallment = expense.paymentChoice === 'installment';
    const installmentInfo = isInstallment
      ? ` (${expense.installments}x de ${formatMoney(value / parseToNumber(expense.installments))})`
      : '';

    return (
      <div
        key={expense.id}
        className="rounded-lg border border-gray-600 bg-gray-700 p-4 hover:bg-gray-650 transition-all">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{categoryIcons[expense.type]}</span>
              <span className="rounded bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                {expense.type}
              </span>
              <p className="font-semibold text-white">{expense.description}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-md bg-green-900/30 border border-green-600">
                <Check className="h-4 w-4 text-green-400 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {isInstallment ? '📅' : '💰'} {isInstallment ? 'Parcelado' : 'À Vista'}
                    </span>
                    <span className="text-lg font-bold text-green-400">{formatMoney(value)}</span>
                  </div>
                  {installmentInfo && (
                    <p className="text-xs text-gray-300 mt-1">{installmentInfo}</p>
                  )}
                </div>
                <button
                  onClick={() => handleChangeDecision(expense)}
                  className="rounded p-1.5 text-green-400 hover:bg-green-900/50 hover:text-green-300 transition-colors"
                  title="Alterar decisão">
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <span>Data:</span>
                  <span className="font-medium text-white">
                    {new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <span className="text-blue-400">📍</span>
                  <span>Destino:</span>
                  <span className="font-medium text-white text-xs">
                    {destinationLabels[expense.destination]}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => handleEdit(expense)}
              className="rounded p-1.5 text-gray-400 hover:bg-gray-600 hover:text-white transition-colors"
              title="Editar">
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDeleteExpense(expense.id)}
              className="rounded p-1.5 text-gray-400 hover:bg-red-600 hover:text-white transition-colors"
              title="Excluir">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950">
        <Header
          hasUnsavedChanges={hasUnsavedChanges}
          onSave={handleSavePlanning}
          saveLoading={isSaving}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
        />

        <main className="p-4 md:p-6">
          <div className="mx-auto max-w-7xl">
            {hasUnsavedChanges && (
              <div className="mb-4 rounded-lg bg-yellow-900/20 border border-yellow-600 p-3">
                <p className="text-sm text-yellow-200">
                  ⚠️ Você tem alterações não salvas. Clique em &quot;Salvar&quot; no header.
                </p>
              </div>
            )}

            <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 md:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Despesas {selectedYear}</h2>

                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
                    <Plus className="h-4 w-4" />
                    Nova Despesa
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        isDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsDropdownOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-full rounded-md border border-gray-600 bg-gray-800 shadow-lg z-20 py-1">
                        <button
                          onClick={() => openModal('IPTU')}
                          className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors">
                          IPTU
                        </button>
                        <button
                          onClick={() => openModal('IPVA')}
                          className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors">
                          IPVA
                        </button>
                        <button
                          onClick={() => openModal('SEGURO')}
                          className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors">
                          Seguro
                        </button>
                        <button
                          onClick={() => openModal('OUTROS')}
                          className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors">
                          Outros
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {expenses.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 mb-2">
                    Nenhuma despesa cadastrada para {selectedYear}
                  </p>
                  <p className="text-sm text-gray-500">
                    Clique em &quot;Nova Despesa&quot; para começar
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {expenses
                    .sort((a, b) => {
                      const categoryOrder = ['IPTU', 'IPVA', 'SEGURO', 'OUTROS'];
                      return categoryOrder.indexOf(a.type) - categoryOrder.indexOf(b.type);
                    })
                    .map((expense) => renderExpenseCard(expense))}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Renderização condicional - só renderiza quando aberto */}
        {isIPTUModalOpen && (
          <IPTUModal
            isOpen={isIPTUModalOpen}
            onClose={closeAllExpenseModals}
            onSave={handleSaveExpense}
            year={selectedYear}
            editData={editingExpense?.type === 'IPTU' ? editingExpense : null}
          />
        )}

        {isIPVAModalOpen && (
          <IPVAModal
            isOpen={isIPVAModalOpen}
            onClose={closeAllExpenseModals}
            onSave={handleSaveExpense}
            year={selectedYear}
            editData={editingExpense?.type === 'IPVA' ? editingExpense : null}
          />
        )}

        {isSeguroModalOpen && (
          <SeguroModal
            isOpen={isSeguroModalOpen}
            onClose={closeAllExpenseModals}
            onSave={handleSaveExpense}
            year={selectedYear}
            editData={editingExpense?.type === 'SEGURO' ? editingExpense : null}
          />
        )}

        {isOutrosModalOpen && (
          <OutrosModal
            isOpen={isOutrosModalOpen}
            onClose={closeAllExpenseModals}
            onSave={handleSaveExpense}
            year={selectedYear}
            editData={editingExpense?.type === 'OUTROS' ? editingExpense : null}
          />
        )}

        {isDecisionModalOpen && (
          <DecisionModal
            isOpen={isDecisionModalOpen}
            onClose={() => {
              setIsDecisionModalOpen(false);
              setDecidingExpense(null);
            }}
            expense={decidingExpense}
            onConfirm={handleConfirmDecision}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
