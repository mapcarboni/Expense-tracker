import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function DecisionPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950">
        <h1 className="text-white text-2xl p-8">Decision Page</h1>
        {/* Conteúdo da página aqui */}
      </div>
    </ProtectedRoute>
  );
}
