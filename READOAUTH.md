# Guia Completo: Google OAuth + Supabase + Vercel

## 📋 Pré-requisitos
- Conta Google
- Conta Supabase (https://supabase.com)
- Conta Vercel (https://vercel.com)
- Projeto Next.js criado

---

## 🎯 Parte 1: Configurar Supabase

### 1.1 Criar Projeto no Supabase
1. Acesse https://supabase.com/dashboard
2. Clique em **New Project**
3. Preencha:
   - **Name**: `expense-tracker` (ou outro nome)
   - **Database Password**: Crie uma senha forte (guarde-a)
   - **Region**: Escolha mais próxima (ex: South America)
4. Clique em **Create new project**
5. Aguarde ~2 minutos para provisionar

### 1.2 Copiar Callback URL
1. No dashboard do projeto, vá em **Authentication → Providers**
2. Clique em **Google**
3. Copie a **Callback URL (for OAuth)**:
   ```
   https://xxxxxxxxxxxxxxxx.supabase.co/auth/v1/callback
   ```
4. **NÃO feche esta aba** - você voltará aqui

---

## 🔑 Parte 2: Configurar Google Cloud Console

### 2.1 Criar Projeto no Google Cloud
1. Acesse https://console.cloud.google.com
2. Clique no seletor de projetos (topo esquerdo)
3. Clique em **NEW PROJECT**
4. Nome: `Expense Tracker OAuth`
5. Clique em **CREATE**
6. Aguarde criação e selecione o projeto

### 2.2 Configurar OAuth Consent Screen
1. Menu lateral → **APIs & Services → OAuth consent screen**
2. Selecione **External**
3. Clique em **CREATE**
4. Preencha:
   - **App name**: `Expense Tracker`
   - **User support email**: seu email
   - **Developer contact**: seu email
5. Clique em **SAVE AND CONTINUE**
6. Em **Scopes**, clique em **SAVE AND CONTINUE** (não precisa adicionar nada)
7. Em **Test users**, clique em **ADD USERS** e adicione seu email
8. Clique em **SAVE AND CONTINUE** → **BACK TO DASHBOARD**

### 2.3 Criar OAuth Client ID
1. Menu lateral → **APIs & Services → Credentials**
2. Clique em **+ CREATE CREDENTIALS** → **OAuth client ID**
3. **Application type**: Web application
4. **Name**: `Expense Tracker Web Client`
5. Em **Authorized redirect URIs**, clique em **+ ADD URI**
6. **Cole a Callback URL** que você copiou do Supabase:
   ```
   https://xxxxxxxxxxxxxxxx.supabase.co/auth/v1/callback
   ```
7. Clique em **CREATE**
8. **⚠️ IMPORTANTE**: Copie e salve em local seguro:
   - **Client ID**: `xxxxx.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-xxxxx`
9. Clique em **OK**

---

## 🔐 Parte 3: Conectar Google ao Supabase

### 3.1 Configurar Provider Google
1. Volte ao **Supabase Dashboard**
2. **Authentication → Providers → Google**
3. Toggle **Enable Sign in with Google** para ON
4. Cole as credenciais do Google:
   - **Client ID (for OAuth)**: Cole o Client ID
   - **Client Secret (for OAuth)**: Cole o Client Secret
5. Clique em **Save**

### 3.2 Configurar Site URL (Desenvolvimento)
1. **Authentication → URL Configuration**
2. **Site URL**: `http://localhost:3000`
3. Clique em **Save**

### 3.3 Adicionar Redirect URLs
1. Na mesma tela (**URL Configuration**)
2. Em **Redirect URLs**, adicione:
   ```
   http://localhost:3000/**
   ```
3. Clique em **Save**

---

## 💻 Parte 4: Configurar Next.js Local

### 4.1 Copiar Credenciais do Supabase
1. **Project Settings → API**
2. Copie:
   - **Project URL**: `https://xxxxxxxxxxxxxxxx.supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 4.2 Criar arquivo .env.local
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4.3 Verificar .gitignore
Certifique-se que `.env*.local` está no `.gitignore`:
```gitignore
# env files
.env*
```

### 4.4 Testar Localmente
```bash
npm run dev
```
Acesse http://localhost:3000 e teste o login com Google

---

## 🚀 Parte 5: Deploy no Vercel

### 5.1 Fazer Deploy Inicial
1. Acesse https://vercel.com
2. Clique em **Add New... → Project**
3. Importe seu repositório do GitHub
4. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://xxxxxxxxxxxxxxxx.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sua-anon-key`
5. Clique em **Deploy**
6. Aguarde finalizar e **copie a URL do projeto**:
   ```
   https://seu-app.vercel.app
   ```

### 5.2 Atualizar Google OAuth (Adicionar URL de Produção)
1. Volte ao **Google Cloud Console**
2. **APIs & Services → Credentials**
3. Clique no seu **OAuth 2.0 Client ID**
4. Em **Authorized redirect URIs**, clique em **+ ADD URI**
5. **NÃO remova a URL do Supabase**, apenas adicione mais uma:
   ```
   https://xxxxxxxxxxxxxxxx.supabase.co/auth/v1/callback
   https://seu-app.vercel.app/**
   ```
6. Clique em **SAVE**

### 5.3 Atualizar Supabase (Adicionar URL de Produção)
1. **Supabase Dashboard → Authentication → URL Configuration**
2. **Site URL**: Mude para `https://seu-app.vercel.app`
3. Em **Redirect URLs**, adicione:
   ```
   http://localhost:3000/**
   https://seu-app.vercel.app/**
   ```
4. Clique em **Save**

### 5.4 Aguardar Propagação
- Google: ~5 minutos
- Supabase: Instantâneo
- Vercel: Não precisa redeploy

### 5.5 Testar em Produção
Acesse `https://seu-app.vercel.app` e teste o login

---

## 🐛 Troubleshooting

### Erro: "redirect_uri_mismatch"
**Causa**: URL não autorizada no Google OAuth
**Solução**: Verifique se as URIs no Google Console incluem:
```
https://xxxxx.supabase.co/auth/v1/callback
```

### Erro: "Invalid redirect URL"
**Causa**: URL não configurada no Supabase
**Solução**: Adicione em **Authentication → URL Configuration → Redirect URLs**

### Login funciona local mas não em produção
**Causa**: Faltou adicionar URL de produção
**Solução**:
1. Adicione `https://seu-app.vercel.app/**` no Google OAuth
2. Adicione `https://seu-app.vercel.app/**` no Supabase Redirect URLs
3. Mude Site URL no Supabase para `https://seu-app.vercel.app`

### Aviso "NEXT_PUBLIC_ with KEY"
**Solução**: Ignore - a `anon key` é pública e segura por design

---

## 🔄 Para adicionar novo domínio custom

Se você configurar domínio customizado no Vercel (ex: `meuapp.com`):

1. **Google OAuth → Authorized redirect URIs**:
   ```
   https://xxxxx.supabase.co/auth/v1/callback
   https://meuapp.com/**
   ```

2. **Supabase → URL Configuration**:
   - **Site URL**: `https://meuapp.com`
   - **Redirect URLs**: Adicione `https://meuapp.com/**`
