import { useState, useEffect, useCallback } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { formatMoney, parseToNumber } from '@/utils/formatters';
import { useZeroValueDateHandler } from '@/hooks/useZeroValueDateHandler';
import { INPUT_CLASS, INPUT_ERROR_CLASS, LABEL_CLASS } from '@/constants/app';

const INITIAL_FORM = {
  description: '',
  value: '',
  installments: 1,
  dueDate: '',
};

export default function OutrosModal({ isOpen, onClose, onSave, year, editData = null }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);

  // ✅ Hook adaptado para modal "Outros" (usa campo "value" em vez de cash/installment)
  const isDateDisabled = parseToNumber(form.value) === 0;

  useEffect(() => {
    if (!isOpen) return;

    if (editData) {
      const value = editData.cash_value || editData.installment_value;
      setForm({
        description: editData.description,
        value: value ? String(value * 100) : '',
        installments: editData.installments || 1,
        dueDate: editData.cash_due_date || editData.first_installment_date || '',
      });
    } else {
      setForm(INITIAL_FORM);
      setTouched({});
    }
  }, [editData, isOpen]);

  // ✅ Auto-limpa data quando valor é zerado
  useEffect(() => {
    if (isDateDisabled && form.dueDate) {
      setForm((prev) => ({ ...prev, dueDate: '' }));
    }
  }, [isDateDisabled]);

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
        case 'value':
          return typeof value === 'string' && (value.startsWith('R$') || value.length >= 0);
        case 'dueDate':
          return isDateDisabled || value.length > 0;
        case 'installments':
          return parseInt(value) >= 1;
        default:
          return true;
      }
    },
    [touched, isDateDisabled],
  );

  const isFormValid =
    form.description.trim() &&
    (form.value.startsWith('R$') || form.value.length >= 0) &&
    form.installments >= 1 &&
    (isDateDisabled || form.dueDate);

  const handleSubmit = useCallback(
    async (e) => {
      e?.preventDefault();
      if (!isFormValid || saving) return;

      setSaving(true);

      try {
        const isInstallment = parseInt(form.installments) > 1;

        // ✅ Limpa data se valor = 0
        const cleanedData = {
          id: editData?.id,
          type: 'OUTROS',
          year,
          description: form.description,
          cash_value: isInstallment ? null : parseToNumber(form.value),
          cash_due_date: isInstallment ? null : isDateDisabled ? null : form.dueDate,
          installments: parseInt(form.installments),
          installment_value: isInstallment ? parseToNumber(form.value) : null,
          first_installment_date: isInstallment ? (isDateDisabled ? null : form.dueDate) : null,
          payment_choice: editData?.payment_choice || null,
          destination: editData?.destination || null,
        };

        await onSave(cleanedData);

        setForm(INITIAL_FORM);
        setTouched({});
        onClose();
      } catch (error) {
        console.error('Erro ao salvar despesa:', error);
      } finally {
        setSaving(false);
      }
    },
    [isFormValid, saving, onSave, editData, year, form, onClose, isDateDisabled],
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

  const isParcelado = parseInt(form.installments) > 1;
  const total = parseToNumber(form.value) * parseInt(form.installments || 1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-xl border border-gray-700 bg-gray-800 shadow-2xl">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-700 bg-gray-800 px-5 py-3">
          <h2 className="text-lg font-semibold text-white">
            {editData ? 'Editar' : 'Nova'} Despesa - Outros {year}
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
            <label htmlFor="outros-desc" className={LABEL_CLASS}>
              Descrição *
            </label>
            <input
              id="outros-desc"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, description: true }))}
              placeholder="Ex: Contas a pagar"
              className={
                validateField('description', form.description) ? INPUT_CLASS : INPUT_ERROR_CLASS
              }
              disabled={saving}
              autoFocus
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="outros-value" className="block text-xs text-gray-400 mb-1">
                Valor {isParcelado ? 'da Parcela' : ''} *
              </label>
              <input
                id="outros-value"
                value={form.value.startsWith('R$') ? form.value : form.value}
                onChange={(e) => handleCurrencyInput('value', e.target.value)}
                onBlur={() => {
                  handleCurrencyBlur('value');
                  setTouched((prev) => ({ ...prev, value: true }));
                }}
                placeholder="123,45"
                className={INPUT_CLASS}
                disabled={saving}
              />
            </div>
            <div>
              <label htmlFor="outros-inst" className="block text-xs text-gray-400 mb-1">
                Nº Parcelas *
              </label>
              <input
                id="outros-inst"
                type="number"
                value={form.installments}
                onChange={(e) => updateField('installments', e.target.value)}
                min="1"
                className={INPUT_CLASS}
                disabled={saving}
              />
            </div>
          </div>

          {isParcelado && form.value.startsWith('R$') && (
            <div className="rounded-lg border border-blue-500/30 bg-blue-900/20 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Valor Total:</span>
                <span className="text-xl font-bold text-blue-400">{formatMoney(total)}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {form.installments}x de {formatMoney(parseToNumber(form.value))}
              </p>
            </div>
          )}

          <div>
            <label htmlFor="outros-date" className="block text-xs text-gray-400 mb-1">
              Vencimento {isParcelado && '(1ª Parcela)'} {isDateDisabled && '🔒'}
            </label>
            <input
              id="outros-date"
              type="date"
              value={form.dueDate}
              onChange={(e) => updateField('dueDate', e.target.value)}
              className={`${INPUT_CLASS} ${isDateDisabled ? 'opacity-50' : ''}`}
              disabled={saving || isDateDisabled}
            />
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
