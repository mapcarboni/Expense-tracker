import { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Check, CreditCard, Calendar } from 'lucide-react';
import { toNumber, formatMoney } from '@/utils/formatters';
import { DESTINATIONS } from '@/constants/app';

export default function DecisionModal({ isOpen, onClose, expense, onConfirm }) {
  const [paymentChoice, setPaymentChoice] = useState('');
  const [destination, setDestination] = useState('');

  useEffect(() => {
    if (isOpen && expense) {
      setPaymentChoice(expense.paymentChoice || '');
      setDestination(expense.destination || '');
    }
  }, [isOpen, expense]);

  const calculations = useMemo(() => {
    if (!expense) return null;

    const getCashTotal = () => {
      switch (expense.type) {
        case 'IPTU':
          return toNumber(expense.cashValue) + toNumber(expense.garbageTaxCash);
        case 'OUTROS':
          return expense.installments === 1 ? toNumber(expense.value) : 0;
        default:
          return toNumber(expense.cashValue);
      }
    };

    const getInstallmentTotal = () => {
      switch (expense.type) {
        case 'IPTU':
          return (
            (toNumber(expense.installmentValue) + toNumber(expense.garbageTaxInstallment)) *
            toNumber(expense.installments)
          );
        case 'OUTROS':
          return toNumber(expense.value) * toNumber(expense.installments);
        default:
          return toNumber(expense.installmentValue) * toNumber(expense.installments);
      }
    };

    const cashTotal = getCashTotal();
    const installmentTotal = getInstallmentTotal();
    const diff = Math.abs(cashTotal - installmentTotal);
    const percent = installmentTotal > 0 ? ((diff / installmentTotal) * 100).toFixed(1) : 0;

    return {
      cashTotal,
      installmentTotal,
      diff,
      percent,
      isInstallmentMoreExpensive: installmentTotal > cashTotal,
    };
  }, [expense]);

  const hasCashOption = useMemo(() => {
    if (!expense) return false;
    return expense.type === 'OUTROS' ? expense.installments === 1 : true;
  }, [expense]);

  const hasMultipleOptions = hasCashOption;

  const handleConfirm = useCallback(() => {
    if (!destination || (hasMultipleOptions && !paymentChoice)) return;

    onConfirm({
      ...expense,
      paymentChoice: hasMultipleOptions ? paymentChoice : 'cash',
      destination,
    });

    setPaymentChoice('');
    setDestination('');
    onClose();
  }, [destination, hasMultipleOptions, paymentChoice, expense, onConfirm, onClose]);

  const differenceInfo = useMemo(() => {
    if (!calculations || !paymentChoice) {
      return {
        text: calculations?.isInstallmentMoreExpensive
          ? 'À vista é mais barato'
          : 'Parcelado é mais barato',
        color: 'text-blue-400',
      };
    }

    const isBetterChoice =
      (calculations.isInstallmentMoreExpensive && paymentChoice === 'cash') ||
      (!calculations.isInstallmentMoreExpensive && paymentChoice === 'installment');

    return {
      text: isBetterChoice ? 'Economia' : 'Custo adicional',
      color: isBetterChoice ? 'text-green-400' : 'text-red-400',
    };
  }, [calculations, paymentChoice]);

  if (!isOpen || !expense) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-gray-700 bg-gray-800 shadow-2xl">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-700 bg-gray-800 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Comparar e Decidir</h2>
            <p className="text-sm text-gray-400 mt-1">
              <span className="font-medium text-blue-400">{expense.type}</span> -{' '}
              {expense.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            aria-label="Fechar modal">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {hasMultipleOptions ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label
                  className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    paymentChoice === 'cash'
                      ? 'border-blue-500 bg-blue-900/30'
                      : 'border-gray-600 hover:border-blue-400'
                  }`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      value="cash"
                      checked={paymentChoice === 'cash'}
                      onChange={(e) => setPaymentChoice(e.target.value)}
                      className="mt-1"
                      autoFocus
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-white">À Vista</span>
                        {paymentChoice === 'cash' && <Check className="h-4 w-4 text-green-400" />}
                      </div>
                      <div className="text-2xl font-bold text-blue-400 mb-1">
                        {formatMoney(calculations.cashTotal)}
                      </div>
                      <p className="text-xs text-gray-400">
                        Venc:{' '}
                        {new Date(expense.cashDueDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </label>

                <label
                  className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    paymentChoice === 'installment'
                      ? 'border-blue-500 bg-blue-900/30'
                      : 'border-gray-600 hover:border-blue-400'
                  }`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      value="installment"
                      checked={paymentChoice === 'installment'}
                      onChange={(e) => setPaymentChoice(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-white">Parcelado</span>
                        {paymentChoice === 'installment' && (
                          <Check className="h-4 w-4 text-green-400" />
                        )}
                      </div>
                      <div className="text-lg font-semibold text-white mb-1">
                        {expense.installments}x de{' '}
                        {formatMoney(calculations.installmentTotal / expense.installments)}
                      </div>
                      <div className="text-sm text-gray-400">
                        Total: {formatMoney(calculations.installmentTotal)}
                      </div>
                    </div>
                  </div>
                </label>
              </div>

              <div
                className={`p-4 rounded-lg border-2 ${
                  !paymentChoice
                    ? 'bg-gray-900/20 border-gray-600'
                    : calculations.isInstallmentMoreExpensive
                    ? paymentChoice === 'cash'
                      ? 'bg-green-900/20 border-green-600'
                      : 'bg-red-900/20 border-red-600'
                    : paymentChoice === 'installment'
                    ? 'bg-green-900/20 border-green-600'
                    : 'bg-red-900/20 border-red-600'
                }`}>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-300 mb-1">
                    {differenceInfo.text}
                  </div>
                  <div className={`text-3xl font-bold ${differenceInfo.color}`}>
                    {formatMoney(calculations.diff)}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    {calculations.percent}% de diferença
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-4 rounded-lg border-2 border-blue-500 bg-blue-900/20">
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-2">Pagamento Único</p>
                <div className="text-3xl font-bold text-blue-400">
                  {formatMoney(toNumber(expense.value))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Venc: {new Date(expense.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          )}

          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-base font-semibold text-white mb-3">
              Onde será lançada a despesa?
            </h3>
            <div className="space-y-2">
              {DESTINATIONS.map((dest) => {
                const IconComponent = dest.icon === 'Calendar' ? Calendar : CreditCard;
                return (
                  <label
                    key={dest.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      destination === dest.value
                        ? 'border-green-500 bg-green-900/20'
                        : 'border-gray-600 hover:border-green-400'
                    }`}>
                    <input
                      type="radio"
                      value={dest.value}
                      checked={destination === dest.value}
                      onChange={(e) => setDestination(e.target.value)}
                    />
                    <IconComponent className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <span className="text-white font-medium">{dest.label}</span>
                      {dest.description && (
                        <span className="text-xs text-gray-400 ml-2">{dest.description}</span>
                      )}
                    </div>
                    {destination === dest.value && <Check className="h-5 w-5 text-green-400" />}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-700 pt-4">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-600 bg-gray-700 px-5 py-2.5 text-sm font-semibold text-gray-300 hover:bg-gray-600 transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!destination || (hasMultipleOptions && !paymentChoice)}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Check className="h-4 w-4" />
              Confirmar Decisão
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
