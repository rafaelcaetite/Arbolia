import urllib.request
import urllib.error
import os

def test_supabase():
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

    # Usando endpoint de healthcheck da Auth
    test_url = f"{url}/auth/v1/health"
    req = urllib.request.Request(test_url, headers={
        "apikey": key,
        "Authorization": f"Bearer {key}"
    })

    try:
        print(f"Tentando Handshake com Supabase: {url}...")
        response = urllib.request.urlopen(req, timeout=10)
        if response.getcode() == 200:
            print("Handshake com Supabase bem sucedido! (Status 200 OK)")
    except urllib.error.HTTPError as e:
        print(f"Falha no Handshake. Codigo HTTP: {e.code}")
    except Exception as e:
        print(f"Erro de conexao: {e}")

if __name__ == "__main__":
    test_supabase()
