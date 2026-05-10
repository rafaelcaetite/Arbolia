# Constituição do Projeto (Gemini)

*Mapa do Projeto e Rastreamento de Estado. Este documento contém as leis imutáveis do projeto.*

## Esquemas de Dados (Schemas)

Os payloads de Entrada/Saída e a modelagem do Banco de Dados Relacional (ex: Supabase/PostgreSQL) são definidos abaixo:

### 1. Usuários (Users)
```json
{
  "id": "uuid",
  "nome": "string",
  "email": "string",
  "role": "enum('admin', 'tecnico', 'campo')",
  "data_cadastro": "timestamp"
}
```

### 2. Clientes (Clients)
```json
{
  "id": "uuid",
  "nome": "string",
  "documento": "string (CPF/CNPJ)",
  "email": "string",
  "telefone": "string",
  "data_cadastro": "timestamp"
}
```

### 3. Árvores / Inventário (Trees)
```json
{
  "id": "uuid",
  "especie": "string",
  "altura": "float",
  "tamanho_copa": "float",
  "latitude": "float",
  "longitude": "float",
  "status_risco": "enum('baixo', 'medio', 'alto', 'critico')",
  "data_cadastro": "timestamp"
}
```

### 4. Serviços (Services)
```json
{
  "id": "uuid",
  "cliente_id": "uuid",
  "tipo": "enum('poda', 'supressao', 'avaliacao')",
  "data_vencimento": "timestamp",
  "data_retorno": "timestamp",
  "status": "enum('atrasado', 'na_semana', 'no_mes', 'concluido')",
  "documentos_url": ["string (URLs do Bucket S3/Supabase)"]
}
```

### 5. Serviço_Árvore (Relacionamento Many-to-Many)
```json
{
  "servico_id": "uuid",
  "arvore_id": "uuid"
}
```

### 6. Payloads de Frontend (SPA)
- **Cadastros (Árvore/Cliente):** `POST` JSON para o Banco. Sucesso resulta em transição para o estado "check" verde.
- **Novo Serviço em Massa:** `POST` JSON com os dados do Serviço e a lista de `arvore_ids` associadas ao cliente.
- **Deletar Árvore:** `DELETE` usando `arvore_id`. Remoção imediata do frontend.
- **Editar Árvore:** `UPDATE` usando JSON da entidade modificada.

## Regras Comportamentais

1. **Controle de Acesso Dinâmico:** A barra lateral altera opções baseando-se no nível de permissão (role) do usuário logado.
2. **UX Minimalista e Fluida:** Formulários retangulares verticais flutuantes com cantos arredondados. Sem page reloads; fluxos através de transformações de componentes (Modal Serviço -> Modal Seleção Cliente -> Modo Seleção Mapa).
3. **Feedback Visual Imediato:** Cadastros bem sucedidos devem transicionar o form para um quadrado verde com check sem piscar a tela.
4. **Sincronização Visual Dupla (Bidirecional):** Click/Hover na lista destaca o pin do mapa e vice-versa.
5. **Bloqueio de UI Lógico:** Botão "Gerenciar Árvore" padrão: desativado/cinza. Ativa/colorido apenas com ≥ 1 árvore selecionada no mapa/lista.
6. **Código de Cores Funcional (Alertas):**
   - 🔴 **Vermelho:** Atrasado
   - 🟡 **Amarelo:** Vence nesta semana
   - 🟢 **Verde:** Vence no próximo mês
7. **Ordenação Padrão:** Listas em LIFO (mais recentes primeiro) com filtros rápidos pré-engatilhados (cliente, mês, data retorno).

## Invariantes Arquiteturais
- **Arquitetura A.N.T.**: O sistema obedece estritamente às 3 camadas (Architecture, Navigation, Tools).
- **Sem achismos**: A lógica de negócio é descrita determinísticamente em POPs dentro de `architecture/` antes do código.
- **Ferramentas Atômicas**: Scripts em `tools/` são isolados e não tomam decisões de roteamento.
