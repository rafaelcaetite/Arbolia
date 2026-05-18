# Arbolia - Gestão de Arborização 🌳 (v1.2.0-prod)
> **Status de Deploy:** Integração Supabase + Vercel (Produção Habilitada, Otimizada e Atualizada)

**Plataforma Premium de Gestão de Arborização Urbana**

Plataforma web de altíssimo nível para inventário georreferenciado, monitoramento em tempo real, conformidade legal e gestão de serviços de arborização. Desenvolvida especificamente sob medida para engenheiros florestais, agrônomos, técnicos de campo e administradores de manejo arbóreo.

---

## ✨ Funcionalidades do Sistema e Recursos Recentes

O Arbolia foi projetado seguindo as melhores práticas globais de UI/UX, combinando componentes translúcidos (*glassmorphism*), micro-interações fluidas e uma robusta engenharia de software baseada em dados relacionais e em tempo real.

### 📅 1. Painel de Cronograma & Agendamentos Inteligentes (Home)
- **Visualização Granular e Dinâmica:** Cronograma de atendimentos pendentes agrupado inteligentemente por proximidade temporal:
  - 🔴 **Atrasados:** Serviços pendentes não concluídos anteriores à data atual.
  - 🟢 **Hoje:** Serviços agendados estritamente para a data corrente.
  - 🔵 **Amanhã:** Planejamento rápido e visual do dia seguinte.
  - 🟡 **Esta Semana:** Visão tática dos próximos 7 dias.
  - 🟣 **Em Breve:** Planejamento estratégico de médio a longo prazo.
- **Resolução de Datas e Fusos Horários:** Tratamento estrutural do parser de datas (`YYYY-MM-DD` com timezone local), garantindo que serviços vencidos apareçam de forma exata e que o fuso horário local seja 100% respeitado.

### 🌦️ 2. Monitoramento Climático e Matriz Composta de Segurança
- **API Open-Meteo Integrada:** Coleta em tempo real de temperatura, umidade, vento atual, probabilidade de chuva, volume de precipitação (mm) e rajadas de vento hora a hora.
- **Auto-complete com Busca Inteligente de Cidades:** Campo de busca com sugestões instantâneas a cada caractere digitado (via geocoding). Conta com um algoritmo inteligente que **prioriza cidades do Brasil** nas primeiras posições.
- **Card de Recomendação Operacional Reativo:** Analisa os riscos meteorológicos usando uma matriz robusta de critérios compostos para a segurança no manejo arbóreo:
  - 🔴 **Condições Críticas (Fundo Vermelho):** Acionada se rajadas de vento ultrapassarem **55 km/h** OU probabilidade de chuva superior a **50%** com volume acumulado acima de **10 mm**. Ação: Paralisação total de campo.
  - 🟠 **Condições Instáveis (Fundo Laranja):** Acionada se rajadas de vento ultrapassarem **40 km/h** OU probabilidade de chuva superior a **30%** com volume acumulado acima de **2 mm**. Ação: Responsável Técnico avalia o local e suspende podas críticas ou uso de cesto aéreo.
  - 🟢 **Condições Favoráveis (Fundo Verde):** Rajadas abaixo de **40 km/h** e chuvas fracas/inexistentes. Ação: Operação normal.
- **Chips e Gráficos Premium:** Integração de volume de precipitação atual na visualização "Agora" (ex: `0%/0mm`) e tooltips interativos ao passar o mouse pelas colunas do gráfico.

### 🌗 3. Modo Escuro Premium (Dark Mode) de Alta Fidelidade
- **Fadiga Visual Mínima:** Paleta calibrada em tons de cinza escuro e preto fosco premium (`#121212` e `#1e1e1e`), evitando tons azulados incômodos e luzes brancas ofuscantes.
- **Logotipo Adaptativo:** O logotipo principal da Sidebar muda automaticamente para a versão branca oficial (`logo_branca.png`) ao ativar o modo escuro.
- **Mapa Dark Mode Reativo:** Sincronização em tempo real do mapa do inventário (Leaflet), trocando os tiles de forma transparente para o **CartoDB Dark All**, com popups, marcadores e botões de controle perfeitamente estilizados em tons escuros.
- **Scrollbars Personalizadas:** Barras de rolagem redesenhadas no `index.css` com trilhos pretos e cursores cinza-escuro discretos que reagem a hover, garantindo homogeneidade visual.
- **Chips e Gráficos Adaptados:** Gráficos da Recharts com grades escuras translúcidas e textos acinzentados legíveis. Os 4 cards de clima (Temperatura, Vento, Chuva, Umidade) ganham fundos pretos foscos com bordas sutis de alto contraste.

### ⚙️ 4. Painel de Configurações Completo e Funcional
- **Configuração de Preferências:**
  - **Alertas Meteorológicos:** Switch interativo e funcional que se conecta diretamente ao perfil do usuário no Supabase.
  - **Frequência de Sincronização:** Definição de intervalos (5, 15, 30 ou 60 minutos) para requisições ao Supabase.
  - **Unidades Climáticas:** Escolha entre Celsius/Fahrenheit e Km/h ou M/s.
  - **Gestão de Cache:** Botão seguro para limpar os dados armazenados em cache local e forçar atualização completa.

### 🚪 5. Confirmação de Saída Minimalista
- **Segurança contra Ações Acidentais:** Ao clicar em "Sair" (LogOut) na Sidebar, um modal moderno de "Tem certeza que deseja sair?" impede desligamentos inesperados, mantendo um design limpo e harmônico com o resto da interface.

### 🔔 6. Central de Notificações Persistente & Interativa
- **Sino de Alertas no Cabeçalho:** Painel reativo com alertas climáticos e de serviços.
- **Persistência de Leitura:** Status "Lida" salvo permanentemente no navegador via `localStorage`.
- **Botão de Exclusão Definitiva (X):** Remove permanentemente a notificação e bloqueia sua recriação no mesmo dia.

### 📄 7. Relatórios Técnicos e Emissão de Laudos de Avaliação de Risco (SaaS Ready)
- **Exportação Multi-Formato:** Suporta exportação completa dos Logs de Atendimento e Inventário para arquivos **CSV** estruturados.
- **Emissão Automática de Laudo de Avaliação de Risco Arbóreo em PDF:**
  - Geração de laudos técnicos em PDF de alta qualidade e diagramação profissional baseados nos padrões internacionais de avaliação de risco (ISA).
  - Inclui dados cadastrais do solicitante, informações biométricas da árvore (altura, diâmetro da copa, coordenadas), nível de risco geral e análises qualitativas completas.
  - Três templates visuais pré-definidos (Técnico, Minimalista e Executivo) que adaptam as cores, cabeçalhos, bordas e layout do PDF de forma instantânea.
  - Integração nativa de assinatura, CREA do técnico e imagens/anexos cadastrados.

---

## 🛠️ Stack Tecnológica

| Tecnologia | Finalidade |
|---|---|
| **React + TypeScript** | SPA moderna com tipagem estrita para segurança de dados |
| **Supabase (PostgreSQL)** | Autenticação JWT, Banco de Dados Relacional, Storage de Laudos e Anexos de Imagem |
| **Vite + PWA Plugin** | Service Workers ativos, precaching de arquivos e suporte offline (Desktop/Mobile) |
| **Tailwind CSS** | Estilização minimalista e customização visual premium com micro-interações |
| **Zustand** | Gerenciamento de estado global centralizado, reativo e sincronizado com `localStorage` |
| **React Leaflet** | Mapas georreferenciados interativos para marcação de árvores inventariadas |
| **Recharts** | Gráficos meteorológicos altamente interativos e com suporte a temas |

---

## 🚀 Como Rodar Localmente

```bash
# 1. Clone o repositório
git clone https://github.com/rafaelcaetite/Arbolia.git
cd arbolia/app

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
# Crie um arquivo .env na pasta /app com suas credenciais do Supabase:
# VITE_SUPABASE_URL=sua_url_supabase
# VITE_SUPABASE_ANON_KEY=sua_chave_anonima_supabase

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

Abra seu navegador em `http://localhost:5173`.

---

## 📁 Estrutura do Projeto

```
arbolia/
├── app/                    # Código-fonte da aplicação React (Vite)
│   ├── src/
│   │   ├── components/     # Componentes modulares
│   │   │   ├── alerts/     # Modais de alertas, laudo e lembretes
│   │   │   ├── clients/    # Modais e formulários de clientes
│   │   │   ├── inventory/  # Mapas, PDFs de Laudo, listas e modais de árvores
│   │   │   └── layout/     # Sidebar, Header com clima, notificações e SettingsModal
│   │   ├── pages/          # Dashboard (Home), Inventário, Clientes, Funcionários, Alertas, Acervo, Histórico
│   │   └── store/          # Estado global centralizado (useAppStore.ts)
│   └── public/             # Assets, logotipos (logo.png, logo_branca.png) e manifesto PWA
├── architecture/           # POPs (Procedimentos Operacionais Padrão)
└── gemini.md               # Constituição do projeto (Schemas de dados, invariantes e regras)
```

---

## 🗃️ Modelagem do Supabase (Banco Relacional)

O Arbolia conta com tabelas normalizadas sob o PostgreSQL do Supabase, garantindo sincronização bidirecional e segurança RLS (*Row Level Security*):
1. **Profiles (Usuários):** Perfis de funcionários com controle de acesso dinâmico por papel (`admin`, `tecnico`, `campo`).
2. **Clientes:** Cadastro de pessoas físicas e jurídicas (CPF/CNPJ) e contatos.
3. **Árvores:** Coordenadas de GPS de precisão (latitude/longitude), espécie, parâmetros biométricos, status de atividade e classificação de risco ISA.
4. **Serviços:** Registro de ordens de serviço (`poda`, `supressao`, `avaliacao`), datas de vencimento/reavaliação e armazenamento em array de anexos por árvore (`attachmentsByTree`).

---

## 📋 Status do Roadmap

- [x] Autenticação com Supabase Auth integrado com perfil de usuário
- [x] Persistência real no banco relacional (Supabase PostgreSQL)
- [x] Suporte completo a PWA (Instalável offline no Windows, Android e iOS)
- [x] Histórico de Árvores Global e Auditoria
- [x] Exportação de dados para relatórios em CSV
- [x] Central de Notificações gerenciável e persistente
- [x] Monitoramento climático reativo com API Open-Meteo
- [x] Relatórios e Laudos em PDF automatizados (SaaS Ready)
- [x] Modo Escuro Premium completo com Mapas e Logo condicional
- [x] Auto-complete inteligente de cidades no clima priorizando o Brasil
- [x] Modal minimalista de confirmação de saída
- [ ] Aplicativo móvel nativo para coleta offline de campo

---
Desenvolvido com o máximo de capricho, interfaces fluidas e rigor de engenharia de software. 🌳🚀
