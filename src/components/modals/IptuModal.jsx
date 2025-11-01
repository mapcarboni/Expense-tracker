'use client';

import { useState, useEffect } from 'react';
import { X, Save, Home, DollarSign, Calendar, CreditCard } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import { allowOnlyNumbers, formatMoney, parseToNumber } from '@/utils/formatters';

const INITIAL_FORM = {
  property_name: '',
  total_value: '',
  installments: '10',
  due_day: '',
  payment_method: 'pix',
  notes: '',
};

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all';
const LABEL_CLASS = 'block text-sm font-medium text-gray-300 mb-1.5';

export function IPTUModal({ isOpen, onClose, onSuccess, editData = null }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  useEffect(() => {
    if (editData) {
      setForm({
        property_name: editData.property_name,
        total_value: formatMoney(editData.total_value),
        installments: editData.installments.toString(),
        due_day: editData.due_day.toString(),
        payment_method: editData.payment_method,
        notes: editData.notes || '',
      });
    } else {
      setForm(INITIAL_FORM);
    }
  }, [editData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCurrencyInput = (name, value, shouldFormat = false) => {
    const cleanValue = shouldFormat ? formatMoney(value) : allowOnlyNumbers(value);
    setForm((prev) => ({ ...prev, [name]: cleanValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.property_name || !form.total_value || !form.installments || !form.due_day) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);

    try {
      const data = {
        user_id: user.id,
        property_name: form.property_name,
        total_value: parseToNumber(form.total_value),
        installments: parseInt(form.installments),
        due_day: parseInt(form.due_day),
        payment_method: form.payment_method,
        notes: form.notes || null,
      };

      if (editData) {
        const { error } = await supabase.from('iptu').update(data).eq('id', editData.id);
        if (error) throw error;
        toast.success('IPTU atualizado!');
      } else {
        const { error } = await supabase.from('iptu').insert([data]);
        if (error) throw error;
        toast.success('IPTU cadastrado!');
      }

      setForm(INITIAL_FORM);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error(editData ? 'Erro ao atualizar IPTU' : 'Erro ao cadastrar IPTU');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    form.property_name.trim() &&
    form.total_value.startsWith('R$') &&
    form.installments &&
    form.due_day;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl rounded-xl border border-gray-700 bg-gray-800 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-700 px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600/20 rounded-lg">
              <Home className="w-4 h-4 text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">
              {editData ? 'Editar' : 'Cadastrar'} IPTU
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label htmlFor="property_name" className={LABEL_CLASS}>
              Nome do Imóvel *
            </label>
            <div className="relative">
              <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                id="property_name"
                name="property_name"
                value={form.property_name}
                onChange={handleChange}
                placeholder="Ex: Casa Principal, Apartamento"
                className={`${INPUT_CLASS} pl-10`}
                autoFocus
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="total_value" className={LABEL_CLASS}>
                Valor Total *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  id="total_value"
                  name="total_value"
                  value={form.total_value}
                  onChange={(e) => handleCurrencyInput('total_value', e.target.value)}
                  onBlur={(e) => handleCurrencyInput('total_value', e.target.value, true)}
                  placeholder="1234,56"
                  className={`${INPUT_CLASS} pl-10`}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="installments" className={LABEL_CLASS}>
                Nº de Parcelas *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  id="installments"
                  name="installments"
                  type="number"
                  value={form.installments}
                  onChange={handleChange}
                  min="1"
                  max="12"
                  placeholder="10"
                  className={`${INPUT_CLASS} pl-10`}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="due_day" className={LABEL_CLASS}>
                Dia Vencimento *
              </label>
              <input
                id="due_day"
                name="due_day"
                type="number"
                value={form.due_day}
                onChange={handleChange}
                min="1"
                max="31"
                placeholder="10"
                className={INPUT_CLASS}
                required
              />
            </div>

            <div>
              <label htmlFor="payment_method" className={LABEL_CLASS}>
                Forma de Pagamento *
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <select
                  id="payment_method"
                  name="payment_method"
                  value={form.payment_method}
                  onChange={handleChange}
                  className={`${INPUT_CLASS} pl-10 appearance-none cursor-pointer`}>
                  <option value="pix">PIX</option>
                  <option value="boleto">Boleto</option>
                  <option value="debito_automatico">Débito Automático</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="notes" className={LABEL_CLASS}>
              Observações
            </label>
            <textarea
              id="notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Informações adicionais..."
              rows="2"
              className={`${INPUT_CLASS} resize-none`}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-gray-600 transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isFormValid || loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
