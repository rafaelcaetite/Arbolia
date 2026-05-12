import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eetwehehxbogmwzcouay.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVldHdlaGVoeGJvZ213emNvdWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNTgxNDcsImV4cCI6MjA5MzkzNDE0N30.Nk-jk17N3k8ZsNKhQ3SxtorVgUysgoIJhjB1GhTEjlg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testInsert() {
  console.log('Testando inserção de árvore (Debug Mode)...')
  
  // Testando com o esquema mínimo absoluto da Constituição
  const treeData = {
    especie: 'Debug Arbolia',
    altura: 12.5,
    tamanho_copa: 6.2,
    latitude: -19.9167,
    longitude: -43.9345,
    status_risco: 'medio',
    data_cadastro: new Date().toISOString()
  }

  console.log('Dados:', JSON.stringify(treeData, null, 2))

  const { data, error } = await supabase
    .from('trees')
    .insert([treeData])
    .select()

  if (error) {
    console.error('--- ERRO DETECTADO ---')
    console.error('Mensagem:', error.message)
    console.error('Detalhes:', error.details)
    console.error('Código:', error.code)
    console.error('----------------------')
  } else {
    console.log('--- SUCESSO! ---')
    console.log('ID Gerado:', data[0]?.id)
    console.log('Dados salvos:', data[0])
  }
}

testInsert()
