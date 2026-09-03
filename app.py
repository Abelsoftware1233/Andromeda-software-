#!/usr/bin/env python3
"""
Andromeda & Zwart Gat — Live Simulatie backend.

Lichte Flask-app die:
  1. De statische frontend (index.html, script.js) serveert.
  2. Een klein JSON-API endpoint (/api/status en /api/objects) aanbiedt
     met actuele astronomische metadata, zodat de frontend deze kan
     tonen zonder de waarden hard te coderen in JavaScript.

Draait via gunicorn achter nginx (zie deploy.sh en de systemd-unit).
"""

import os
import time
import logging
from flask import Flask, jsonify, send_from_directory

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("andromeda-backend")

# Root van de statische frontend-bestanden (index.html, script.js).
# Standaard: één map boven backend/ (de projectroot).
STATIC_ROOT = os.environ.get(
    "ANDROMEDA_STATIC_ROOT",
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..")),
)

app = Flask(__name__, static_folder=None)

START_TIME = time.time()

# Astronomische data die de backend levert; frontend valt terug op eigen
# ingebakken waarden als deze endpoint niet bereikbaar is (graceful degrade).
ASTRO_DATA = {
    "andromeda_distance_ly": 2_500_000,
    "andromeda_approach_speed_kms": 110,
    "milkyway_andromeda_collision_years": 4_500_000_000,
    "sagittarius_a_distance_ly": 26_000,
    "sagittarius_a_mass_solar": 4_150_000,
    "objects": [
        {"id": "sgr-a", "name": "Sagittarius A*", "distance_ly": 26_000},
        {"id": "andromeda", "name": "Andromedastelsel (M31)", "distance_ly": 2_500_000},
        {"id": "pillars", "name": "Pillars of Creation", "distance_ly": 6_500},
        {"id": "carina", "name": "Cosmic Cliffs (Carinanevel)", "distance_ly": 7_600},
        {"id": "southern-ring", "name": "Southern Ring Nebula", "distance_ly": 2_500},
        {"id": "stephans-quintet", "name": "Stephan's Quintet", "distance_ly": 290_000_000},
        {"id": "wasp-96b", "name": "WASP-96 b", "distance_ly": 1_150},
        {"id": "smacs0723", "name": "SMACS 0723", "distance_ly": 4_240_000_000},
    ],
}


@app.after_request
def add_security_headers(resp):
    """Basale, veilige defaults; nginx voegt eventueel meer toe."""
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["Referrer-Policy"] = "no-referrer-when-downgrade"
    resp.headers["X-Frame-Options"] = "SAMEORIGIN"
    return resp


@app.route("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "uptime_seconds": round(time.time() - START_TIME, 1),
        "service": "andromeda-backend",
    })


@app.route("/api/status")
def status():
    return jsonify(ASTRO_DATA)


@app.route("/api/objects")
def objects():
    return jsonify(ASTRO_DATA["objects"])


@app.route("/api/objects/<object_id>")
def object_detail(object_id):
    match = next((o for o in ASTRO_DATA["objects"] if o["id"] == object_id), None)
    if match is None:
        return jsonify({"error": "not_found", "id": object_id}), 404
    return jsonify(match)


# ---------------------------------------------------------------------
# Statische bestanden (index.html, script.js). In productie kan nginx
# dit ook direct serveren (sneller); deze routes zijn een fallback zodat
# de app ook zelfstandig (bv. tijdens ontwikkeling) volledig werkt.
# ---------------------------------------------------------------------

@app.route("/")
def index():
    return send_from_directory(STATIC_ROOT, "index.html")


@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(STATIC_ROOT, filename)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    log.info("Starting dev server on 0.0.0.0:%s (static root: %s)", port, STATIC_ROOT)
    app.run(host="0.0.0.0", port=port, debug=False)
