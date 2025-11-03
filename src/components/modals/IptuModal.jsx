import { useState, useEffect, useCallback } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { formatMoney, parseToNumber } from '@/utils/formatters';
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

  // ✅ Reseta formulário quando abre/fecha ou muda editData
  useEffect(() => {
    if (!isOpen) return;

    if (editData) {
      setForm({
        description: editData.description,
        cashValue: editData.cashValue ? String(editData.cashValue * 100) : '',
        garbageTaxCash: editData.garbageTaxCash ? String(editData.garbageTaxCash * 100) : '',
        cashDueDate: editData.cashDueDate,
        installments: String(editData.installments || 2),
        installmentValue: editData.installmentValue ? String(editData.installmentValue * 100) : '',
        garbageTaxInstallment: editData.garbageTaxInstallment
          ? String(editData.garbageTaxInstallment * 100)
          : '',
        firstInstallmentDate: editData.firstInstallmentDate,
      });
    } else {
      setForm(INITIAL_FORM);
      setTouched({});
    }
  }, [editData, isOpen]);

  // ✅ Atualiza campo
  const updateField = useCallback((name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  // ✅ Input monetário - permite digitar centavos
  const handleCurrencyInput = useCallback(
    (name, value) => {
      const cleanValue = value.replace(/\D/g, '');
      updateField(name, cleanValue);
    },
    [updateField],
  );

  // ✅ Formata no blur
  const handleCurrencyBlur = useCallback(
    (name) => {
      if (!form[name]) return;
      const formatted = formatMoney(form[name]);
      updateField(name, formatted);
    },
    [form, updateField],
  );

  // ✅ Validação
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
          return typeof value === 'string' && (value.startsWith('R$') || value.length > 0);
        case 'cashDueDate':
        case 'firstInstallmentDate':
          return value.length > 0;
        case 'installments':
          return parseInt(value) >= 1;
        default:
          return true;
      }
    },
    [touched],
  );

  // ✅ Validação completa
  const isFormValid =
    form.description.trim() &&
    (form.cashValue.startsWith('R$') || form.cashValue.length > 0) &&
    (form.garbageTaxCash.startsWith('R$') || form.garbageTaxCash.length > 0) &&
    form.cashDueDate &&
    form.installments &&
    (form.installmentValue.startsWith('R$') || form.installmentValue.length > 0) &&
    (form.garbageTaxInstallment.startsWith('R$') || form.garbageTaxInstallment.length > 0) &&
    form.firstInstallmentDate;

  // ✅ Submit
  const handleSubmit = useCallback(
    async (e) => {
      e?.preventDefault();
      if (!isFormValid || saving) return;

      setSaving(true);

      try {
        await onSave({
          id: editData?.id,
          type: 'IPTU',
          year,
          description: form.description,
          cashValue: parseToNumber(form.cashValue),
          garbageTaxCash: parseToNumber(form.garbageTaxCash),
          cashDueDate: form.cashDueDate,
          installments: parseInt(form.installments),
          installmentValue: parseToNumber(form.installmentValue),
          garbageTaxInstallment: parseToNumber(form.garbageTaxInstallment),
          firstInstallmentDate: form.firstInstallmentDate,
          paymentChoice: editData?.paymentChoice || null,
          destination: editData?.destination || null,
        });

        setForm(INITIAL_FORM);
        setTouched({});
        onClose();
      } catch (error) {
        console.error('Erro ao salvar IPTU:', error);
      } finally {
        setSaving(false);
      }
    },
    [isFormValid, saving, onSave, editData, year, form, onClose],
  );

  // ✅ Enter para submit
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

      <div className="relative z-10 w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-xl border border-gray-700 bg-gray-800 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-700 bg-gray-800 px-6 py-3">
          <h2 className="text-xl font-semibold text-white">
            {editData ? 'Editar' : 'Nova'} Despesa IPTU {year}
          </h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Fechar modal">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="p-6 space-y-4">
          {/* Description */}
          <div>
            <label htmlFor="iptu-description" className={LABEL_CLASS}>
              Descrição *
            </label>
            <input
              id="iptu-description"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, description: true }))}
              placeholder="Ex: Apartamento"
              className={
                validateField('description', form.description) ? INPUT_CLASS : INPUT_ERROR_CLASS
              }
              disabled={saving}
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
                <label htmlFor="iptu-cashValue" className={LABEL_CLASS}>
                  Valor IPTU *
                </label>
                <input
                  id="iptu-cashValue"
                  value={form.cashValue.startsWith('R$') ? form.cashValue : form.cashValue}
                  onChange={(e) => handleCurrencyInput('cashValue', e.target.value)}
                  onBlur={() => {
                    handleCurrencyBlur('cashValue');
                    setTouched((prev) => ({ ...prev, cashValue: true }));
                  }}
                  placeholder="Digite: 123456 (para R$ 1.234,56)"
                  className={
                    validateField('cashValue', form.cashValue) ? INPUT_CLASS : INPUT_ERROR_CLASS
                  }
                  disabled={saving}
                  required
                />
                {touched.cashValue && !form.cashValue && (
                  <p className="text-xs text-red-400 mt-1">Insira um valor válido</p>
                )}
              </div>
              <div>
                <label htmlFor="iptu-garbageTaxCash" className={LABEL_CLASS}>
                  Taxa de Lixo *
                </label>
                <input
                  id="iptu-garbageTaxCash"
                  value={
                    form.garbageTaxCash.startsWith('R$') ? form.garbageTaxCash : form.garbageTaxCash
                  }
                  onChange={(e) => handleCurrencyInput('garbageTaxCash', e.target.value)}
                  onBlur={() => {
                    handleCurrencyBlur('garbageTaxCash');
                    setTouched((prev) => ({ ...prev, garbageTaxCash: true }));
                  }}
                  placeholder="Digite: 15000 (para R$ 150,00)"
                  className={
                    validateField('garbageTaxCash', form.garbageTaxCash)
                      ? INPUT_CLASS
                      : INPUT_ERROR_CLASS
                  }
                  disabled={saving}
                  required
                />
              </div>
            </div>
            <div className="mt-3">
              <label htmlFor="iptu-cashDueDate" className={LABEL_CLASS}>
                Data de Vencimento *
              </label>
              <input
                id="iptu-cashDueDate"
                type="date"
                value={form.cashDueDate}
                onChange={(e) => updateField('cashDueDate', e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, cashDueDate: true }))}
                className={INPUT_CLASS}
                disabled={saving}
                required
              />
            </div>
          </div>

          {/* Installment Payment */}
          <div className="border-t border-gray-700 pt-3">
            <h3 className="text-base font-medium text-white mb-3">Pagamento Parcelado</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="iptu-installments" className={LABEL_CLASS}>
                  Nº de Parcelas *
                </label>
                <input
                  id="iptu-installments"
                  type="number"
                  value={form.installments}
                  onChange={(e) => updateField('installments', e.target.value)}
                  onBlur={() => setTouched((prev) => ({ ...prev, installments: true }))}
                  min="1"
                  placeholder="Ex: 12"
                  className={INPUT_CLASS}
                  disabled={saving}
                  required
                />
              </div>
              <div>
                <label htmlFor="iptu-installmentValue" className={LABEL_CLASS}>
                  Valor da Parcela *
                </label>
                <input
                  id="iptu-installmentValue"
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
                  placeholder="Digite: 12050 (para R$ 120,50)"
                  className={
                    validateField('installmentValue', form.installmentValue)
                      ? INPUT_CLASS
                      : INPUT_ERROR_CLASS
                  }
                  disabled={saving}
                  required
                />
              </div>
              <div>
                <label htmlFor="iptu-garbageTaxInstallment" className={LABEL_CLASS}>
                  Taxa Lixo (Parcela) *
                </label>
                <input
                  id="iptu-garbageTaxInstallment"
                  value={
                    form.garbageTaxInstallment.startsWith('R$')
                      ? form.garbageTaxInstallment
                      : form.garbageTaxInstallment
                  }
                  onChange={(e) => handleCurrencyInput('garbageTaxInstallment', e.target.value)}
                  onBlur={() => {
                    handleCurrencyBlur('garbageTaxInstallment');
                    setTouched((prev) => ({ ...prev, garbageTaxInstallment: true }));
                  }}
                  placeholder="Digite: 1500 (para R$ 15,00)"
                  className={
                    validateField('garbageTaxInstallment', form.garbageTaxInstallment)
                      ? INPUT_CLASS
                      : INPUT_ERROR_CLASS
                  }
                  disabled={saving}
                  required
                />
              </div>
              <div>
                <label htmlFor="iptu-firstInstallmentDate" className={LABEL_CLASS}>
                  1ª Parcela *
                </label>
                <input
                  id="iptu-firstInstallmentDate"
                  type="date"
                  value={form.firstInstallmentDate}
                  onChange={(e) => updateField('firstInstallmentDate', e.target.value)}
                  onBlur={() => setTouched((prev) => ({ ...prev, firstInstallmentDate: true }))}
                  className={INPUT_CLASS}
                  disabled={saving}
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
