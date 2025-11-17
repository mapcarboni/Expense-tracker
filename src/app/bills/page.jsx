import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from '@/components/Header';

export default function BillsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950">
        <Header />
        <h1 className="text-white text-2xl">Bills Page</h1>
      </div>
    </ProtectedRoute>
  );
}
