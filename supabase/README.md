# Backend do HybridTracker

Estrutura preparada para Supabase Auth, preferências de notificações e controle de acesso pela Hotmart.

1. Crie um projeto no Supabase.
2. Execute `schema.sql` no SQL Editor.
3. Copie `.env.example` para `.env.local` e preencha URL e publishable key.
4. Configure os secrets da Edge Function: `SUPABASE_SERVICE_ROLE_KEY`, `HOTMART_HOTTOK` e `HOTMART_PRODUCT_ID`.
5. Publique a função `hotmart-webhook`.
6. Na Hotmart, cadastre a URL da função usando Webhook 2.0.0.

Endpoint publicado: `https://whqdmilulzrgewroeymr.supabase.co/functions/v1/hotmart-webhook`.
O JWT do gateway deve permanecer desativado; a autenticação da Hotmart é validada pelo header `x-hotmart-hottok`.
7. Selecione compra aprovada, completa, cancelada, atrasada, reembolsada, chargeback, expirada e cancelamento de assinatura.

Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` ou `HOTMART_HOTTOK` no frontend ou em variáveis iniciadas por `VITE_`.
