# POP 01: Sincronização Mapa ↔ Lista e CRUD Base

## Objetivo
Garantir que a renderização das árvores no Mapa (Leaflet + CartoDB) e na Lista lateral seja bidirecional de forma instantânea (sem reload), gerenciando o estado local paralelamente ao banco de dados Supabase.

## Entradas
- Supabase REST API (Tabela `arvores`, `clientes`).
- Interações do usuário: `onClick`, `onMouseEnter`, `onMouseLeave`.

## Lógica de Execução

### 1. Estado Global (Zustand/Context)
O Frontend deve manter um estado reativo único:
- `trees`: Array de objetos carregados do banco.
- `hoveredTreeId`: UUID (ou null). Define qual árvore recebe highlight por *hover*.
- `selectedTreeIds`: Array de UUIDs. Define árvores ativamente selecionadas (click).

### 2. Bidirecionalidade (O Handshake UI)
- **Hover na Lista**: Dispara `setHoveredTreeId(id)`. O componente do mapa reage alterando o ícone do marker para uma versão destacada.
- **Hover no Marker (Mapa)**: Dispara `setHoveredTreeId(id)`. A lista aplica classe CSS de highlight (ex: border colorida ou fundo destacado).
- **Click**: Adiciona/remove o ID do array `selectedTreeIds`.

### 3. Lógica do Botão "Gerenciar"
- Um observador acompanha `selectedTreeIds.length`.
- Se `length === 0`: Botão fica cinza e desativado.
- Se `length > 0`: Botão recebe a cor primária, destrava, e o clique abre o Modal de Serviços em Massa.

### 4. CRUD Base (Cadastros)
- **POST**: Modal preenchido -> Supabase `insert` -> Sucesso (201) -> UI faz transição do formulário para o quadrado verde com check sem piscar -> Atualiza `trees` no estado local.
- **DELETE**: Confirmação -> Supabase `delete` -> Remove de `trees` -> Pin some instantaneamente do mapa.

## Casos de Borda e Prevenção de Erros
- Se a rede cair no POST, manter o estado local intacto e exibir alerta visual de falha.
- Árvores sobrepostas (mesma coordenada) podem ser difíceis de clicar no Leaflet. Usar clusterização caso o volume cresça.
