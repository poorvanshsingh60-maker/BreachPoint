import urllib.request
import json

req = urllib.request.Request(
    'http://localhost:8000/simulate',
    data=json.dumps({'lat': 30.41, 'lng': 79.7, 'breachWidth': 150, 'breachTime': 0.1, 'waterLevel': 100}).encode(),
    headers={'Content-Type': 'application/json'}
)

try:
    urllib.request.urlopen(req)
    print("Success")
except Exception as e:
    print(e.read().decode())
