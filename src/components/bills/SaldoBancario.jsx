'use client';

import { formatMoney, parseToNumber } from '@/lib/dbHelpers';

export function SaldoBancario({
  balanceB = 0,
  balanceI = 0,
  salario = '',
  adiantamento = '',
  ferias = '',
  decimoTerceiro = '',
  month,
  onChange,
  disabled = false,
}) {
  const showFerias = month === 1 || month === 7;
  const show13 = month === 11 || month === 12;

  const handleChange = (field, value) => {
    const cleanValue = value.replace(/[^\d,\.]/g, '');
    onChange({ [field]: cleanValue });
  };

  const handleBlur = (field, value) => {
    if (!value) return;
    const formatted = formatMoney(value);
    onChange({ [field]: formatted });
  };

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 space-y-4">
      <h3 className="text-white font-semibold text-lg border-b border-gray-700 pb-2">
        Saldo Bancário
      </h3>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Bradesco:</span>
          <span className="font-semibold text-green-400">{formatMoney(balanceB)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Itaú:</span>
          <span className="font-semibold text-green-400">{formatMoney(balanceI)}</span>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-4 space-y-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Pagamento</label>
          <input
            type="text"
            value={salario}
            onChange={(e) => handleChange('salario', e.target.value)}
            onBlur={(e) => handleBlur('salario', e.target.value)}
            disabled={disabled}
            placeholder="0,00"
            className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Adiantamento</label>
          <input
            type="text"
            value={adiantamento}
            onChange={(e) => handleChange('adiantamento', e.target.value)}
            onBlur={(e) => handleBlur('adiantamento', e.target.value)}
            disabled={disabled}
            placeholder="0,00"
            className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>

        {showFerias && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Férias</label>
            <input
              type="text"
              value={ferias}
              onChange={(e) => handleChange('ferias', e.target.value)}
              onBlur={(e) => handleBlur('ferias', e.target.value)}
              disabled={disabled}
              placeholder="0,00"
              className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
        )}

        {show13 && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">13º Salário</label>
            <input
              type="text"
              value={decimoTerceiro}
              onChange={(e) => handleChange('decimoTerceiro', e.target.value)}
              onBlur={(e) => handleBlur('decimoTerceiro', e.target.value)}
              disabled={disabled}
              placeholder="0,00"
              className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
        )}
      </div>
    </div>
  );
}
