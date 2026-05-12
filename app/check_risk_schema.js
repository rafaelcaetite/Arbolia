
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eetwehehxbogmwzcouay.supabase.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVldHdlaGVoeGJvZ213emNvdWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNTgxNDcsImV4cCI6MjA5MzkzNDE0N30.Nk-jk17N3k8ZsNKhQ3SxtorVgUysgoIJhjB1GhTEjlg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Testando inserção de árvore sem risco...');
  const { data, error } = await supabase
    .from('trees')
    .insert({
      especie: 'Teste Schema',
      altura: 10,
      tamanho_copa: 5,
      latitude: 0,
      longitude: 0,
      status_risco: null 
    })
    .select();

  if (error) {
    console.log('ERRO:', error.message);
  } else {
    console.log('SUCESSO: O campo status_risco permite NULL.');
    await supabase.from('trees').delete().eq('id', data[0].id);
  }
}

checkSchema();
