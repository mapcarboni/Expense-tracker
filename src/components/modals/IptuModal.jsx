// src/components/modals/IPTUModal.jsx
'use client';

import { useState } from 'react';
import { X, Home, Calendar, DollarSign, CreditCard, FileText, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';

export function IPTUModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    property_name: '',
    total_value: '',
    installments: '',
    due_day: '',
    payment_method: 'pix',
    notes: '',
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.property_name || !form.total_value || !form.installments || !form.due_day) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('iptu').insert([
        {
          user_id: user.id,
          property_name: form.property_name,
          total_value: parseFloat(form.total_value),
          installments: parseInt(form.installments),
          due_day: parseInt(form.due_day),
          payment_method: form.payment_method,
          notes: form.notes || null,
        },
      ]);

      if (error) throw error;

      toast.success('IPTU cadastrado com sucesso!');
      setForm({
        property_name: '',
        total_value: '',
        installments: '',
        due_day: '',
        payment_method: 'pix',
        notes: '',
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao cadastrar IPTU');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-gray-800 rounded-2xl shadow-2xl border border-gray-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <Home className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Cadastrar IPTU</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Nome do Imóvel *
              </label>
              <div className="relative">
                <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  name="property_name"
                  value={form.property_name}
                  onChange={handleChange}
                  placeholder="Ex: Casa Principal"
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg pl-10 pr-3 py-2.5 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Valor Total *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="number"
                  name="total_value"
                  value={form.total_value}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg pl-10 pr-3 py-2.5 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Parcelas *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="number"
                  name="installments"
                  value={form.installments}
                  onChange={handleChange}
                  placeholder="12"
                  min="1"
                  max="12"
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg pl-10 pr-3 py-2.5 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Dia Vencimento *
              </label>
              <input
                type="number"
                name="due_day"
                value={form.due_day}
                onChange={handleChange}
                placeholder="10"
                min="1"
                max="31"
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Forma de Pagamento *
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <select
                  name="payment_method"
                  value={form.payment_method}
                  onChange={handleChange}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg pl-10 pr-3 py-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none cursor-pointer">
                  <option value="pix">PIX</option>
                  <option value="boleto">Boleto</option>
                  <option value="debito_automatico">Débito Automático</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Observações</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Informações adicionais..."
                rows="2"
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg pl-10 pr-3 py-2.5 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Salvando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Cadastrar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
