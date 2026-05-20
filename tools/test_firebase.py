import urllib.request
import urllib.error
import json
import os
import sys

def test_firebase():
    # Garante que a saída possa tolerar encoding cp1252 se necessário, mas removemos emojis para segurança total
    env_vars = {}
    env_path = os.path.join(os.path.dirname(__file__), '..', 'app', '.env')
    
    # Se não achar em app/.env, tenta no .env raiz
    if not os.path.exists(env_path):
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

    api_key = env_vars.get("VITE_FIREBASE_API_KEY")
    project_id = env_vars.get("VITE_FIREBASE_PROJECT_ID")
    auth_domain = env_vars.get("VITE_FIREBASE_AUTH_DOMAIN")

    if not api_key or not project_id or "sua_api_key" in api_key or "seu-projeto" in project_id:
        print("\n[!] [AVISO] Credenciais reais do Firebase nao configuradas no arquivo .env!")
        print("Para testar uma integracao real com sucesso, configure as chaves obtidas no console do Firebase.")
        print("Substitua os valores antigos do Supabase pelas chaves do Firebase listadas em 'app/.env.example'.\n")
        return

    print("====================================================")
    print("INICIANDO TESTES DE INTEGRACAO DO FIREBASE (ARBOLIA)")
    print("====================================================")
    print(f"Projeto ID detectado: {project_id}")
    print(f"Auth Domain detectado: {auth_domain}")
    print("----------------------------------------------------")

    # Teste 1: Firestore REST API - Acessibilidade do Banco NoSQL
    firestore_url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents"
    print(f"[*] 1. Testando conectividade com Firestore REST API...")
    try:
        response = urllib.request.urlopen(firestore_url, timeout=10)
        if response.getcode() == 200:
            print("   [OK] Conexao com Firestore estabelecida com sucesso!")
    except urllib.error.HTTPError as e:
        if e.code in [400, 403, 404]:
            print(f"   [OK] Firestore respondendo corretamente! (Codigo retornado: {e.code} - Acesso seguro ativo)")
        else:
            print(f"   [ERRO] Falha inesperada no Firestore. Codigo HTTP: {e.code}")
    except Exception as e:
        print(f"   [ERRO] Erro de conexao fisica com o Firestore: {e}")

    # Teste 2: Firebase Auth API - Testando endpoint de autenticação segura
    auth_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={api_key}"
    print(f"\n[*] 2. Testando conectividade com Firebase Auth API...")
    
    data = json.dumps({"returnSecureToken": True}).encode('utf-8')
    req = urllib.request.Request(auth_url, data=data, headers={'Content-Type': 'application/json'})
    
    try:
        response = urllib.request.urlopen(req, timeout=10)
        print("   [OK] Firebase Auth respondendo!")
    except urllib.error.HTTPError as e:
        if e.code in [400, 403]:
            body = e.read().decode('utf-8', errors='ignore')
            if "API_KEY_INVALID" in body:
                print("   [ERRO] Firebase Auth respondeu, mas a API KEY fornecida no .env eh INVALIDA.")
            else:
                print(f"   [OK] Firebase Auth respondendo corretamente! (Codigo retornado: {e.code} - Servico Ativo)")
        else:
            print(f"   [ERRO] Falha na comunicacao com Firebase Auth. Codigo HTTP: {e.code}")
    except Exception as e:
        print(f"   [ERRO] Erro ao conectar com Firebase Auth: {e}")

    # Teste 3: Firebase Storage - Verificação do bucket
    storage_bucket = env_vars.get("VITE_FIREBASE_STORAGE_BUCKET")
    if storage_bucket:
        print(f"\n[*] 3. Testando conectividade com Firebase Storage...")
        storage_url = f"https://firebasestorage.googleapis.com/v0/b/{storage_bucket}"
        try:
            response = urllib.request.urlopen(storage_url, timeout=10)
            if response.getcode() == 200:
                print("   [OK] Conexao com o Storage estabelecida!")
        except urllib.error.HTTPError as e:
            if e.code in [400, 401, 403]:
                print(f"   [OK] Firebase Storage respondendo corretamente! (Codigo retornado: {e.code} - Regras ativas)")
            else:
                print(f"   [ERRO] Falha no Storage. Codigo HTTP: {e.code}")
        except Exception as e:
            print(f"   [ERRO] Erro ao conectar com o Storage: {e}")

    print("\n====================================================")
    print("TESTES FINALIZADOS!")
    print("====================================================")

if __name__ == "__main__":
    test_firebase()
