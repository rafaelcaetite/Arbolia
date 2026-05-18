# Arbolia - Gestão de Arborização 🌳 (v1.1.0-prod)
> **Status de Deploy:** Integração Supabase + Vercel (Produção Habilitada e Atualizada)

**Sistema Premium de Gestão de Arborização Urbana**

Plataforma web profissional para inventário, monitoramento, conformidade legal e gestão de serviços de arborização — desenvolvida sob medida para engenheiros florestais, agrônomos, técnicos de campo e administradores de manejo arbóreo.

---

## ✨ Funcionalidades e Melhorias Recentes

### 📅 Painel de Cronograma & Agendamentos Inteligentes (Home)
- **Visualização Granular e Dinâmica:** Cronograma de atendimentos pendentes agrupado inteligentemente por proximidade temporal:
  - 🔴 **Atrasados:** Serviços não concluídos anteriores à data atual.
  - 🟢 **Hoje:** Serviços agendados para a data corrente.
  - 🔵 **Amanhã:** Planejamento rápido do dia seguinte.
  - 🟡 **Esta Semana:** Visão tática dos próximos 7 dias.
  - 🟣 **Em Breve:** Planejamento estratégico de médio prazo.
- **Resolução de Datas e Fusos Horários:** Correção estrutural do parser de datas (`YYYY-MM-DD` com timezone local), garantindo que serviços vencidos apareçam estritamente como **Atrasados** e que o fuso horário da máquina do usuário seja 100% respeitado.

### 🔔 Central de Notificações Persistente & Interativa
- **Sino de Alertas no Cabeçalho:** Painel reativo com notificações em tempo real baseadas no status de serviços (atrasos, agendamentos do dia) e no clima.
- **Persistência de Leitura:** Ao clicar em uma notificação, o status **"Lida"** é salvo permanentemente no navegador via `localStorage`. As notificações lidas continuam marcadas como lidas mesmo após atualizar a página (`F5`) ou em novas sessões.
- **Botão de Exclusão Definitiva (X):** Cada notificação possui um botão "X" (exclusão) que a remove imediatamente da UI e salva a ação no `localStorage`. Notificações excluídas **nunca mais** são recriadas no painel daquele dia.

### 🌦️ Monitoramento Meteorológico & Recomendação Operacional Dinâmica (Matriz Composta)
- **Painel Climático Premium:** Integração em tempo real com a API **Open-Meteo**, coletando temperatura, umidade, vento atual, probabilidade de chuva, volume de precipitação (mm) e velocidade de rajadas de vento hora a hora para as próximas 24 horas, além de um painel de previsão de 5 dias.
- **Card de Recomendação Operacional Reativo:** Um painel inteligente analisa automaticamente os riscos meteorológicos usando uma matriz robusta de critérios compostos para a segurança no manejo arbóreo:
  - 🔴 **Condições Críticas (Risco Alto - Fundo Vermelho):** Acionada se rajadas de vento ultrapassarem **45 km/h** OU se a probabilidade de chuva passar de **50%** com volume acumulado superior a **10 mm**. Recomendação técnica: *"Risco alto de temporais ou queda de galhos. Suspenda atividades em altura e evite proximidade com árvores."*
  - 🟠 **Condições Instáveis (Atenção - Fundo Laranja):** Acionada se rajadas de vento ultrapassarem **25 km/h** OU se a probabilidade de chuva passar de **30%** com volume acumulado superior a **2 mm**. Recomendação técnica: *"Condições instáveis. Evite podas de grande porte e escalada. Atenção ao solo escorregadio."*
  - 🟢 **Condições Favoráveis (Fundo Verde):** Condições seguras, abaixo dos limites de atenção. Recomendação técnica: *"Condições favoráveis para manejo arbóreo."*
  - 🔘 **Modo Loading Elegante (Cinza Pulso):** Exibe uma animação elegante em cinza ardósia (`animate-pulse`) enquanto os dados são carregados.
- **Gráficos e Chips com Precisão de Volume:** Integração de volume de precipitação atual diretamente na visualização "Agora" (ex: `0%/0mm`) e nos detalhes do Tooltip interativo ao passar o mouse pelos horários do gráfico (exibe chuva/volume e vento/rajada).

### 👤 Cabeçalho Adaptativo & Saudação Dinâmica
- **Boas-vindas Personalizadas:** A Header identifica a hora exata do sistema operacional do usuário e o cumprimenta de forma apropriada:
  - **Bom dia:** Das 00:00 às 11:59.
  - **Boa tarde:** Das 12:00 às 17:59.
  - **Boa noite:** Das 18:00 às 23:59.
- **Localização de Clima:** Exibição da temperatura local e cidade no cabeçalho em formato premium de pílula translúcida.

---

## 🛠️ Stack Tecnológica

| Tecnologia | Finalidade |
|---|---|
| **React + TypeScript** | Frontend SPA com tipagem estrita para segurança e consistência de dados |
| **Supabase** | Backend Completo (Autenticação JWT, Banco PostgreSQL, Storage de Laudos e Imagens) |
| **Vite + PWA Plugin** | Compilação ultrarrápida, Service Workers ativos e suporte completo para instalação local (App Desktop/Mobile) |
| **Tailwind CSS** | Estilização minimalista e customização visual premium com micro-interações |
| **Zustand** | Gerenciamento de estado global centralizado, reativo e sincronizado com `localStorage` |
| **React Leaflet** | Mapa georreferenciado interativo para marcação e identificação de árvores inventariadas |
| **Lucide React** | Biblioteca de ícones moderna e uniforme em todo o sistema |

---

## 🚀 Rodando localmente

```bash
# 1. Clone o repositório
git clone https://github.com/rafaelcaetite/Arbolia.git
cd arbolia/app

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
# Crie um arquivo .env na pasta /app com as chaves do Supabase:
# VITE_SUPABASE_URL=sua_url_supabase
# VITE_SUPABASE_ANON_KEY=sua_chave_anonima_supabase

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse em `http://localhost:5173` (ou a porta sugerida no terminal).

---

## 📁 Estrutura do Projeto

```
arbolia/
├── app/                    # Aplicação React (Vite)
│   ├── src/
│   │   ├── components/     # Componentes modulares
│   │   │   ├── alerts/     # Modais de alertas, laudo e lembretes
│   │   │   ├── clients/    # Modais e formulários de clientes
│   │   │   ├── inventory/  # Mapa interativo, listagem de árvores, árvore form
│   │   │   └── layout/     # Sidebar de navegação, Header com clima e perfil
│   │   ├── pages/          # Home (Dashboard), Inventário, Clientes, Alertas, Acervo, Log de Atendimentos
│   │   └── store/          # Estado global centralizado (useAppStore.ts)
│   └── public/             # Assets, logos e manifesto PWA
├── architecture/           # POPs (Procedimentos Operacionais Padrão) e arquitetura do projeto
├── .env.example            # Template de variáveis de ambiente do projeto
└── gemini.md               # Constituição do projeto (Esquemas de dados, invariantes e regras)
```

---

## 🗃️ Modelos de Dados (DB Supabase)

Todos os modelos estão estruturados para suportar transições rápidas e consistência bidirecional:
1. **Users/Profiles:** Contém perfis de funcionários com níveis de acesso dinâmicos (`admin`, `tecnico`, `campo`).
2. **Clients:** Cadastro completo de clientes proprietários com CPF/CNPJ e dados de contato.
3. **Trees:** Inventário técnico com coordenadas GPS, espécie, altura, diâmetro da copa, status de atividade e classificação de risco ISA (`baixo`, `medio`, `alto`, `critico`).
4. **Services:** Registro de ordens de serviço (`poda`, `supressao`, `avaliacao`), datas de vencimento/reavaliação e armazenamento em array de anexos por árvore (`attachmentsByTree`).

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
- [ ] Aplicativo móvel para coleta offline de campo

---

> Desenvolvido sob rígidos padrões de design moderno, interfaces translúcidas e alta performance operacional.
