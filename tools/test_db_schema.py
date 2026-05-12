import urllib.request
import urllib.error
import json
import os

def test_db_schema():
    # Lê as variáveis do arquivo .env
    env_vars = {}
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    try:
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    k, v = line.strip().split('=', 1)
                    env_vars[k.strip()] = v.strip()
    except Exception as e:
        print(f"Erro ao ler .env: {e}")
        return

    url = env_vars.get("SUPABASE_URL")
    key = env_vars.get("SUPABASE_ANON_KEY")

    if not url or not key:
        print("Erro: Credenciais do Supabase nao encontradas no .env")
        return

    tables = ['profiles', 'clients', 'trees', 'services']
    print(f"Verificando tabelas no Supabase: {url}\n")

    for table in tables:
        test_url = f"{url}/rest/v1/{table}?select=*"
        req = urllib.request.Request(test_url, headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Range": "0-0"
        })

        try:
            response = urllib.request.urlopen(req, timeout=10)
            if response.getcode() == 200:
                print(f"[OK] Tabela '{table}': ACESSIVEL")
            else:
                print(f"[AVISO] Tabela '{table}': Status {response.getcode()}")
        except urllib.error.HTTPError as e:
            if e.code == 404:
                print(f"[ERRO] Tabela '{table}': NAO ENCONTRADA (Verifique se rodou o SQL)")
            elif e.code == 401:
                print(f"[ERRO] Tabela '{table}': AUTENTICACAO FALHOU (Chave invalida)")
            elif e.code == 403:
                print(f"[ERRO] Tabela '{table}': ACESSO NEGADO (RLS bloqueando ou falta de login)")
            else:
                print(f"[ERRO] Tabela '{table}': Erro HTTP {e.code}")
        except Exception as e:
            print(f"[ERRO] Tabela '{table}': Erro de conexao: {e}")


if __name__ == "__main__":
    test_db_schema()
