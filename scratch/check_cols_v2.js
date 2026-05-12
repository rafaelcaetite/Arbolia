
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = fs.readFileSync('app/.env', 'utf8')
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]

const supabase = createClient(url, key)

async function test() {
  const { data, error } = await supabase.from('services').select('*').limit(1)
  if (error) {
    console.error('Error fetching services:', error)
    // Se não houver serviços, tentamos pegar as colunas via uma query vazia ou algo assim
    const { data: cols, error: err2 } = await supabase.from('services').select('*').limit(0)
    console.log('Columns (empty fetch):', Object.keys(cols?.[0] || {}))
  } else if (data.length > 0) {
    console.log('Columns found:', Object.keys(data[0]))
    console.log('Sample data:', data[0])
  } else {
    console.log('No services found to check columns.')
  }
}

test()
