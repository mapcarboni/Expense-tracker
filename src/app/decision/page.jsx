'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Header } from '@/components/Header';

export default function DecisionPage() {
  const [isSaved, setIsSaved] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  const handleSave = async () => {
    setSaveLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsSaved(true);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950">
        <Header isSaved={isSaved} onSave={handleSave} saveLoading={saveLoading} />

        <main className="p-6">
          <p className="text-gray-400 text-center">
            Página de planejamento financeiro - funcionalidades serão implementadas em breve
          </p>
        </main>
      </div>
    </ProtectedRoute>
  );
}
