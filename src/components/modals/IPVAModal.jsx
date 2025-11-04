import { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { formatMoney, parseToNumber } from '@/utils/formatters';
import { INPUT_CLASS, INPUT_ERROR_CLASS, LABEL_CLASS } from '@/constants/app';

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

export default function IPVAModal({ isOpen, onClose, onSave, year, editData = null }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (editData) {
      setForm({
        description: editData.description,
        cashValue: editData.cash_value ? String(editData.cash_value * 100) : '',
        cashDueDate: editData.cash_due_date || '',
        installments: String(editData.installments || 2),
        installmentValue: editData.installment_value
          ? String(editData.installment_value * 100)
          : '',
        firstInstallmentDate: editData.first_installment_date || '',
        dpvatValue: editData.dpvat_value ? String(editData.dpvat_value * 100) : '',
        dpvatDueDate: editData.dpvat_due_date || '',
        licensingValue: editData.licensing_value ? String(editData.licensing_value * 100) : '',
        licensingDueDate: editData.licensing_due_date || '',
      });
    } else {
      setForm(INITIAL_FORM);
      setTouched({});
    }
  }, [editData, isOpen]);

  const updateField = useCallback((name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  const handleCurrencyInput = useCallback(
    (name, value) => {
      const cleanValue = value.replace(/[^\d,\.]/g, '');
      updateField(name, cleanValue);
    },
    [updateField],
  );

  const handleCurrencyBlur = useCallback(
    (name) => {
      if (!form[name]) return;
      const formatted = formatMoney(form[name]);
      updateField(name, formatted);
    },
    [form, updateField],
  );

  const isCashDisabled = useMemo(() => parseToNumber(form.cashValue) === 0, [form.cashValue]);
  const isInstallmentDisabled = useMemo(
    () => parseToNumber(form.installmentValue) === 0,
    [form.installmentValue],
  );
  const isDpvatDisabled = useMemo(() => parseToNumber(form.dpvatValue) === 0, [form.dpvatValue]);
  const isLicensingDisabled = useMemo(
    () => parseToNumber(form.licensingValue) === 0,
    [form.licensingValue],
  );

  const validateField = useCallback(
    (name, value) => {
      if (!touched[name]) return true;

      switch (name) {
        case 'description':
          return value.trim().length > 0;
        case 'cashValue':
        case 'installmentValue':
        case 'dpvatValue':
        case 'licensingValue':
          return typeof value === 'string' && (value.startsWith('R$') || value.length > 0);
        case 'cashDueDate':
          return isCashDisabled || value.length > 0;
        case 'firstInstallmentDate':
          return isInstallmentDisabled || value.length > 0;
        case 'dpvatDueDate':
          return isDpvatDisabled || value.length > 0;
        case 'licensingDueDate':
          return isLicensingDisabled || value.length > 0;
        case 'installments':
          return parseInt(value) >= 1;
        default:
          return true;
      }
    },
    [touched, isCashDisabled, isInstallmentDisabled, isDpvatDisabled, isLicensingDisabled],
  );

  const isFormValid =
    form.description.trim() &&
    (form.cashValue.startsWith('R$') || form.cashValue.length > 0) &&
    (isCashDisabled || form.cashDueDate) &&
    form.installments &&
    (form.installmentValue.startsWith('R$') || form.installmentValue.length > 0) &&
    (isInstallmentDisabled || form.firstInstallmentDate) &&
    (form.dpvatValue.startsWith('R$') || form.dpvatValue.length > 0) &&
    (isDpvatDisabled || form.dpvatDueDate) &&
    (form.licensingValue.startsWith('R$') || form.licensingValue.length > 0) &&
    (isLicensingDisabled || form.licensingDueDate);

  const handleSubmit = useCallback(
    async (e) => {
      e?.preventDefault();
      if (!isFormValid || saving) return;

      setSaving(true);

      try {
        await onSave({
          id: editData?.id,
          type: 'IPVA',
          year,
          description: form.description,
          cash_value: parseToNumber(form.cashValue),
          cash_due_date: isCashDisabled ? null : form.cashDueDate,
          installments: parseInt(form.installments),
          installment_value: parseToNumber(form.installmentValue),
          first_installment_date: isInstallmentDisabled ? null : form.firstInstallmentDate,
          dpvat_value: parseToNumber(form.dpvatValue),
          dpvat_due_date: isDpvatDisabled ? null : form.dpvatDueDate,
          licensing_value: parseToNumber(form.licensingValue),
          licensing_due_date: isLicensingDisabled ? null : form.licensingDueDate,
          payment_choice: editData?.payment_choice || null,
          destination: editData?.destination || null,
        });

        setForm(INITIAL_FORM);
        setTouched({});
        onClose();
      } catch (error) {
        console.error('Erro ao salvar IPVA:', error);
      } finally {
        setSaving(false);
      }
    },
    [
      isFormValid,
      saving,
      onSave,
      editData,
      year,
      form,
      onClose,
      isCashDisabled,
      isInstallmentDisabled,
      isDpvatDisabled,
      isLicensingDisabled,
    ],
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (isFormValid) handleSubmit();
      }
    },
    [isFormValid, handleSubmit],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border border-gray-700 bg-gray-800 shadow-2xl">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-700 bg-gray-800 px-5 py-3">
          <h2 className="text-lg font-semibold text-white">
            {editData ? 'Editar' : 'Nova'} Despesa IPVA {year}
          </h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="p-5 space-y-4">
          <div>
            <label htmlFor="ipva-desc" className={LABEL_CLASS}>
              Descrição *
            </label>
            <input
              id="ipva-desc"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, description: true }))}
              placeholder="Ex: Veículo"
              className={
                validateField('description', form.description) ? INPUT_CLASS : INPUT_ERROR_CLASS
              }
              disabled={saving}
              autoFocus
              required
            />
          </div>

          <div className="border-t border-gray-700 pt-3">
            <h3 className="text-sm font-medium text-white mb-2">À Vista</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="ipva-cash" className="block text-xs text-gray-400 mb-1">
                  Valor IPVA *
                </label>
                <input
                  id="ipva-cash"
                  value={form.cashValue.startsWith('R$') ? form.cashValue : form.cashValue}
                  onChange={(e) => handleCurrencyInput('cashValue', e.target.value)}
                  onBlur={() => {
                    handleCurrencyBlur('cashValue');
                    setTouched((prev) => ({ ...prev, cashValue: true }));
                  }}
                  placeholder="1234,56"
                  className={INPUT_CLASS}
                  disabled={saving}
                />
              </div>
              <div>
                <label htmlFor="ipva-cashDate" className="block text-xs text-gray-400 mb-1">
                  Vencimento {isCashDisabled && '(desab.)'}
                </label>
                <input
                  id="ipva-cashDate"
                  type="date"
                  value={form.cashDueDate}
                  onChange={(e) => updateField('cashDueDate', e.target.value)}
                  className={INPUT_CLASS}
                  disabled={saving || isCashDisabled}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-3">
            <h3 className="text-sm font-medium text-white mb-2">Parcelado</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="ipva-inst" className="block text-xs text-gray-400 mb-1">
                  Nº Parcelas *
                </label>
                <input
                  id="ipva-inst"
                  type="number"
                  value={form.installments}
                  onChange={(e) => updateField('installments', e.target.value)}
                  min="1"
                  className={INPUT_CLASS}
                  disabled={saving}
                />
              </div>
              <div>
                <label htmlFor="ipva-instVal" className="block text-xs text-gray-400 mb-1">
                  Valor Parcela *
                </label>
                <input
                  id="ipva-instVal"
                  value={
                    form.installmentValue.startsWith('R$')
                      ? form.installmentValue
                      : form.installmentValue
                  }
                  onChange={(e) => handleCurrencyInput('installmentValue', e.target.value)}
                  onBlur={() => {
                    handleCurrencyBlur('installmentValue');
                    setTouched((prev) => ({ ...prev, installmentValue: true }));
                  }}
                  placeholder="450,00"
                  className={INPUT_CLASS}
                  disabled={saving}
                />
              </div>
              <div className="col-span-2">
                <label htmlFor="ipva-instDate" className="block text-xs text-gray-400 mb-1">
                  1ª Parcela {isInstallmentDisabled && '(desab.)'}
                </label>
                <input
                  id="ipva-instDate"
                  type="date"
                  value={form.firstInstallmentDate}
                  onChange={(e) => updateField('firstInstallmentDate', e.target.value)}
                  className={INPUT_CLASS}
                  disabled={saving || isInstallmentDisabled}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-3">
            <h3 className="text-sm font-medium text-white mb-2">DPVAT</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="ipva-dpvat" className="block text-xs text-gray-400 mb-1">
                  Valor DPVAT *
                </label>
                <input
                  id="ipva-dpvat"
                  value={form.dpvatValue.startsWith('R$') ? form.dpvatValue : form.dpvatValue}
                  onChange={(e) => handleCurrencyInput('dpvatValue', e.target.value)}
                  onBlur={() => {
                    handleCurrencyBlur('dpvatValue');
                    setTouched((prev) => ({ ...prev, dpvatValue: true }));
                  }}
                  placeholder="50,00"
                  className={INPUT_CLASS}
                  disabled={saving}
                />
              </div>
              <div>
                <label htmlFor="ipva-dpvatDate" className="block text-xs text-gray-400 mb-1">
                  Vencimento {isDpvatDisabled && '(desab.)'}
                </label>
                <input
                  id="ipva-dpvatDate"
                  type="date"
                  value={form.dpvatDueDate}
                  onChange={(e) => updateField('dpvatDueDate', e.target.value)}
                  className={INPUT_CLASS}
                  disabled={saving || isDpvatDisabled}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-3">
            <h3 className="text-sm font-medium text-white mb-2">Licenciamento</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="ipva-lic" className="block text-xs text-gray-400 mb-1">
                  Valor *
                </label>
                <input
                  id="ipva-lic"
                  value={
                    form.licensingValue.startsWith('R$') ? form.licensingValue : form.licensingValue
                  }
                  onChange={(e) => handleCurrencyInput('licensingValue', e.target.value)}
                  onBlur={() => {
                    handleCurrencyBlur('licensingValue');
                    setTouched((prev) => ({ ...prev, licensingValue: true }));
                  }}
                  placeholder="120,00"
                  className={INPUT_CLASS}
                  disabled={saving}
                />
              </div>
              <div>
                <label htmlFor="ipva-licDate" className="block text-xs text-gray-400 mb-1">
                  Vencimento {isLicensingDisabled && '(desab.)'}
                </label>
                <input
                  id="ipva-licDate"
                  type="date"
                  value={form.licensingDueDate}
                  onChange={(e) => updateField('licensingDueDate', e.target.value)}
                  className={INPUT_CLASS}
                  disabled={saving || isLicensingDisabled}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-700 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-md border border-gray-600 bg-gray-700 px-3 py-1.5 text-sm font-medium text-gray-300 hover:bg-gray-600 transition-colors disabled:opacity-50">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isFormValid || saving}
              className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {editData ? 'Atualizar' : 'Salvar'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
