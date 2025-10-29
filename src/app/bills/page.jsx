import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function BillsPage() {
  return (
    <ProtectedRoute>
      <div>Conteúdo protegido aqui</div>
    </ProtectedRoute>
  );
}
