# POP 02: Serviços em Massa, Alertas e Laudos

## Objetivo
Padronizar a criação de serviços relacionando N árvores, definir a lógica matemática dos Alertas (Código de Cores) e o fluxo determinístico da geração de PDFs client-side.

## Entradas
- Array `selectedTreeIds`.
- Formulário de Serviço (Tipo, Datas, Cliente).

## Lógica de Execução

### 1. Novo Serviço em Massa (Relacionamento N:M)
Quando o "Salvar" é acionado:
1. **Insert Pai**: `POST` em `servicos`. Retorna o `servico_id` inserido.
2. **Mount Array**: Mapeia `selectedTreeIds` para criar um array de relações: `[{servico_id, arvore_id}, ...]`.
3. **Bulk Insert Filhos**: `POST` na tabela `servico_arvore` com o array.
4. **Limpeza**: Esvazia `selectedTreeIds` e fecha modais.

### 2. Código de Cores Funcional (Lógica Determinística)
O componente de lista de Alertas calculará a diferença entre a data atual e a `data_retorno` de cada serviço:
- `data_retorno` < `hoje` = **🔴 Vermelho (Atrasado)**.
- `data_retorno` entre `hoje` e `hoje + 7 dias` = **🟡 Amarelo (Na Semana)**.
- `data_retorno` entre `hoje + 8 dias` e `hoje + 30 dias` = **🟢 Verde (No Mês)**.

### 3. Geração de Laudo (PDF)
1. **Render Invisível**: A SPA cria a view do laudo em HTML no background (componente hidden) populado com os dados.
2. **Conversão**: `html2pdf.js` transforma esse DOM em um blob PDF na memória RAM.
3. **Storage**: Envia o blob via `POST` multipart para o Supabase Storage (bucket).
4. **Linkagem**: O Supabase devolve a URL pública do PDF. Fazemos um `UPDATE` no registro do serviço, salvando a URL em `documentos_url`.

## Casos de Borda e Prevenção de Erros
- O envio do PDF pode falhar por timeouts. O blob deve ser mantido na memória até que a promessa do Supabase retorne `sucesso`.
- Para evitar serviços "órfãos", o fluxo ideal é fazer o Insert Pai e Filhos via uma **RPC Transaction** no Postgres, garantindo que tudo salva ou tudo é desfeito se houver erro (Rollback).
