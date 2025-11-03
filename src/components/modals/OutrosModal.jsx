import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { allowOnlyNumbers, formatMoney, parseToNumber } from '@/utils/formatters';

const INITIAL_FORM = {
  description: '',
  value: '',
  installments: 1,
  dueDate: '',
};

const INPUT_CLASS =
  'w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-1.5 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
const LABEL_CLASS = 'block text-sm font-medium text-gray-300 mb-1';

export default function OutrosModal({ isOpen, onClose, onSave, year, editData = null }) {
  const [form, setForm] = useState(INITIAL_FORM);

  useEffect(() => {
    if (editData) {
      setForm({
        description: editData.description,
        value: formatMoney(editData.value),
        installments: editData.installments,
        dueDate: editData.dueDate,
      });
    }
  }, [editData]);

  if (!isOpen) return null;

  const updateField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const handleValueInput = (value, shouldFormat = false) => {
    const cleanValue = shouldFormat ? formatMoney(value) : allowOnlyNumbers(value);
    updateField('value', cleanValue);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: editData?.id || Date.now(),
      type: 'Outros',
      year,
      description: form.description,
      value: parseToNumber(form.value),
      installments: parseInt(form.installments),
      dueDate: form.dueDate,
      paymentChoice: editData?.paymentChoice || null,
      destination: editData?.destination || null,
    });

    setForm(INITIAL_FORM);
    onClose();
  };

  const isFormValid = [
    form.description.trim(),
    form.value.startsWith('R$'),
    form.installments >= 1,
    form.dueDate,
  ].every(Boolean);

  const isParcelado = parseInt(form.installments) > 1;
  const total = parseToNumber(form.value) * parseInt(form.installments || 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-xl border border-gray-700 bg-gray-800 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-700 bg-gray-800 px-6 py-3">
          <h2 className="text-xl font-semibold text-white">
            {editData ? 'Editar' : 'Nova'} Despesa - Outros {year}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Description */}
          <div>
            <label htmlFor="outros-description" className={LABEL_CLASS}>
              Descrição *
            </label>
            <input
              id="outros-description"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Ex: Contas pagas por pix ..."
              className={INPUT_CLASS}
              autoFocus
              required
            />
          </div>

          {/* Value */}
          <div>
            <label htmlFor="outros-value" className={LABEL_CLASS}>
              Valor {isParcelado ? 'da Parcela' : ''} *
            </label>
            <input
              id="outros-value"
              value={form.value}
              onChange={(e) => handleValueInput(e.target.value)}
              onBlur={(e) => handleValueInput(e.target.value, true)}
              placeholder="Ex: 350,00"
              className={INPUT_CLASS}
              required
            />
          </div>

          {/* Installments */}
          <div>
            <label htmlFor="outros-installments" className={LABEL_CLASS}>
              Número de Parcelas *
            </label>
            <input
              id="outros-installments"
              type="number"
              value={form.installments}
              onChange={(e) => updateField('installments', e.target.value)}
              min="1"
              className={INPUT_CLASS}
              required
            />
            <p className="mt-1 text-xs text-gray-400">
              {isParcelado ? 'Pagamento parcelado' : 'Pagamento único (à vista)'}
            </p>
          </div>

          {/* Total Display for Installments */}
          {isParcelado && form.value.startsWith('R$') && (
            <div className="rounded-lg border border-blue-500/30 bg-blue-900/20 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Valor Total:</span>
                <span className="text-2xl font-bold text-blue-400">{formatMoney(total)}</span>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                {form.installments}x de {formatMoney(parseToNumber(form.value))}
              </p>
            </div>
          )}

          {/* Due Date */}
          <div>
            <label htmlFor="outros-dueDate" className={LABEL_CLASS}>
              Data de Vencimento {isParcelado ? '(1ª Parcela)' : ''} *
            </label>
            <input
              id="outros-dueDate"
              type="date"
              value={form.dueDate}
              onChange={(e) => updateField('dueDate', e.target.value)}
              className={INPUT_CLASS}
              required
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-gray-700 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-gray-600 transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isFormValid}
              className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Save className="h-4 w-4" />
              {editData ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
