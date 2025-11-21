-- ✅ Execute este script no SQL Editor do Supabase

-- 🗑️ Drop tabela antiga
DROP TABLE IF EXISTS decisions CASCADE;
DROP TYPE IF EXISTS expense_type CASCADE;
DROP TYPE IF EXISTS payment_type CASCADE;
DROP TYPE IF EXISTS destination_type CASCADE;

-- 🧩 Extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 🧱 Types ENUM
CREATE TYPE expense_type AS ENUM ('IPTU', 'IPVA', 'SEGURO', 'OUTROS');
CREATE TYPE payment_type AS ENUM ('cash', 'installment');
CREATE TYPE destination_type AS ENUM (
  'fixed_first',
  'fixed_second',
  'credit_card_1',
  'credit_card_2'
);

-- 📋 Tabela decisions
CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  type expense_type NOT NULL,
  description TEXT NOT NULL,

  payment_choice payment_type,
  destination destination_type,

  -- Valores podem ser 0, mas não negativos
  cash_value DECIMAL(10,2) DEFAULT 0 CHECK (cash_value >= 0),
  cash_due_date DATE,

  installments INTEGER CHECK (installments IS NULL OR (installments >= 1 AND installments <= 24)),
  installment_value DECIMAL(10,2) DEFAULT 0 CHECK (installment_value >= 0),
  first_installment_date DATE,

  garbage_tax_cash DECIMAL(10,2) DEFAULT 0 CHECK (garbage_tax_cash >= 0),
  garbage_tax_installment DECIMAL(10,2) DEFAULT 0 CHECK (garbage_tax_installment >= 0),

  dpvat_value DECIMAL(10,2) DEFAULT 0 CHECK (dpvat_value >= 0),
  dpvat_due_date DATE,
  licensing_value DECIMAL(10,2) DEFAULT 0 CHECK (licensing_value >= 0),
  licensing_due_date DATE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_year CHECK (
    year >= EXTRACT(YEAR FROM CURRENT_DATE) - 10 AND
    year <= EXTRACT(YEAR FROM CURRENT_DATE) + 10
  )
);

-- 🔍 Índices
CREATE INDEX idx_decisions_user_year ON decisions(user_id, year);
CREATE INDEX idx_decisions_type ON decisions(type);
CREATE INDEX idx_decisions_year ON decisions(year);
CREATE INDEX idx_decisions_user_id ON decisions(user_id);

-- 🔒 RLS
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;

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

-- 🕐 Trigger
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


-- 🗑️ Drop tabelas e types antigos
DROP TABLE IF EXISTS bills CASCADE;
DROP TABLE IF EXISTS bank_balance CASCADE;
DROP TYPE IF EXISTS bill_category CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS account_code CASCADE;

-- 🧱 Types ENUM
CREATE TYPE bill_category AS ENUM ('salary', 'advance', 'vacation', 'thirteenth', 'transfer', 'expense');
CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer');
CREATE TYPE account_code AS ENUM ('B', 'I', 'N');

-- 📋 Tabela bills
CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  decision_id UUID REFERENCES decisions(id) ON DELETE SET NULL,

  year INT NOT NULL,
  month INT NOT NULL CHECK (month >= 1 AND month <= 12),

  category bill_category NOT NULL,
  type transaction_type NOT NULL,
  description TEXT NOT NULL,
  value DECIMAL(10,2) NOT NULL CHECK (value >= 0),
  due_date DATE,

  destination destination_type,

  installment_number INT,
  total_installments INT,

  from_account account_code,
  to_account account_code,
  paid_from_account account_code,

  paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 💰 Tabela bank_balance
CREATE TABLE bank_balance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  year INT NOT NULL,
  month INT NOT NULL,

  balance_b DECIMAL(10,2) DEFAULT 0,
  balance_i DECIMAL(10,2) DEFAULT 0,

  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, year, month)
);

-- 🔍 Índices
CREATE INDEX idx_bills_user_year_month ON bills(user_id, year, month);
CREATE INDEX idx_bills_destination ON bills(destination);

-- 🔒 RLS
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_balance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_bills" ON bills FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_balance" ON bank_balance FOR ALL USING (auth.uid() = user_id);

-- 🕐 Trigger
CREATE TRIGGER trigger_bills_updated_at
  BEFORE UPDATE ON bills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_balance_updated_at
  BEFORE UPDATE ON bank_balance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
