import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { allowOnlyNumbers, formatMoney, parseToNumber } from '@/utils/formatters';

const INITIAL_FORM = {
  description: '',
  cashValue: '',
  cashDueDate: '',
  installments: '2',
  installmentValue: '',
  firstInstallmentDate: '',
};

const INPUT_CLASS =
  'w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-1.5 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
const LABEL_CLASS = 'block text-sm font-medium text-gray-300 mb-1';

export default function SeguroModal({ isOpen, onClose, onSave, year, editData = null }) {
  const [form, setForm] = useState(INITIAL_FORM);

  useEffect(() => {
    if (editData) {
      setForm({
        description: editData.description,
        cashValue: formatMoney(editData.cashValue),
        cashDueDate: editData.cashDueDate,
        installments: editData.installments,
        installmentValue: formatMoney(editData.installmentValue),
        firstInstallmentDate: editData.firstInstallmentDate,
      });
    }
  }, [editData]);

  if (!isOpen) return null;

  const updateField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const handleCurrencyInput = (name, value, shouldFormat = false) => {
    const cleanValue = shouldFormat ? formatMoney(value) : allowOnlyNumbers(value);
    updateField(name, cleanValue);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: editData?.id || Date.now(),
      type: 'Seguro',
      year,
      description: form.description,
      cashValue: parseToNumber(form.cashValue),
      cashDueDate: form.cashDueDate,
      installments: form.installments,
      installmentValue: parseToNumber(form.installmentValue),
      firstInstallmentDate: form.firstInstallmentDate,
      paymentChoice: editData?.paymentChoice || null,
    });

    setForm(INITIAL_FORM);
    onClose();
  };

  const isFormValid = [
    form.description.trim(),
    form.cashValue.startsWith('R$'),
    form.cashDueDate,
    form.installments,
    form.installmentValue.startsWith('R$'),
    form.firstInstallmentDate,
  ].every(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border border-gray-700 bg-gray-800 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-700 bg-gray-800 px-6 py-3">
          <h2 className="text-xl font-semibold text-white">
            {editData ? 'Editar' : 'Novo'} Seguro {year}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Description */}
          <div>
            <label htmlFor="description" className={LABEL_CLASS}>
              Descrição *
            </label>
            <input
              id="description"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Ex: Seguro Residencial"
              className={INPUT_CLASS}
              autoFocus
              required
            />
          </div>

          {/* Cash Payment */}
          <div className="border-t border-gray-700 pt-3">
            <h3 className="text-base font-medium text-white mb-3">Pagamento À Vista</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="cashValue" className={LABEL_CLASS}>
                  Valor Total *
                </label>
                <input
                  id="cashValue"
                  value={form.cashValue}
                  onChange={(e) => handleCurrencyInput('cashValue', e.target.value)}
                  onBlur={(e) => handleCurrencyInput('cashValue', e.target.value, true)}
                  placeholder="Ex: 1500,00"
                  className={INPUT_CLASS}
                  required
                />
              </div>
              <div>
                <label htmlFor="cashDueDate" className={LABEL_CLASS}>
                  Data de Vencimento *
                </label>
                <input
                  id="cashDueDate"
                  type="date"
                  value={form.cashDueDate}
                  onChange={(e) => updateField('cashDueDate', e.target.value)}
                  className={INPUT_CLASS}
                  required
                />
              </div>
            </div>
          </div>

          {/* Installment Payment */}
          <div className="border-t border-gray-700 pt-3">
            <h3 className="text-base font-medium text-white mb-3">Pagamento Parcelado</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="installments" className={LABEL_CLASS}>
                  Nº de Parcelas *
                </label>
                <input
                  id="installments"
                  type="number"
                  value={form.installments}
                  onChange={(e) => updateField('installments', e.target.value)}
                  min="1"
                  placeholder="Ex: 12"
                  className={INPUT_CLASS}
                  required
                />
              </div>
              <div>
                <label htmlFor="installmentValue" className={LABEL_CLASS}>
                  Valor da Parcela *
                </label>
                <input
                  id="installmentValue"
                  value={form.installmentValue}
                  onChange={(e) => handleCurrencyInput('installmentValue', e.target.value)}
                  onBlur={(e) => handleCurrencyInput('installmentValue', e.target.value, true)}
                  placeholder="Ex: 150,00"
                  className={INPUT_CLASS}
                  required
                />
              </div>
            </div>
            <div className="mt-3">
              <label htmlFor="firstInstallmentDate" className={LABEL_CLASS}>
                Data da 1ª Parcela *
              </label>
              <input
                id="firstInstallmentDate"
                type="date"
                value={form.firstInstallmentDate}
                onChange={(e) => updateField('firstInstallmentDate', e.target.value)}
                className={INPUT_CLASS}
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-gray-700 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-gray-600 transition-colors">
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isFormValid}
              className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Save className="h-4 w-4" />
              {editData ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
