# 🌳 Arbolia

**Sistema de Gestão de Arborização Urbana**

Plataforma web para inventário, monitoramento e gestão de serviços de arborização — desenvolvida para equipes técnicas de poda, supressão e avaliação de árvores.

---

## ✨ Funcionalidades

- **Inventário Interativo** — Mapa com pins clicáveis, lista de árvores com filtros e agrupamentos
- **Gestão de Serviços** — Agendamento de podas, supressões e avaliações com histórico por árvore
- **CRM de Clientes** — Cards com badges de árvores, agendamentos e documentos vinculados
- **Alertas Inteligentes** — Dashboard de vencimentos agrupados por período (esta semana, 30 dias, em breve)
- **Acervo Documental** — Galeria de fotos e repositório de PDFs com busca por tags automáticas
- **Login Seguro** — Sistema de autenticação via Supabase com perfis técnicos e níveis de acesso
- **Software Instalável (PWA)** — O sistema pode ser instalado no Windows, Android e iOS com ícone próprio
- **Persistência em Nuvem** — Integração total com Supabase para sincronização de dados em tempo real
- **Monitoramento Climático Premium** — Dashboard meteorológico em tempo real com previsão de 5 dias e análise hora a hora

---

## 🛠️ Stack

| Tecnologia | Uso |
|---|---|
| React + TypeScript | Frontend SPA |
| Supabase | Backend (Auth, Database, Storage) |
| Vite + PWA Plugin | Build tool e suporte a modo offline/instalável |
| Tailwind CSS | Estilização Minimalista |
| Zustand | Gerenciamento de estado global |
| React Leaflet | Mapa interativo |

---

## 🚀 Rodando localmente

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/arbolia.git
cd arbolia/app

# Instale as dependências
npm install

# Configure as variáveis de ambiente
# Crie um arquivo .env na pasta /app com:
# VITE_SUPABASE_URL=sua_url
# VITE_SUPABASE_ANON_KEY=sua_chave_anon

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse em `http://localhost:5173` (ou porta sugerida pelo Vite)

---

## 📁 Estrutura do Projeto

```
arbolia/
├── app/                    # Aplicação React (Vite)
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   │   ├── alerts/     # Modais de alertas e lembretes
│   │   │   ├── clients/    # Cards e modais de clientes
│   │   │   ├── inventory/  # Mapa, lista, modais de árvore
│   │   │   └── layout/     # Sidebar, Header, MainLayout
│   │   ├── pages/          # Páginas: Home, Inventário, Clientes, Alertas, Acervo
│   │   └── store/          # Estado global com Zustand
│   └── public/             # Assets estáticos
├── architecture/           # Documentação técnica do sistema
├── .env.example            # Template de variáveis de ambiente
└── gemini.md               # Constituição do projeto (schemas e regras)
```

---

## 🗃️ Modelos de Dados

Definidos em `gemini.md` e implementados em `app/src/store/useAppStore.ts`:

- **Users** — Controle de acesso por role (`admin`, `tecnico`, `campo`)
- **Clients** — Clientes com CPF/CNPJ, email e telefone
- **Trees** — Inventário com geolocalização, risco e status de atividade
- **Services** — Serviços com anexos por árvore (`attachmentsByTree`)

---

## 📋 Roadmap

- [x] Autenticação com Supabase Auth
- [x] Persistência real no banco (Supabase PostgreSQL)
- [x] Software instalável (PWA)
- [x] Histórico Global e Auditoria
- [x] Exportação de dados (CSV/Excel)
- [ ] Relatórios em PDF automatizados (SaaS Ready)
- [ ] App mobile nativo (React Native)


---

> Desenvolvido com foco em UX minimalista e gestão técnica de campo.
