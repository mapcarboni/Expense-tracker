import { useState, useEffect, useCallback } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { formatMoney, parseToNumber } from '@/lib/dbHelpers';
import { useZeroValueDateHandler } from '@/hooks/useZeroValueDateHandler';
import { INPUT_CLASS, INPUT_ERROR_CLASS, LABEL_CLASS } from '@/constants/app';

const INITIAL_FORM = {
  description: 'Apartamento',
  cashValue: '',
  garbageTaxCash: '',
  cashDueDate: '',
  installments: '2',
  installmentValue: '',
  garbageTaxInstallment: '',
  firstInstallmentDate: '',
};

export default function IPTUModal({ isOpen, onClose, onSave, year, editData = null }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);

  const { isCashDisabled, isInstallmentDisabled, getCleanedFormData } =
    useZeroValueDateHandler(form);

  useEffect(() => {
    if (!isOpen) return;

    if (editData) {
      // ✅ CORRIGIDO: Formata valores ao carregar do banco
      setForm({
        description: editData.description,
        cashValue: editData.cashValue ? formatMoney(editData.cashValue) : '',
        garbageTaxCash: editData.garbageTaxCash ? formatMoney(editData.garbageTaxCash) : '',
        cashDueDate: editData.cashDueDate || '',
        installments: String(editData.installments || 2),
        installmentValue: editData.installmentValue ? formatMoney(editData.installmentValue) : '',
        garbageTaxInstallment: editData.garbageTaxInstallment
          ? formatMoney(editData.garbageTaxInstallment)
          : '',
        firstInstallmentDate: editData.firstInstallmentDate || '',
      });
    } else {
      setForm(INITIAL_FORM);
      setTouched({});
    }
  }, [editData, isOpen]);

  useEffect(() => {
    if (isCashDisabled && form.cashDueDate) {
      setForm((prev) => ({ ...prev, cashDueDate: '' }));
    }
  }, [isCashDisabled]);

  useEffect(() => {
    if (isInstallmentDisabled && form.firstInstallmentDate) {
      setForm((prev) => ({ ...prev, firstInstallmentDate: '' }));
    }
  }, [isInstallmentDisabled]);

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

  const validateField = useCallback(
    (name, value) => {
      if (!touched[name]) return true;

      switch (name) {
        case 'description':
          return value.trim().length > 0;
        case 'cashValue':
        case 'garbageTaxCash':
        case 'installmentValue':
        case 'garbageTaxInstallment':
          return typeof value === 'string' && (value.startsWith('R$') || value.length >= 0);
        case 'cashDueDate':
          return isCashDisabled || value.length > 0;
        case 'firstInstallmentDate':
          return isInstallmentDisabled || value.length > 0;
        case 'installments':
          return parseInt(value) >= 1;
        default:
          return true;
      }
    },
    [touched, isCashDisabled, isInstallmentDisabled],
  );

  const isFormValid =
    form.description.trim() &&
    (form.cashValue.startsWith('R$') || form.cashValue.length >= 0) &&
    (form.garbageTaxCash.startsWith('R$') || form.garbageTaxCash.length >= 0) &&
    (isCashDisabled || form.cashDueDate) &&
    form.installments &&
    (form.installmentValue.startsWith('R$') || form.installmentValue.length >= 0) &&
    (form.garbageTaxInstallment.startsWith('R$') || form.garbageTaxInstallment.length >= 0) &&
    (isInstallmentDisabled || form.firstInstallmentDate);

  const handleSubmit = useCallback(
    async (e) => {
      e?.preventDefault();
      if (!isFormValid || saving) return;

      setSaving(true);

      try {
        const cleanedData = getCleanedFormData({
          id: editData?.id,
          type: 'IPTU',
          year,
          description: form.description,
          cashValue: parseToNumber(form.cashValue),
          garbageTaxCash: parseToNumber(form.garbageTaxCash),
          cashDueDate: form.cashDueDate || null,
          installments: parseInt(form.installments),
          installmentValue: parseToNumber(form.installmentValue),
          garbageTaxInstallment: parseToNumber(form.garbageTaxInstallment),
          firstInstallmentDate: form.firstInstallmentDate || null,
          paymentChoice: editData?.paymentChoice || null,
          destination: editData?.destination || null,
        });

        await onSave(cleanedData);

        setForm(INITIAL_FORM);
        setTouched({});
        onClose();
      } catch (error) {
        console.error('Erro ao salvar IPTU:', error);
      } finally {
        setSaving(false);
      }
    },
    [isFormValid, saving, onSave, editData, year, form, onClose, getCleanedFormData],
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
            {editData ? 'Editar' : 'Nova'} Despesa IPTU {year}
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
            <label htmlFor="iptu-desc" className={LABEL_CLASS}>
              Descrição *
            </label>
            <input
              id="iptu-desc"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, description: true }))}
              className={
                validateField('description', form.description) ? INPUT_CLASS : INPUT_ERROR_CLASS
              }
              disabled={saving}
              autoFocus
              required
            />
          </div>

          <div className="border-t border-gray-700 pt-3">
            <h3 className="text-sm font-medium text-white mb-2">Pagamento À Vista</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="iptu-cash" className="block text-xs text-gray-400 mb-1">
                  Valor IPTU *
                </label>
                <input
                  id="iptu-cash"
                  value={form.cashValue}
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
                <label htmlFor="iptu-garbage" className="block text-xs text-gray-400 mb-1">
                  Taxa Lixo *
                </label>
                <input
                  id="iptu-garbage"
                  value={form.garbageTaxCash}
                  onChange={(e) => handleCurrencyInput('garbageTaxCash', e.target.value)}
                  onBlur={() => {
                    handleCurrencyBlur('garbageTaxCash');
                    setTouched((prev) => ({ ...prev, garbageTaxCash: true }));
                  }}
                  placeholder="123,45"
                  className={INPUT_CLASS}
                  disabled={saving}
                />
              </div>
              <div className="col-span-2">
                <label htmlFor="iptu-cashDate" className="block text-xs text-gray-400 mb-1">
                  Vencimento {isCashDisabled && '🔒'}
                </label>
                <input
                  id="iptu-cashDate"
                  type="date"
                  value={form.cashDueDate}
                  onChange={(e) => updateField('cashDueDate', e.target.value)}
                  className={`${INPUT_CLASS} ${
                    isCashDisabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={saving || isCashDisabled}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-3">
            <h3 className="text-sm font-medium text-white mb-2">Pagamento Parcelado</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="iptu-inst" className="block text-xs text-gray-400 mb-1">
                  Nº Parcelas *
                </label>
                <input
                  id="iptu-inst"
                  type="number"
                  value={form.installments}
                  onChange={(e) => updateField('installments', e.target.value)}
                  min="1"
                  className={INPUT_CLASS}
                  disabled={saving}
                />
              </div>
              <div>
                <label htmlFor="iptu-instVal" className="block text-xs text-gray-400 mb-1">
                  Valor Parcela *
                </label>
                <input
                  id="iptu-instVal"
                  value={form.installmentValue}
                  onChange={(e) => handleCurrencyInput('installmentValue', e.target.value)}
                  onBlur={() => {
                    handleCurrencyBlur('installmentValue');
                    setTouched((prev) => ({ ...prev, installmentValue: true }));
                  }}
                  placeholder="123,45"
                  className={INPUT_CLASS}
                  disabled={saving}
                />
              </div>
              <div>
                <label htmlFor="iptu-garbInst" className="block text-xs text-gray-400 mb-1">
                  Taxa Lixo/Parc *
                </label>
                <input
                  id="iptu-garbInst"
                  value={form.garbageTaxInstallment}
                  onChange={(e) => handleCurrencyInput('garbageTaxInstallment', e.target.value)}
                  onBlur={() => {
                    handleCurrencyBlur('garbageTaxInstallment');
                    setTouched((prev) => ({ ...prev, garbageTaxInstallment: true }));
                  }}
                  placeholder="12,34"
                  className={INPUT_CLASS}
                  disabled={saving}
                />
              </div>
              <div>
                <label htmlFor="iptu-instDate" className="block text-xs text-gray-400 mb-1">
                  Vencimento 1ª {isInstallmentDisabled && '🔒'}
                </label>
                <input
                  id="iptu-instDate"
                  type="date"
                  value={form.firstInstallmentDate}
                  onChange={(e) => updateField('firstInstallmentDate', e.target.value)}
                  className={`${INPUT_CLASS} ${
                    isInstallmentDisabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={saving || isInstallmentDisabled}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-gray-600 transition-colors disabled:opacity-50">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isFormValid || saving}
              className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
