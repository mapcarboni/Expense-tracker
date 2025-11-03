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
  dpvatValue: '',
  dpvatDueDate: '',
  licensingValue: '',
  licensingDueDate: '',
};

const INPUT_CLASS =
  'w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-1.5 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all';
const INPUT_ERROR_CLASS =
  'w-full rounded-md border-2 border-red-500 bg-gray-700 px-3 py-1.5 text-white placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all';
const LABEL_CLASS = 'block text-sm font-medium text-gray-300 mb-1';

export default function IPVAModal({ isOpen, onClose, onSave, year, editData = null }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editData) {
      setForm({
        description: editData.description,
        cashValue: formatMoney(editData.cash_value),
        cashDueDate: editData.cash_due_date,
        installments: editData.installments?.toString() || '2',
        installmentValue: formatMoney(editData.installment_value),
        firstInstallmentDate: editData.first_installment_date,
        dpvatValue: formatMoney(editData.dpvat_value),
        dpvatDueDate: editData.dpvat_due_date,
        licensingValue: formatMoney(editData.licensing_value),
        licensingDueDate: editData.licensing_due_date,
      });
    } else {
      setForm(INITIAL_FORM);
      setTouched({});
    }
  }, [editData, isOpen]);

  if (!isOpen) return null;

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleCurrencyInput = (name, value, shouldFormat = false) => {
    const cleanValue = shouldFormat ? formatMoney(value) : allowOnlyNumbers(value);
    updateField(name, cleanValue);
  };

  const validateField = (name, value) => {
    if (!touched[name]) return true;

    switch (name) {
      case 'description':
        return value.trim().length > 0;
      case 'cashValue':
      case 'installmentValue':
      case 'dpvatValue':
      case 'licensingValue':
        return value.startsWith('R$');
      case 'cashDueDate':
      case 'firstInstallmentDate':
      case 'dpvatDueDate':
      case 'licensingDueDate':
        return value.length > 0;
      case 'installments':
        return parseInt(value) >= 1;
      default:
        return true;
    }
  };

  const isFormValid = [
    form.description.trim(),
    form.cashValue.startsWith('R$'),
    form.cashDueDate,
    form.installments,
    form.installmentValue.startsWith('R$'),
    form.firstInstallmentDate,
    form.dpvatValue.startsWith('R$'),
    form.dpvatDueDate,
    form.licensingValue.startsWith('R$'),
    form.licensingDueDate,
  ].every(Boolean);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!isFormValid || saving) return;

    setSaving(true);

    await onSave({
      id: editData?.id,
      type: 'IPVA',
      year,
      description: form.description,
      cash_value: parseToNumber(form.cashValue),
      cash_due_date: form.cashDueDate,
      installments: parseInt(form.installments),
      installment_value: parseToNumber(form.installmentValue),
      first_installment_date: form.firstInstallmentDate,
      dpvat_value: parseToNumber(form.dpvatValue),
      dpvat_due_date: form.dpvatDueDate,
      licensing_value: parseToNumber(form.licensingValue),
      licensing_due_date: form.licensingDueDate,
      payment_choice: editData?.payment_choice || null,
      destination: editData?.destination || null,
    });

    setSaving(false);
    setForm(INITIAL_FORM);
    setTouched({});
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      if (isFormValid) handleSubmit();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-xl border border-gray-700 bg-gray-800 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-700 bg-gray-800 px-6 py-3">
          <h2 className="text-xl font-semibold text-white">
            {editData ? 'Editar' : 'Nova'} Despesa IPVA {year}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="p-6 space-y-4">
          {/* Description */}
          <div>
            <label htmlFor="description" className={LABEL_CLASS}>
              Descrição *
            </label>
            <input
              id="description"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, description: true }))}
              placeholder="Ex: Veículo"
              className={
                validateField('description', form.description) ? INPUT_CLASS : INPUT_ERROR_CLASS
              }
              autoFocus
              required
            />
            {!validateField('description', form.description) && (
              <p className="text-xs text-red-400 mt-1">Campo obrigatório</p>
            )}
          </div>

          {/* Cash Payment */}
          <div className="border-t border-gray-700 pt-3">
            <h3 className="text-base font-medium text-white mb-3">Pagamento À Vista</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="cashValue" className={LABEL_CLASS}>
                  Valor IPVA *
                </label>
                <input
                  id="cashValue"
                  value={form.cashValue}
                  onChange={(e) => handleCurrencyInput('cashValue', e.target.value)}
                  onBlur={(e) => {
                    handleCurrencyInput('cashValue', e.target.value, true);
                    setTouched((prev) => ({ ...prev, cashValue: true }));
                  }}
                  placeholder="Ex: 1234,56"
                  className={
                    validateField('cashValue', form.cashValue) ? INPUT_CLASS : INPUT_ERROR_CLASS
                  }
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
                  onBlur={() => setTouched((prev) => ({ ...prev, cashDueDate: true }))}
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
                  onBlur={() => setTouched((prev) => ({ ...prev, installments: true }))}
                  min="1"
                  placeholder="Ex: 3"
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
                  onBlur={(e) => {
                    handleCurrencyInput('installmentValue', e.target.value, true);
                    setTouched((prev) => ({ ...prev, installmentValue: true }));
                  }}
                  placeholder="Ex: 450,00"
                  className={
                    validateField('installmentValue', form.installmentValue)
                      ? INPUT_CLASS
                      : INPUT_ERROR_CLASS
                  }
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
                onBlur={() => setTouched((prev) => ({ ...prev, firstInstallmentDate: true }))}
                className={INPUT_CLASS}
                required
              />
            </div>
          </div>

          {/* DPVAT Section */}
          <div className="border-t border-gray-700 pt-3">
            <h3 className="text-base font-medium text-white mb-3">DPVAT</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="dpvatValue" className={LABEL_CLASS}>
                  Valor DPVAT *
                </label>
                <input
                  id="dpvatValue"
                  value={form.dpvatValue}
                  onChange={(e) => handleCurrencyInput('dpvatValue', e.target.value)}
                  onBlur={(e) => {
                    handleCurrencyInput('dpvatValue', e.target.value, true);
                    setTouched((prev) => ({ ...prev, dpvatValue: true }));
                  }}
                  placeholder="Ex: 50,00"
                  className={
                    validateField('dpvatValue', form.dpvatValue) ? INPUT_CLASS : INPUT_ERROR_CLASS
                  }
                  required
                />
              </div>
              <div>
                <label htmlFor="dpvatDueDate" className={LABEL_CLASS}>
                  Data de Vencimento *
                </label>
                <input
                  id="dpvatDueDate"
                  type="date"
                  value={form.dpvatDueDate}
                  onChange={(e) => updateField('dpvatDueDate', e.target.value)}
                  onBlur={() => setTouched((prev) => ({ ...prev, dpvatDueDate: true }))}
                  className={INPUT_CLASS}
                  required
                />
              </div>
            </div>
          </div>

          {/* Licensing Section */}
          <div className="border-t border-gray-700 pt-3">
            <h3 className="text-base font-medium text-white mb-3">Licenciamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="licensingValue" className={LABEL_CLASS}>
                  Valor Licenciamento *
                </label>
                <input
                  id="licensingValue"
                  value={form.licensingValue}
                  onChange={(e) => handleCurrencyInput('licensingValue', e.target.value)}
                  onBlur={(e) => {
                    handleCurrencyInput('licensingValue', e.target.value, true);
                    setTouched((prev) => ({ ...prev, licensingValue: true }));
                  }}
                  placeholder="Ex: 120,00"
                  className={
                    validateField('licensingValue', form.licensingValue)
                      ? INPUT_CLASS
                      : INPUT_ERROR_CLASS
                  }
                  required
                />
              </div>
              <div>
                <label htmlFor="licensingDueDate" className={LABEL_CLASS}>
                  Data de Vencimento *
                </label>
                <input
                  id="licensingDueDate"
                  type="date"
                  value={form.licensingDueDate}
                  onChange={(e) => updateField('licensingDueDate', e.target.value)}
                  onBlur={() => setTouched((prev) => ({ ...prev, licensingDueDate: true }))}
                  className={INPUT_CLASS}
                  required
                />
              </div>
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
              type="submit"
              disabled={!isFormValid || saving}
              className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Save className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
              {saving ? 'Salvando...' : editData ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
