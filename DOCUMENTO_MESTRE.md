# HYBRIDTRACKER - DOCUMENTO MESTRE DE PROJETO
## Criado em: 18/08/2026
## Projeto: HybridTracker Pro - App de Treino para Fitness Racing

---

## 1. VISAO GERAL DO PROJETO

**Nome:** HybridTracker Pro
**Tipo:** PWA (Progressive Web App) - React + TypeScript + Vite + Tailwind CSS
**Publico-alvo:** Atletas de fitness racing (HYROX, DEKA, etc.)
**Monetizacao:** Assinatura via Hotmart

**URLs Importantes:**
- App (Vercel): https://hybridtracker-eight.vercel.app
- Landing Page: https://hybridtracker-eight.vercel.app/vendas
- PWA Instalavel: https://hybridtracker-eight.vercel.app (adicionar a tela inicial)

---

## 2. TECNOLOGIAS UTILIZADAS

| Tecnologia | Versao | Uso |
|------------|--------|-----|
| React | 19 | Framework UI |
| TypeScript | 5.7 | Tipagem |
| Vite | 7.3 | Build tool |
| Tailwind CSS | 3.4 | Estilizacao |
| shadcn/ui | latest | Componentes UI |
| React Router | 7 | Navegacao |
| Lucide React | latest | Icones |
| date-fns | 4 | Manipulacao de datas |

---

## 3. ESTRUTURA DO PROJETO

```
C:\Users\Marcus\Documents\kimi\workspace\hybridtracker-app\
├── public/                    # Assets estaticos
│   ├── logo-hybridtracker.png
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service Worker
│   ├── social-proof-1.png     # Imagens social proof
│   ├── social-proof-2.png
│   └── social-proof-3.png
├── src/
│   ├── App.tsx                # Rotas principais
│   ├── main.tsx               # Entry point
│   ├── App.css                # Estilos globais
│   ├── i18n/
│   │   ├── I18nContext.tsx    # Contexto de idioma (PT/EN/DE)
│   │   └── translations.ts    # Traducoes
│   ├── context/
│   │   ├── AppContext.tsx     # Estado global do app
│   │   └── AuthContext.tsx    # Autenticacao e trial
│   ├── types/                 # Tipos TypeScript
│   ├── pages/
│   │   ├── Home.tsx           # Dashboard principal
│   │   ├── Dashboard.tsx      # Plano semanal
│   │   ├── Benchmarks.tsx     # Cadastro de benchmarks
│   │   ├── Timer.tsx          # Timer de prova
│   │   ├── Recovery.tsx       # Modulo de recuperacao
│   │   ├── Wearables.tsx      # Integracao wearables
│   │   ├── Subscription.tsx   # Planos de assinatura
│   │   ├── Login.tsx          # Tela de login
│   │   ├── LandingPage.tsx    # Landing page de vendas
│   │   └── About.tsx          # Sobre os fundadores
│   ├── components/
│   │   ├── Navigation.tsx     # Navegacao
│   │   └── ui/                # Componentes shadcn/ui
│   └── hooks/                 # Custom hooks
├── dist/                      # Build de producao (deployado no Vercel)
├── hotmart-assets/            # Assets para Hotmart
│   ├── banner-hotmart.png     # Banner 800x450
│   ├── DESCRICAO_HOTMART.txt  # Descricao do produto
│   ├── hotmart-pages-vendas.html # Pagina de vendas HTML
│   ├── GUIA_HOTMART.md        # Guia de configuracao
│   ├── TERMOS_DE_USO.txt      # Termos de uso
│   ├── POLITICA_PRIVACIDADE.txt # Politica de privacidade
│   └── gerar_banner.py        # Script para gerar banner
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 4. FUNCIONALIDADES IMPLEMENTADAS

### 4.1 Core App (PWA)
- [x] **Sistema de i18n:** PT-BR, EN, DE (toggle na navbar)
- [x] **Autenticacao:** Login email/senha, trial de 7 dias
- [x] **Benchmarks:** 8 estacoes + teste de 1600m, calculo VO2max e limiar de lactato
- [x] **Timer de Prova:** 8 blocos com cronometro e alertas de transicao
- [x] **Plano Semanal:** Treinos adaptativos (corrida, forca, metcon, recuperacao, descanso)
- [x] **Modulo de Recuperacao:** Mobilidade, sono, respiracao, contrast bath, check-in de dor
- [x] **Wearables:** Upload de .FIT, .TCX, .GPX (Garmin, Polar, Apple Watch, Samsung)
- [x] **Notificacoes:** Hidratacao, sono, mobilidade matinal, alertas de carga
- [x] **PWA:** Manifest, Service Worker, instalavel, funciona offline
- [x] **Design:** Tema escuro laranja/preto

### 4.2 Landing Page de Vendas
- [x] Hero com video de fundo (YouTube embed)
- [x] Particulas animadas em Canvas
- [x] Social proof (fotos fitness)
- [x] Features (6 cards)
- [x] Como funciona (3 passos)
- [x] Depoimentos (3 cards)
- [x] Oferta mensal (7 dias gratis, primeiro mes R$ 19,90 e depois R$ 49,90/mes)
- [x] FAQ interativo (5 perguntas)
- [x] CTA final com countdown
- [x] Toggle idioma PT/EN/DE
- [x] Links para checkout Hotmart

### 4.3 Tela Sobre (Fundadores)
- [x] Homenagem aos idealizadores da modalidade:
  - Christian Toetzke
  - Moritz Furste
  - Michael Trautmann

---

## 5. PRECIOS E PLANOS

| Plano | Preco | Periodo | Teste Gratis |
|-------|-------|---------|-------------|
| Mensal promocional | R$ 19,90 no primeiro mes; depois R$ 49,90/mes | Recorrente | 7 dias |

**Garantia:** 7 dias incondicional

---

## 6. DEPLOY E HOSPEDAGEM

### Vercel (App PWA)
- **URL principal:** https://hybridtracker-eight.vercel.app
- **Landing:** https://hybridtracker-eight.vercel.app/vendas
- **Status:** Ativo e funcionando
- **Ultimo deploy:** 17/08/2026
- **Dominio Vercel:** hybridtracker-eight.vercel.app

**IMPORTANTE:** O app usa React Router com hash routes. Para funcionar corretamente no Vercel, foi adicionado `vercel.json` com rewrites para SPA:
```json
{
  "rewrites": [{"source": "/(.*)", "destination": "/index.html"}]
}
```

### Hotmart (Vendas e Checkout)
- Conta do usuario: drvsbarbosa1969 (Hobby plan)
- Checkout promocional: https://pay.hotmart.com/D107289174S?off=wsvcmylk
- Pagina externa para compras aprovadas: https://hybridtracker-eight.vercel.app/obrigado
- Assets prontos em: `hotmart-assets/`

### Supabase (Webhook Hotmart)
- Projeto: `whqdmilulzrgewroeymr`
- Funcao publicada: `hotmart-webhook`
- Endpoint: https://whqdmilulzrgewroeymr.supabase.co/functions/v1/hotmart-webhook
- Verificacao JWT: desativada (a funcao valida `x-hotmart-hottok`)
- Pendente: cadastrar os secrets `HOTMART_HOTTOK` e `HOTMART_PRODUCT_ID` no Supabase

---

## 7. ASSETS CRIADOS PARA HOTMART

| Arquivo | Tipo | Dimensao |
|---------|------|----------|
| banner-hotmart.png | Capa/Banner | 800x450px |
| DESCRICAO_HOTMART.txt | Texto | - |
| hotmart-pages-vendas.html | HTML | - |
| TERMOS_DE_USO.txt | Texto | - |
| POLITICA_PRIVACIDADE.txt | Texto | - |
| GUIA_HOTMART.md | Markdown | - |

---

## 8. PROXIMOS PASSOS PENDENTES

### Prioridade ALTA
- [ ] Cadastrar produto na Hotmart (categoria: Apps e Software)
- [x] Configurar precos e planos na Hotmart
- [x] Configurar checkout e pagina externa pos-compra
- [ ] Configurar area de membros
- [x] Conectar os CTAs ao checkout promocional `https://pay.hotmart.com/D107289174S?off=wsvcmylk`
- [ ] Testar fluxo completo: venda -> acesso -> app

### Prioridade MEDIA
- [x] Criar e publicar pagina de obrigado pos-compra em `https://hybridtracker-eight.vercel.app/obrigado`
- [x] Configurar e publicar automacao de boas-vindas no Hotmart Send para a tag `Compra aprovada`
- [ ] Criar conta Instagram/tiktok para o canal dark
- [ ] Gravar video de demonstracao do app
- [ ] Substitituir imagens de stock por fotos reais

### Prioridade BAIXA
- [ ] Implementar sincronizacao automatica com Garmin Connect API
- [ ] Adicionar mais idiomas (ES, FR)
- [ ] Criar versao iOS/Android nativa (Capacitor/Cordova)
- [ ] Implementar leaderboard global
- [ ] Sistema de comunidade/chat entre atletas

---

## 9. DECISOES DE DESIGN E MARCA

### Cores
- Primaria: `#f97316` (orange-500)
- Secundaria: `#ea580c` (orange-600)
- Background: `#0a0a0a` (preto)
- Card: `#171717` (neutral-900)
- Texto: `#ffffff` (branco)
- Texto secundario: `#a3a3a3` (neutral-400)

### Logo
- Simbolo: Infinito (∞) estilizado
- Cores: Laranja gradiente (orange-500 a orange-700)
- Representa as 8 estacoes do HYROX

### Nome
- **HybridTracker** (nome completo)
- **HT** (abreviacao futura)
- Domínio ideal: hybridtracker.app (ainda nao registrado)

---

## 10. INFORMACOES TECNICAS IMPORTANTES

### Build
```bash
npm run build    # Gera dist/
npm run dev      # Servidor de desenvolvimento
```

### Deploy no Vercel
- A pasta `dist/` contem os arquivos prontos para producao
- Para atualizar: fazer novo build e re-deploy da pasta dist/
- O vercel.json ja esta configurado para SPA routing

### Variaveis de ambiente (se necessario futuramente)
- Nenhuma configurada atualmente
- Futuro: API keys para Garmin Connect, Stripe, etc.

---

## 11. CONTEXTO DO CANAL DARK

O usuario planeja criar um canal dark (sem aparecer) no YouTube/Instagram/TikTok sobre HYROX e fitness racing. O app HybridTracker sera o produto principal vendido atraves desse canal.

**Estrategia:**
1. Canal dark com conteudo sobre HYROX
2. Link na bio aponta para landing page (/vendas)
3. Landing page converte para trial de 7 dias
4. Trial converte para assinatura paga
5. Vendas processadas via Hotmart

---

## 12. NOTAS PARA CONTINUIDADE

### Se precisar editar a landing page:
- O arquivo esta em: `src/pages/LandingPage.tsx`
- Usa React + Tailwind + componentes shadcn/ui
- Cores definidas via classe `text-orange-500`, `bg-orange-500`, etc.
- Video de fundo: YouTube embed (atualmente placeholder)

### Se precisar editar o app:
- Rotas em: `src/App.tsx`
- Traducoes em: `src/i18n/translations.ts`
- Estado global em: `src/context/AppContext.tsx`
- Auth em: `src/context/AuthContext.tsx`

### Se precisar atualizar o deploy:
1. Fazer build: `npm run build`
2. A pasta `dist/` e atualizada
3. Re-deploy no Vercel (arrastar pasta dist/)

---

## 13. CONTATO E SUPORTE

Para continuidade do projeto, os arquivos estao em:
```
C:\Users\Marcus\Documents\kimi\workspace\hybridtracker-app\
```

**Documento criado por:** IA Assistant (Kimi)
**Data:** 18/08/2026
**Versao:** 1.0
