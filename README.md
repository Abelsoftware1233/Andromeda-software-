# Zwart Gat & Andromeda — Live 3D Simulatie

Volledig 3D (WebGL/Three.js) interactieve simulatie van:
- **Sagittarius A\***, het zwarte gat in het centrum van de Melkweg (event horizon, gloeiende accretieschijf, gravitationele lensing-effect).
- Het **Andromedastelsel (M31)**, met echte spiraalstructuur, dat werkelijk naar de Melkweg beweegt (110 km/s) en over ~4,5 miljard jaar zal versmelten.
- Zes iconische **JWST-waarnemingen**: Pillars of Creation, Cosmic Cliffs (Carinanevel), Southern Ring Nebula, Stephan's Quintet, WASP-96b en SMACS 0723.

Elk object heeft een **permanent zichtbaar, klikbaar naamlabel** met de werkelijke afstand in lichtjaar. Klikken opent een infopaneel met feiten; "Vlieg naar dit object" beweegt de camera er in 3D naartoe. Vrij zoomen/pannen/draaien via muis of touch (pinch-to-zoom).

## Bestanden

```
index.html                          – frontend (UI, labels, panelen)
script.js                           – 3D-simulatie (Three.js)
backend/app.py                      – Flask API (astronomische metadata)
backend/requirements.txt            – Python dependencies
backend/andromeda-backend.service   – systemd unit
nginx/andromeda.conf                – nginx server-config voor andromeda.abelsoftware123.com
deploy.sh                           – installatiescript (systemd + nginx + certbot)
```

## Lokaal draaien

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
ANDROMEDA_STATIC_ROOT=.. python3 app.py
```

Open daarna `http://localhost:8000`.

De frontend werkt overigens ook volledig standalone (gewoon `index.html` openen) —
de backend-koppeling in `script.js` faalt dan stil en de simulatie gebruikt de
ingebakken astronomische waarden.

## Deployen op een server (andromeda.abelsoftware123.com)

Vereisten:
- Een Ubuntu/Debian-server met root-toegang.
- Het DNS A-record van `andromeda.abelsoftware123.com` dat al naar het IP van deze server wijst (nodig voor certbot/TLS).

```bash
sudo ./deploy.sh
```

Dit script (idempotent — veilig opnieuw te draaien):
1. Maakt een systeemgebruiker `andromeda` aan.
2. Kopieert de app naar `/opt/andromeda`.
3. Zet een Python-venv op en installeert Flask/gunicorn.
4. Installeert en start de systemd-service `andromeda-backend` (gunicorn op `127.0.0.1:8000`).
5. Plaatst de nginx-server `andromeda` (`/etc/nginx/sites-available/andromeda`) die de frontend direct serveert en `/api/` doorstuurt naar de backend.
6. Vraagt (optioneel, met bevestiging) een Let's Encrypt TLS-certificaat aan via certbot.

Omgevingsvariabelen voor `deploy.sh`:
- `CERTBOT_EMAIL` — e-mailadres voor Let's Encrypt (default: `admin@abelsoftware123.com`).
- `SKIP_TLS=true` — sla de certbot-stap over (bijv. als DNS nog niet live is).

## Beheer na deploy

```bash
systemctl status andromeda-backend      # status bekijken
systemctl restart andromeda-backend     # herstarten
journalctl -u andromeda-backend -f      # live logs
sudo nginx -t && sudo systemctl reload nginx   # nginx-config herladen
```

## Bronnen voor de astronomische gegevens

Afstanden en feiten zijn gebaseerd op publieke NASA/ESA/STScI-publicaties
rond de JWST Early Release Observations (juli 2022) en de Pillars of
Creation NIRCam-opname (oktober 2022).
