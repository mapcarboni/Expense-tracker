'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, ChevronDown, Check, Edit2, Trash2, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import IPTUModal from '@/components/modals/IptuModal';
import IPVAModal from '@/components/modals/IPVAModal';
import SeguroModal from '@/components/modals/SeguroModal';
import OutrosModal from '@/components/modals/OutrosModal';
import DecisionModal from '@/components/modals/DecisionModal';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';
import { UnsavedChangesModal } from '@/components/UnsavedChangesModal';
import { loadYearPlan, saveYearPlan, getAvailableYears } from '@/lib/decisionsDb';
import { parseToNumber, formatMoney } from '@/lib/dbHelpers';

export default function DecisionPage() {
  const { userId } = useAuth();
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [expenses, setExpenses] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [availableYears, setAvailableYears] = useState([currentYear]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingYear, setIsChangingYear] = useState(false);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isIPTUModalOpen, setIsIPTUModalOpen] = useState(false);
  const [isIPVAModalOpen, setIsIPVAModalOpen] = useState(false);
  const [isSeguroModalOpen, setIsSeguroModalOpen] = useState(false);
  const [isOutrosModalOpen, setIsOutrosModalOpen] = useState(false);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);

  const [editingExpense, setEditingExpense] = useState(null);
  const [decidingExpense, setDecidingExpense] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [unsavedModalOpen, setUnsavedModalOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const loadAvailableYears = async () => {
    if (!userId) return;

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
    if (userId && selectedYear) {
      loadPlan();
    }
  }, [userId, selectedYear]);

  const loadPlan = async () => {
    if (!userId) return;

    if (isLoading) {
      setIsLoading(true);
    } else {
      setIsChangingYear(true);
    }

    try {
      const data = await loadYearPlan(userId, selectedYear);
      setExpenses(data);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Erro ao carregar planejamento:', error);
      toast.error('Erro ao carregar planejamento');
      setExpenses([]);
    } finally {
      setIsLoading(false);
      setIsChangingYear(false);
    }
  };

  const handleYearChange = (newYear) => {
    if (hasUnsavedChanges) return;
    setSelectedYear(newYear);
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

    toast.success('Despesa salva!', {
      toastId: 'expense-saved',
    });
  };

  const handleConfirmDecision = (expenseWithDecision) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === expenseWithDecision.id ? expenseWithDecision : e)),
    );
    setHasUnsavedChanges(true);
    setIsDecisionModalOpen(false);
    setDecidingExpense(null);
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

  const handleDeleteExpense = (expense) => {
    setExpenseToDelete(expense);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (expenseToDelete) {
      setExpenses((prev) => prev.filter((e) => e.id !== expenseToDelete.id));
      setHasUnsavedChanges(true);
      toast.success('Despesa excluída');
    }
    setDeleteModalOpen(false);
    setExpenseToDelete(null);
  };

  const handleSavePlanning = async () => {
    setIsSaving(true);

    try {
      await saveYearPlan(userId, selectedYear, expenses);
      setHasUnsavedChanges(false);
      toast.success(`Planejamento ${selectedYear} salvo !!!`);
      await loadAvailableYears();
      await loadPlan();
    } catch (error) {
      console.error('Erro ao salvar planejamento:', error);
      toast.error('Erro ao salvar planejamento');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndNavigate = async () => {
    await handleSavePlanning();
    if (pendingNavigation) {
      router.push(pendingNavigation);
      setPendingNavigation(null);
    }
    setUnsavedModalOpen(false);
  };

  const handleDiscardAndNavigate = () => {
    setHasUnsavedChanges(false);
    if (pendingNavigation) {
      router.push(pendingNavigation);
      setPendingNavigation(null);
    }
    setUnsavedModalOpen(false);
  };

  const closeAllExpenseModals = () => {
    setIsIPTUModalOpen(false);
    setIsIPVAModalOpen(false);
    setIsSeguroModalOpen(false);
    setIsOutrosModalOpen(false);
    setEditingExpense(null);
  };

  // ✅ HELPER: Pega valor (suporta snake_case e camelCase)
  const getValue = (obj, key) =>
    parseToNumber(obj[key] || obj[key.replace(/([A-Z])/g, '_$1').toLowerCase()] || 0);
  const getDate = (obj, key) => obj[key] || obj[key.replace(/([A-Z])/g, '_$1').toLowerCase()] || '';

  // ✅ FUNÇÃO SIMPLIFICADA
  const getExpenseDetails = (expense) => {
    const choice = expense.paymentChoice || expense.payment_choice;
    if (!choice) return { value: 0, date: '', displayText: '' };

    const isCash = choice === 'cash';
    const installments = expense.installments || 1;

    let value = 0;
    let displayText = '';
    let date = '';

    switch (expense.type) {
      case 'IPTU': {
        if (isCash) {
          const iptu = getValue(expense, 'cashValue');
          const lixo = getValue(expense, 'garbageTaxCash');
          value = iptu + lixo;
          displayText = `À vista (${formatMoney(iptu)} + ${formatMoney(lixo)})`;
          date = getDate(expense, 'cashDueDate');
        } else {
          const parcela = getValue(expense, 'installmentValue');
          const lixo = getValue(expense, 'garbageTaxInstallment');
          value = parcela * installments + lixo;
          displayText = `${installments}x de ${formatMoney(parcela)} (+${formatMoney(lixo)})`;
          date = getDate(expense, 'firstInstallmentDate');
        }
        break;
      }

      case 'IPVA':
      case 'SEGURO': {
        if (isCash) {
          value = getValue(expense, 'cashValue');
          displayText = `À vista (${formatMoney(value)})`;
          date = getDate(expense, 'cashDueDate');
        } else {
          const parcela = getValue(expense, 'installmentValue');
          value = parcela * installments;
          displayText = `${installments}x de ${formatMoney(parcela)} (${formatMoney(value)})`;
          date = getDate(expense, 'firstInstallmentDate');
        }
        break;
      }

      case 'OUTROS': {
        const parcela =
          getValue(expense, 'installmentValue') ||
          getValue(expense, 'value') ||
          getValue(expense, 'cashValue');
        value = parcela * installments;
        displayText = `${installments}x de ${formatMoney(parcela)}`;
        date = getDate(expense, 'firstInstallmentDate') || getDate(expense, 'dueDate');
        break;
      }
    }

    return { value, date, displayText };
  };

  // ✅ TAXAS EXTRAS IPVA (simplificado)
  const getIPVAExtraTaxes = (expense) => {
    const taxes = [];
    const dpvat = getValue(expense, 'dpvatValue');
    const licensing = getValue(expense, 'licensingValue');

    if (dpvat >= 0) {
      taxes.push({
        label: 'DPVAT',
        value: dpvat,
        date: getDate(expense, 'dpvatDueDate'),
      });
    }

    if (licensing >= 0) {
      taxes.push({
        label: 'Licenciamento',
        value: licensing,
        date: getDate(expense, 'licensingDueDate'),
      });
    }

    return taxes;
  };

  const renderExpenseCard = (expense) => {
    const { value, date, displayText } = getExpenseDetails(expense);

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

    const choice = expense.paymentChoice || expense.payment_choice;
    const dest = expense.destination;

    // Card sem decisão
    if (!choice || !dest) {
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
            <div className="flex gap-0.75">
              <button
                onClick={() => handleEdit(expense)}
                className="rounded p-1 text-gray-400 hover:bg-gray-600 hover:text-white transition-colors"
                title="Editar">
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeleteExpense(expense)}
                className="rounded p-1 text-gray-400 hover:bg-red-600 hover:text-white transition-colors"
                title="Excluir">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Card com decisão
    const extraTaxes = expense.type === 'IPVA' ? getIPVAExtraTaxes(expense) : [];

    return (
      <div
        key={expense.id}
        className="rounded-lg border border-gray-600 bg-gray-800 p-4 hover:border-gray-500 transition-all">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{categoryIcons[expense.type]}</span>
              <span className="rounded bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                {expense.type}
              </span>
              <p className="font-semibold text-white">{expense.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-400">Valor Total:</span>
                <span className="ml-2 font-semibold text-green-400">
                  {formatMoney(String(value))}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Pagamento:</span>
                <span className="ml-2 font-medium text-white">{displayText}</span>
              </div>
              {date && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-gray-400">
                    {new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
              <div>
                <span className="text-gray-400">Destino:</span>
                <span className="ml-2 text-purple-400 font-medium">{destinationLabels[dest]}</span>
              </div>
            </div>

            {extraTaxes.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <div className="space-y-1">
                  {extraTaxes.map((tax, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">{tax.label}:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-blue-400">
                          {formatMoney(tax.value)}
                        </span>
                        {tax.date && (
                          <span className="text-gray-500">
                            • {new Date(tax.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-0.5">
            <button
              onClick={() => handleChangeDecision(expense)}
              className="rounded p-1.25 text-gray-400 hover:bg-blue-600 hover:text-white transition-colors"
              title="Alterar Decisão">
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleEdit(expense)}
              className="rounded p-1.25 text-gray-400 hover:bg-gray-600 hover:text-white transition-colors"
              title="Editar">
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDeleteExpense(expense)}
              className="rounded p-1.25 text-gray-400 hover:bg-red-600 hover:text-white transition-colors"
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
      <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900">
        <Header
          hasUnsavedChanges={hasUnsavedChanges}
          onSave={handleSavePlanning}
          saveLoading={isSaving}
          selectedYear={selectedYear}
          onYearChange={handleYearChange}
        />

        <main className="container mx-auto px-4 py-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Planejamento Financeiro {selectedYear}
              </h1>
              <p className="text-sm text-gray-400">
                Gerencie suas despesas anuais (IPTU, IPVA, Seguros e Outros)
              </p>
            </div>

            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={hasUnsavedChanges}
                className="flex items-center gap-1.5 rounded-lg bg-green-600 p-1.25 text-sm sm:px-4 sm:py-2.5 sm:text-base font-semibold text-white transition hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                <Plus className="h-5 w-5" />
                Nova Despesa
                <ChevronDown className="h-4 w-4" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 z-10 mt-2 w-56 rounded-lg border border-gray-700 bg-gray-800 shadow-lg">
                  <button
                    onClick={() => openModal('IPTU')}
                    className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors rounded-t-lg">
                    🏠 IPTU
                  </button>
                  <button
                    onClick={() => openModal('IPVA')}
                    className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors">
                    🚗 IPVA
                  </button>
                  <button
                    onClick={() => openModal('SEGURO')}
                    className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors">
                    🛡️ Seguro
                  </button>
                  <button
                    onClick={() => openModal('OUTROS')}
                    className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors rounded-b-lg">
                    📋 Outros
                  </button>
                </div>
              )}
            </div>
          </div>

          {hasUnsavedChanges && (
            <div className="mb-6 rounded-lg border border-yellow-600 bg-yellow-900/20 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="font-semibold text-yellow-200">Você tem alterações não salvas</p>
                    <p className="text-sm text-yellow-300">
                      Clique em &quot;Salvar Planejamento&quot; para não perder suas mudanças
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isChangingYear && (
            <div className="rounded-lg border border-blue-600/50 bg-blue-900/20 p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                <div>
                  <p className="text-lg font-semibold text-blue-300">
                    Carregando {selectedYear}...
                  </p>
                  <p className="text-sm text-gray-400 mt-1">Buscando despesas cadastradas</p>
                </div>
              </div>
            </div>
          )}

          {isLoading && !isChangingYear && (
            <div className="rounded-lg border border-gray-600 bg-gray-800/50 p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                <p className="text-gray-400">Carregando despesas...</p>
              </div>
            </div>
          )}

          {!isLoading && !isChangingYear && (
            <div className="space-y-4">
              {expenses.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-600 bg-gray-800/50 p-12 text-center">
                  <p className="text-gray-400">Nenhuma despesa cadastrada para {selectedYear}</p>
                  <p className="mt-2 text-sm text-gray-500">
                    Clique em &quot;Nova Despesa&quot; para começar
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {expenses.map(renderExpenseCard)}
                </div>
              )}
            </div>
          )}
        </main>

        <ConfirmDeleteModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setExpenseToDelete(null);
          }}
          onConfirm={confirmDelete}
          expenseName={expenseToDelete?.description}
        />

        <UnsavedChangesModal
          isOpen={unsavedModalOpen}
          onClose={() => setUnsavedModalOpen(false)}
          onDiscard={handleDiscardAndNavigate}
          onSave={handleSaveAndNavigate}
        />

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
