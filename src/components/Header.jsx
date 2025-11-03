'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Menu,
  X,
  Calendar,
  PiggyBank,
  LogOut,
  Check,
  AlertCircle,
  Loader2,
  ChevronDown,
} from 'lucide-react';

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
  isSaved = true,
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

  const currentRoute = ROUTES[pathname] || {
    label: 'Expense Tracker',
    icon: PiggyBank,
    description: '',
  };
  const Icon = currentRoute.icon;

  useEffect(() => {
    fetchYears();
  }, []);

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

  const getSaveButtonConfig = () => {
    if (saveLoading) {
      return {
        text: 'Salvando...',
        icon: Loader2,
        className: 'bg-blue-600 cursor-wait',
        iconClass: 'animate-spin',
      };
    }
    if (isSaved) {
      return {
        text: 'Salvo',
        icon: Check,
        className: 'bg-green-600 hover:bg-green-700',
        iconClass: '',
      };
    }
    return {
      text: 'Salvar',
      icon: AlertCircle,
      className: 'bg-orange-600 hover:bg-orange-700',
      iconClass: '',
    };
  };

  const saveConfig = getSaveButtonConfig();
  const SaveIcon = saveConfig.icon;

  return (
    <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-3 gap-4">
        {/* Left Side: Menu + Title */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Menu Hamburguer com Popup */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Menu Dropdown - Popup Style */}
            {menuOpen && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                {/* Popup */}
                <div className="absolute left-0 top-full mt-2 w-72 rounded-xl border border-gray-700 bg-gray-800 shadow-2xl z-40">
                  <nav className="p-3 space-y-1">
                    {Object.entries(ROUTES).map(([path, route]) => {
                      const RouteIcon = route.icon;
                      const isActive = pathname === path;

                      return (
                        <Link
                          key={path}
                          href={path}
                          onClick={() => setMenuOpen(false)}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                            isActive
                              ? 'bg-blue-600/20 text-blue-400'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`}>
                          <RouteIcon className="h-4 w-4" />
                          <div className="flex-1">
                            <div className="font-medium">{route.label}</div>
                            <div className="text-xs text-gray-500">{route.description}</div>
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
              </>
            )}
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <div className="shrink-0 p-1.5 bg-blue-600/20 rounded-lg">
              <Icon className="w-4 h-4 text-blue-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-white truncate">{currentRoute.label}</h1>
              {currentRoute.description && (
                <p className="text-xs text-gray-400 truncate">{currentRoute.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Year Selector + Save Button */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Droplist de Anos */}
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

          {/* Botão de Salvamento */}
          <button
            onClick={handleSave}
            disabled={isSaved || saveLoading}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-75 ${saveConfig.className}`}>
            <SaveIcon className={`h-4 w-4 ${saveConfig.iconClass}`} />
            <span className="hidden sm:inline">{saveConfig.text}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
