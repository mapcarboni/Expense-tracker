// src/app/bills/page.jsx
'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { IPTUModal } from '@/components/modals/IPTUModal';
import { useAuth } from '@/contexts/AuthContext';
import { Home, Plus, LogOut } from 'lucide-react';

function BillsPage() {
  const { signOut, user } = useAuth();
  const [isIPTUModalOpen, setIsIPTUModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Minhas Contas</h1>
            <p className="text-gray-400">Olá, {user?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors">
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => setIsIPTUModalOpen(true)}
            className="p-6 bg-gray-800 hover:bg-gray-700 border-2 border-dashed border-gray-700 hover:border-blue-600 rounded-xl transition-all group">
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-blue-600/20 group-hover:bg-blue-600/30 rounded-lg transition-colors">
                <Home className="w-8 h-8 text-blue-400" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-1">IPTU</h3>
                <p className="text-sm text-gray-400">Cadastrar novo IPTU</p>
              </div>
              <Plus className="w-6 h-6 text-gray-500 group-hover:text-blue-400 transition-colors" />
            </div>
          </button>
        </div>
      </div>

      <IPTUModal
        isOpen={isIPTUModalOpen}
        onClose={() => setIsIPTUModalOpen(false)}
        onSuccess={() => {
          // Atualizar lista aqui no futuro
          console.log('IPTU cadastrado!');
        }}
      />
    </div>
  );
}

export default function Page() {
  return (
    <ProtectedRoute>
      <BillsPage />
    </ProtectedRoute>
  );
}
