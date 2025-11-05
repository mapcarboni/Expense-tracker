'use client';

import { AlertTriangle, X } from 'lucide-react';

export function ConfirmDeleteModal({ isOpen, onClose, onConfirm, expenseName }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-lg bg-gray-900 p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-red-500/20 p-2">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-white">Confirmar Exclusão</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6 space-y-3">
          <p className="text-gray-300">Tem certeza que deseja excluir esta despesa?</p>
          {expenseName && (
            <div className="rounded-lg bg-gray-800 p-3">
              <p className="text-sm font-medium text-gray-400">Despesa:</p>
              <p className="mt-1 text-white">{expenseName}</p>
            </div>
          )}
          <p className="text-sm text-red-400">
            Esta ação não poderá ser desfeita após salvar o planejamento.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-700 px-4 py-2.5 font-medium text-gray-300 transition hover:bg-gray-800">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 font-medium text-white transition hover:bg-red-700">
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
