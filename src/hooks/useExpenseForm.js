import { useState, useCallback, useMemo } from 'react';
import { formatMoney, parseToNumber } from '@/utils/formatters';

/**
 * Hook para gerenciar formulários de despesas
 * Reduz duplicação entre modais IPTU/IPVA/Seguro/Outros
 */
export function useExpenseForm(initialData, editData) {
  const [form, setForm] = useState(initialData);
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);

  // Atualiza formulário quando editData muda
  const resetForm = useCallback(() => {
    if (editData) {
      setForm(editData);
    } else {
      setForm(initialData);
      setTouched({});
    }
  }, [editData, initialData]);

  // Atualiza campo individual
  const updateField = useCallback((name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  // Manipula inputs monetários
  const handleCurrencyInput = useCallback(
    (name, value, shouldFormat = false) => {
      const cleanValue = shouldFormat ? formatMoney(value) : value.replace(/\D/g, '');
      updateField(name, cleanValue);
    },
    [updateField],
  );

  // Marca campo como "tocado" no blur
  const markAsTouched = useCallback((name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  return {
    form,
    setForm,
    touched,
    saving,
    setSaving,
    updateField,
    handleCurrencyInput,
    markAsTouched,
    resetForm,
  };
}

/**
 * Hook para validação de campos
 */
export function useFieldValidation(touched) {
  const validateField = useCallback(
    (name, value, rules = {}) => {
      if (!touched[name]) return true;

      switch (rules.type) {
        case 'text':
          return value?.trim().length > 0;

        case 'currency':
          return typeof value === 'string' && value.startsWith('R$');

        case 'date':
          return value?.length > 0;

        case 'number':
          const num = parseInt(value);
          return num >= (rules.min || 1);

        default:
          return true;
      }
    },
    [touched],
  );

  return { validateField };
}
