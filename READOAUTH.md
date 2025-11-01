# Google OAuth + Supabase

## 1. Supabase - Pegar Callback URL

1. https://supabase.com/dashboard → seu projeto
2. **Authentication → Providers**
3. Clique em **Google**
4. Copie a **Callback URL**: `https://xxxxx.supabase.co/auth/v1/callback`

---

## 2. Google Cloud Console

1. https://console.cloud.google.com
2. Crie/selecione projeto
3. **APIs & Services → Credentials**
4. **Create Credentials → OAuth client ID**
5. Configure Consent Screen se pedido (External, preencha nome/emails)
6. **Application type:** Web application
7. **Authorized redirect URIs:** Cole a Callback URL do Supabase
   ```
   https://xxxxx.supabase.co/auth/v1/callback
   ```
8. **Create**
9. Copie **Client ID** e **Client Secret**

⚠️ **Importante:** Adicione APENAS a callback URL do Supabase, não a URL do seu app

---

## 3. Supabase - Configurar Provider

1. **Authentication → Providers → Google**
2. Toggle **Enable**
3. Cole **Client ID** e **Client Secret**
4. **Save**

---

## 4. Supabase - Configurar URLs de Redirect

1. **Authentication → URL Configuration**
2. **Site URL:** `https://seu-app.vercel.app` (ou localhost para dev)
3. **Redirect URLs:** Adicione `https://seu-app.vercel.app/*`
4. **Save**

⚠️ Não use a URL da dashboard do Vercel (vercel.com/...), use a URL do seu app publicado

---

## 5. Supabase - Pegar Credenciais do Projeto

1. **Project Settings → API**
2. Copie **Project URL** e **anon public key**

---

## 5. Next.js - Criar .env.local

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

⚠️ Adicione `.env*.local` ao `.gitignore`

---

## Deploy Vercel

### 1. Google Console - Adicionar URL de Produção

**Credentials → Authorized redirect URIs:**

Adicione:
```
https://xxxxx.supabase.co/auth/v1/callback
https://seu-app.vercel.app
```

### 2. Vercel - Configurar Variáveis de Ambiente

1. **Project Settings → Environment Variables**
2. Adicione:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://xxxxx.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = sua anon key
3. ⚠️ Ignore aviso sobre `NEXT_PUBLIC_` com `KEY` - a anon key é pública e segura
4. **Deployments → Redeploy** (último deploy → ⋯ → Redeploy)
5. Aguarde ~30s e teste
