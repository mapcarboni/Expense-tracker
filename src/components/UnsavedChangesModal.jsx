'use client';

import { AlertTriangle, X } from 'lucide-react';

export function UnsavedChangesModal({ isOpen, onClose, onDiscard, onSave }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-lg bg-gray-900 p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-yellow-500/20 p-2">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            </div>
            <h2 className="text-xl font-semibold text-white">Alterações não salvas</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6 space-y-3">
          <p className="text-gray-300">Você tem alterações não salvas. O que deseja fazer?</p>
          <p className="text-sm text-yellow-400">
            ⚠️ Se sair sem salvar, suas alterações serão perdidas.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onSave}
            className="w-full rounded-lg bg-green-600 px-4 py-2.5 font-medium text-white transition hover:bg-green-700">
            Salvar e Continuar
          </button>
          <button
            onClick={onDiscard}
            className="w-full rounded-lg border border-red-600 px-4 py-2.5 font-medium text-red-500 transition hover:bg-red-600/10">
            Descartar Alterações
          </button>
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-gray-700 px-4 py-2.5 font-medium text-gray-300 transition hover:bg-gray-800">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
