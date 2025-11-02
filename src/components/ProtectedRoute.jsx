'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ children, fallback = null }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (!loading && !user && !redirectedRef.current) {
      redirectedRef.current = true;

      const returnUrl = pathname !== '/' ? `?returnUrl=${pathname}` : '';
      router.replace(`/${returnUrl}`);
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      fallback || (
        <div className="flex min-h-screen items-center justify-center bg-gray-950">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <p className="text-sm text-gray-400">Carregando...</p>
          </div>
        </div>
      )
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
