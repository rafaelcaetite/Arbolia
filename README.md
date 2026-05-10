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
- **Monitoramento Climático Premium** — Dashboard meteorológico em tempo real com previsão de 5 dias e análise hora a hora
- **Inteligência Operacional** — Motor de recomendações técnicas baseado em riscos climáticos (poda/supressão)
- **Supressão com Rastreio** — Fluxo de inativação de árvore com registro de motivo obrigatório
- **Anexos por Árvore** — Upload de fotos e PDFs exclusivos por árvore + serviço

---

## 🛠️ Stack

| Tecnologia | Uso |
|---|---|
| React + TypeScript | Frontend SPA |
| Vite | Build tool |
| Tailwind CSS | Estilização |
| Zustand | Gerenciamento de estado |
| React Leaflet | Mapa interativo |
| Recharts | Gráficos meteorológicos de alta performance |
| Lucide React | Ícones |
| React Router | Navegação |
| Open-Meteo API | Fonte de dados climáticos (Real-time) |

---

## 🚀 Rodando localmente

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/arbolia.git
cd arbolia/app

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp ../.env.example ../.env
# Edite o .env com suas credenciais

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse em `http://localhost:5173`

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

- [ ] Autenticação com Supabase Auth
- [ ] Persistência real no banco (Supabase PostgreSQL)
- [ ] Storage de arquivos (Supabase Storage)
- [ ] Relatórios e exportação PDF
- [ ] App mobile (React Native / PWA)

---

> Desenvolvido com foco em UX minimalista e gestão técnica de campo.
