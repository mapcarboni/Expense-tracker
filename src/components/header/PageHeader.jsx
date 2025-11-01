'use client';

import { useState } from 'react';
import { Menu, X, LogOut, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function PageHeader({
  title,
  availableYears = [],
  selectedYear,
  onYearChange,
  hasUnsavedChanges = false,
  onSave,
  isSaving = false,
}) {
  const { signOut } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems = [
    { href: '/bills', label: 'Contas Anuais', icon: '💰' },
    { href: '/decisions', label: 'Decisões', icon: '⚖️' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 mb-6">
      <div className="flex items-center justify-between px-4 py-3 gap-4">
        {/* Menu Hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Título */}
        <h1 className="text-xl font-bold text-white truncate">{title}</h1>

        {/* Ações */}
        <div className="flex items-center gap-2">
          {/* Dropdown Anos */}
          {availableYears.length > 0 && (
            <select
              value={selectedYear}
              onChange={(e) => onYearChange?.(Number(e.target.value))}
              className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          )}

          {/* Botão Salvar */}
          {onSave && (
            <button
              onClick={onSave}
              disabled={!hasUnsavedChanges || isSaving}
              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span className="hidden sm:inline">Salvar</span>
                </>
              )}
            </button>
          )}

          {/* Logout */}
          <button
            onClick={signOut}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Menu Dropdown */}
      {menuOpen && (
        <div className="border-t border-gray-800 bg-gray-900">
          <nav className="px-4 py-2 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}>
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Indicador de mudanças não salvas */}
      {hasUnsavedChanges && (
        <div className="px-4 py-2 bg-yellow-900/20 border-t border-yellow-600/50">
          <p className="text-xs text-yellow-200">⚠️ Você tem alterações não salvas</p>
        </div>
      )}
    </header>
  );
}
