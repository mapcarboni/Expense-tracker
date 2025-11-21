import { useMemo } from 'react';
import { parseToNumber } from '@/lib/dbHelpers';

/**
 * Hook para gerenciar datas baseadas em valores monetários
 * Desabilita e nullifica datas quando valor = 0
 */
export function useZeroValueDateHandler(form) {
  const disabledFields = useMemo(() => {
    return {
      // À Vista
      isCashDisabled: parseToNumber(form.cashValue) === 0,

      // Parcelado
      isInstallmentDisabled: parseToNumber(form.installmentValue) === 0,

      // IPVA específico
      isDpvatDisabled: form.dpvatValue !== undefined ? parseToNumber(form.dpvatValue) === 0 : false,
      isLicensingDisabled:
        form.licensingValue !== undefined ? parseToNumber(form.licensingValue) === 0 : false,
    };
  }, [form.cashValue, form.installmentValue, form.dpvatValue, form.licensingValue]);

  /**
   * Limpa datas quando valores são zerados
   */
  const getCleanedFormData = (formData) => {
    const cleaned = { ...formData };

    // Limpa data à vista se valor = 0
    if (disabledFields.isCashDisabled) {
      cleaned.cashDueDate = null;
    }

    // Limpa data parcelamento se valor = 0
    if (disabledFields.isInstallmentDisabled) {
      cleaned.firstInstallmentDate = null;
    }

    // IPVA - Limpa datas específicas
    if (disabledFields.isDpvatDisabled) {
      cleaned.dpvatDueDate = null;
    }
    if (disabledFields.isLicensingDisabled) {
      cleaned.licensingDueDate = null;
    }

    return cleaned;
  };

  return {
    ...disabledFields,
    getCleanedFormData,
  };
}
