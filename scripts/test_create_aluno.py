import json
import urllib.request
import urllib.error

url = 'http://localhost:8000/alunos'
data = {
    'nome': 'Teste via script',
    'data_nascimento': '2010-05-10',
    'email': 'script@test.com',
    'status': 'ativo',
    'turma_id': 1
}

req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'}, method='POST')
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        print('status', resp.status)
        print(resp.read().decode())
except urllib.error.HTTPError as e:
    print('HTTPError', e.code)
    try:
        print(e.read().decode())
    except Exception:
        pass
except Exception as e:
    print('Error', e)
