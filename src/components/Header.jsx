'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Menu, X, Calendar, PiggyBank, LogOut, Loader2, ChevronDown } from 'lucide-react';

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

  // ✅ Refs para detectar clique fora
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

  const handleSave = async () => {
    if (onSave) {
      await onSave();
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm">
      <div className="px-4 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: Menu + Title */}
          <div className="flex items-center gap-3">
            {/* Menu Hambúrguer */}
            <div className="relative">
              <button
                ref={buttonRef}
                onClick={() => setMenuOpen(!menuOpen)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                aria-label="Menu">
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              {/* Dropdown Menu */}
              {menuOpen && (
                <div
                  ref={menuRef}
                  className="absolute left-0 top-full mt-3 w-72 rounded-xl border border-gray-700 bg-gray-800 shadow-2xl z-40">
                  <nav className="p-3 space-y-1">
                    {Object.entries(ROUTES).map(([path, route]) => {
                      const RouteIcon = route.icon;
                      const isActive = pathname === path;

                      return (
                        <Link
                          key={path}
                          href={path}
                          onClick={() => setMenuOpen(false)}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-base transition-colors ${
                            isActive
                              ? 'bg-blue-600/20 text-blue-400'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`}>
                          <RouteIcon className="h-4 w-4" />
                          <div className="flex-1">
                            <div className="font-medium">{route.label}</div>
                            <div className="text-sm text-gray-500">{route.description}</div>
                          </div>
                        </Link>
                      );
                    })}

                    <div className="border-t border-gray-700 mt-2 pt-2">
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          signOut();
                        }}
                        className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-400 hover:bg-red-600/10 transition-colors">
                        <LogOut className="h-4 w-4" />
                        <span className="font-medium">Sair</span>
                      </button>
                    </div>
                  </nav>
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <h1 className="text-xl font-bold text-white sm:text-2xl">
                {currentRoute.label} {selectedYear}
              </h1>
              {currentRoute.description && (
                <p className="text-sm text-gray-400 mt-0.5">{currentRoute.description}</p>
              )}
            </div>
          </div>

          {/* Right: Unsaved Indicator + Year Selector */}
          <div className="flex items-center gap-3">
            {/* Unsaved Changes Indicator */}
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 rounded-lg bg-yellow-900/20 border border-yellow-600 px-3 py-2">
                <div className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
                <span className="text-xs text-yellow-200 font-medium">Não salvo</span>
              </div>
            )}

            {/* Save Button */}
            {hasUnsavedChanges && (
              <button
                onClick={handleSave}
                disabled={saveLoading}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {saveLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Salvando...</span>
                  </>
                ) : (
                  <span>Salvar</span>
                )}
              </button>
            )}

            {/* Year Selector */}
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(Number(e.target.value))}
                disabled={yearsLoading}
                className="appearance-none rounded-lg border border-gray-700 bg-gray-800 pl-3 pr-8 py-2 text-sm text-white hover:border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {yearsLoading ? (
                  <option>Carregando...</option>
                ) : (
                  years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
