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
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 🔍 Índices
CREATE INDEX idx_decisions_user_year ON decisions(user_id, year);
CREATE INDEX idx_decisions_type ON decisions(type);

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
