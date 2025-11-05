'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Menu, X, Calendar, PiggyBank, LogOut, Loader2, ChevronDown, Save } from 'lucide-react';

const ROUTES = {
  '/bills': {
    label: 'Contas Mensais',
    icon: Calendar,
    description: 'Controle mensal de despesas',
  },
  '/decision': {
    label: 'Planejamento Financeiro',
    icon: PiggyBank,
    description: 'Gerencie despesas anuais',
  },
};

export function Header({
  hasUnsavedChanges = false,
  onSave,
  saveLoading = false,
  selectedYear,
  onYearChange,
}) {
  const { signOut } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [years, setYears] = useState([]);
  const [yearsLoading, setYearsLoading] = useState(true);

  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const currentRoute = ROUTES[pathname] || {
    label: 'Expense Tracker',
    icon: PiggyBank,
    description: '',
  };
  const Icon = currentRoute.icon;

  useEffect(() => {
    fetchYears();
  }, []);

  // ✅ Fecha menu ao clicar fora
  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // ✅ Fecha menu se houver mudanças não salvas
  useEffect(() => {
    if (hasUnsavedChanges && menuOpen) {
      setMenuOpen(false);
    }
  }, [hasUnsavedChanges]);

  const fetchYears = async () => {
    try {
      const { data, error } = await supabase
        .from('decisions')
        .select('year')
        .order('year', { ascending: false });

      if (error) throw error;

      const uniqueYears = [...new Set(data?.map((d) => d.year) || [])];
      const currentYear = new Date().getFullYear();

      if (!uniqueYears.includes(currentYear)) {
        uniqueYears.unshift(currentYear);
        uniqueYears.sort((a, b) => b - a);
      }

      setYears(uniqueYears);
    } catch (error) {
      console.error('Erro ao buscar anos:', error);
      setYears([new Date().getFullYear()]);
    } finally {
      setYearsLoading(false);
    }
  };

  const handleYearChange = (year) => {
    if (onYearChange) {
      onYearChange(year);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-700 bg-gray-900/95 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3">
          <Icon className="h-7 w-7 text-green-500" />
          <div>
            <h1 className="text-lg font-bold text-white">{currentRoute.label}</h1>
            {currentRoute.description && (
              <p className="text-xs text-gray-400">{currentRoute.description}</p>
            )}
          </div>
        </div>

        {/* Center: Year Selector (only on /decision) */}
        {pathname === '/decision' && selectedYear && onYearChange && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleYearChange(selectedYear - 1)}
              disabled={hasUnsavedChanges}
              className="rounded-lg bg-gray-800 px-3 py-1.5 text-white hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
              ←
            </button>
            <span className="min-w-[80px] text-center text-lg font-bold text-white">
              {selectedYear}
            </span>
            <button
              onClick={() => handleYearChange(selectedYear + 1)}
              disabled={hasUnsavedChanges}
              className="rounded-lg bg-gray-800 px-3 py-1.5 text-white hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
              →
            </button>
          </div>
        )}

        {/* Right: Save Button + Menu */}
        <div className="flex items-center gap-3">
          {/* ✅ Botão Salvar (visível quando há mudanças) */}
          {hasUnsavedChanges && onSave && (
            <button
              onClick={onSave}
              disabled={saveLoading}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition hover:bg-green-700 disabled:opacity-50">
              {saveLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Planejamento
                </>
              )}
            </button>
          )}

          {/* ✅ Menu Hamburguer (oculto quando há mudanças) */}
          {!hasUnsavedChanges && (
            <>
              <button
                ref={buttonRef}
                onClick={() => setMenuOpen(!menuOpen)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition">
                {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>

              {menuOpen && (
                <div
                  ref={menuRef}
                  className="absolute right-4 top-16 w-64 rounded-lg border border-gray-700 bg-gray-800 shadow-xl">
                  <nav className="p-2">
                    {Object.entries(ROUTES).map(([path, route]) => {
                      const RouteIcon = route.icon;
                      const isActive = pathname === path;

                      return (
                        <Link
                          key={path}
                          href={path}
                          onClick={() => setMenuOpen(false)}
                          className={`flex items-center gap-3 rounded-lg px-4 py-3 transition ${
                            isActive
                              ? 'bg-green-600 text-white'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`}>
                          <RouteIcon className="h-5 w-5" />
                          <span className="font-medium">{route.label}</span>
                        </Link>
                      );
                    })}

                    <hr className="my-2 border-gray-700" />

                    <button
                      onClick={signOut}
                      className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-red-400 hover:bg-red-600/10 hover:text-red-300 transition">
                      <LogOut className="h-5 w-5" />
                      <span className="font-medium">Sair</span>
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ✅ Barra de aviso quando menu está bloqueado */}
      {hasUnsavedChanges && (
        <div className="border-t border-yellow-600/30 bg-yellow-900/10 px-4 py-2">
          <p className="text-center text-sm text-yellow-300">
            🔒 Navegação bloqueada - Salve suas alterações primeiro
          </p>
        </div>
      )}
    </header>
  );
}
