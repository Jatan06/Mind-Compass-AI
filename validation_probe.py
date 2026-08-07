import requests
import time
import json

base = 'http://127.0.0.1:8000'

print('Backend probe start')
for path in ['/api/auth/login/', '/api/auth/register/']:
    try:
        t0 = time.perf_counter()
        r = requests.get(base + path, timeout=5)
        dt = (time.perf_counter() - t0) * 1000
        print(path, r.status_code, round(dt, 2), r.text[:200])
    except Exception as e:
        print(path, 'ERR', e)
