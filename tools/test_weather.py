import urllib.request
import urllib.error
import json
import os

def test_weather():
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

    key = env_vars.get("OPENWEATHER_API_KEY")

    if not key:
        print("Erro: OPENWEATHER_API_KEY nao encontrada no .env")
        return

    # Usando a API de Weather atual para Londres apenas para validar a chave
    test_url = f"http://api.openweathermap.org/data/2.5/weather?q=London&appid={key}&units=metric"
    
    try:
        print("Tentando Handshake com OpenWeather API...")
        req = urllib.request.Request(test_url)
        response = urllib.request.urlopen(req, timeout=10)
        
        if response.getcode() == 200:
            data = json.loads(response.read().decode('utf-8'))
            print("Handshake com OpenWeather bem sucedido! (Status 200 OK)")
            print(f"Temperatura validada: {data['main']['temp']} graus Celsius em London.")
    except urllib.error.HTTPError as e:
        print(f"Falha no Handshake. Codigo HTTP: {e.code}")
        try:
            err_data = json.loads(e.read().decode('utf-8'))
            print(f"Erro da API: {err_data.get('message')}")
        except:
            pass
    except Exception as e:
        print(f"Erro de conexao: {e}")

if __name__ == "__main__":
    test_weather()
