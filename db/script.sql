-- 🧹 Limpeza prévia: remover tabela e tipos, se existirem
DROP TABLE IF EXISTS decisions CASCADE;
DROP TYPE IF EXISTS expense_type CASCADE;
DROP TYPE IF EXISTS payment_type CASCADE;
DROP TYPE IF EXISTS destination_type CASCADE;

-- 🧩 Extensão necessária
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 🧱 Criação dos tipos ENUM
CREATE TYPE expense_type AS ENUM ('IPTU', 'IPVA', 'SEGURO', 'OUTROS');
CREATE TYPE payment_type AS ENUM ('cash', 'installment');
CREATE TYPE destination_type AS ENUM (
  'fixed_first',
  'fixed_second',
  'credit_card_1',
  'credit_card_2'
);

-- 🗂️ Tabela principal
CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  type expense_type NOT NULL,
  description TEXT NOT NULL,

  payment_choice payment_type,
  destination destination_type,

  -- À vista
  cash_value DECIMAL(10,2),
  cash_due_date DATE,

  -- Parcelado
  installments INTEGER,
  installment_value DECIMAL(10,2),
  first_installment_date DATE,

  -- IPTU específico
  garbage_tax_cash DECIMAL(10,2),
  garbage_tax_installment DECIMAL(10,2),

  -- IPVA específico
  dpvat_value DECIMAL(10,2),
  dpvat_due_date DATE,
  licensing_value DECIMAL(10,2),
  licensing_due_date DATE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- ✅ VALIDAÇÕES DINÂMICAS
  CONSTRAINT valid_year CHECK (
    year >= EXTRACT(YEAR FROM CURRENT_DATE) - 5 AND
    year <= EXTRACT(YEAR FROM CURRENT_DATE) + 10
  ),
  CONSTRAINT valid_installments CHECK (
    installments IS NULL OR (installments >= 1 AND installments <= 24)
  ),
  CONSTRAINT valid_values CHECK (
    (cash_value IS NULL OR cash_value >= 0.01) AND
    (installment_value IS NULL OR installment_value >= 0.01) AND
    (garbage_tax_cash IS NULL OR garbage_tax_cash >= 0) AND
    (garbage_tax_installment IS NULL OR garbage_tax_installment >= 0) AND
    (dpvat_value IS NULL OR dpvat_value >= 0) AND
    (licensing_value IS NULL OR licensing_value >= 0)
  ),
  CONSTRAINT valid_payment_data CHECK (
    -- Se escolheu cash, deve ter cash_value e cash_due_date
    (payment_choice = 'cash' AND cash_value IS NOT NULL AND cash_due_date IS NOT NULL) OR
    -- Se escolheu installment, deve ter valores parcelados
    (payment_choice = 'installment' AND installments IS NOT NULL AND
     installment_value IS NOT NULL AND first_installment_date IS NOT NULL) OR
    -- Ou ainda não decidiu
    (payment_choice IS NULL)
  )
);

-- 🔍 Índices para performance
CREATE INDEX idx_decisions_user_year ON decisions(user_id, year);
CREATE INDEX idx_decisions_type ON decisions(type);
CREATE INDEX idx_decisions_year ON decisions(year);

-- 🔒 Segurança em nível de linha (RLS)
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;

-- 🧑‍💻 Políticas de acesso
CREATE POLICY "Users can view own decisions"
  ON decisions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own decisions"
  ON decisions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own decisions"
  ON decisions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own decisions"
  ON decisions FOR DELETE
  USING (auth.uid() = user_id);

-- 🧹 Função para limpar anos antigos automaticamente (trigger)
CREATE OR REPLACE FUNCTION clean_old_years()
RETURNS TRIGGER AS $$
DECLARE
  current_year INTEGER;
  min_year_allowed INTEGER;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  min_year_allowed := current_year - 5; -- Últimos 6 anos incluindo atual

  -- Deleta anos fora do range permitido
  DELETE FROM decisions
  WHERE user_id = NEW.user_id
    AND year < min_year_allowed;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que executa após INSERT
CREATE TRIGGER trigger_clean_old_years
  AFTER INSERT ON decisions
  FOR EACH ROW
  EXECUTE FUNCTION clean_old_years();

-- 🕐 Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_updated_at
  BEFORE UPDATE ON decisions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
