# ⚔️ Königreich der Ritter — Projektdokumentation

## Überblick

Ein 3D-Browser-Strategiespiel in einer einzigen HTML-Datei. Kein Framework, kein Build-System — alles läuft direkt im Browser via `file://` oder einem lokalen HTTP-Server.

**Datei:** `kingdom-dragons.html` (2046 Zeilen)
**Engine:** Three.js r128 (via cdnjs CDN)
**Sprache:** Reines HTML/CSS/JavaScript (`'use strict'`)

---

## Technischer Stack

| Schicht | Technologie |
|---|---|
| 3D-Rendering | Three.js r128, WebGL, PCFSoftShadowMap, ACESFilmicToneMapping |
| 2D-Overlay | HTML5 Canvas (`#hp-canvas`) für HP-Balken über der 3D-Szene |
| Fonts | Google Fonts: Cinzel, Cinzel Decorative, Crimson Text |
| Assets | Keine externen Assets — alles aus Three.js-Primitiven (Box, Cylinder, Cone, Sphere) |

---

## Szene & Welt

- **Boden:** PlaneGeometry 140×140, 50×50 Segmente, mit leichter Vertex-Displacement für Bodentextur
- **Dreck-Kreis** (Radius 10) um das Zentrum (Burgplatz)
- **Pfad:** 3.5 × 70 großes Rechteck Richtung Süden
- **See:** PlaneGeometry 16×12, semi-transparent, bei (-35, 0, 20)
- **Sterne:** 900 zufällige Points im Bereich ±160, Höhe 30–130
- **Nebel:** FogExp2, Dichte 0.013, passt sich Tag/Nacht an
- **Beleuchtung:**
  - AmbientLight `0x18102a`, Intensität 1.3
  - DirectionalLight (Sonne) `0xffe8cc`, Intensität 2, mit 2048×2048 Shadow Map
  - Fill Light `0x334466`, Intensität 0.5

---

## Baugitter

- **Zellgröße:** `CELL = 2.5` Einheiten
- **Baubereich:** ±9 Zellen in X und Z (d.h. 19×19 Gitter)
- **Zentrum** (±1 Zellen) ist als `'center'` vorbelegt — nicht bebaubar
- **Sichtbares Schachbrettmuster** aus halbtransparenten PlaneGeometries

---

## Startressourcen

```
Holz: 50 | Metall: 30 | Stein: 20 | Nahrung: 40 | Gold: 120
```

---

## Gebäude

Alle Gebäude werden auf dem Gitter platziert. Kosten werden sofort abgezogen.

| Gebäude | Kosten | Effekt / Besonderheit |
|---|---|---|
| Mauer (`wall`) | 5🪵 10🪨 | Blockiert Feinde physisch (Kollision), schadet ihnen auch |
| Turm (`tower`) | 15🪵 12⚙️ 8🪨 | Bogenschütze drin, Reichweite 16, Cooldown ~1.1s |
| Tor (`gate`) | 12🪵 10🪨 8⚙️ | Dekorativ, zwei Türme + Portcullis |
| Burg (`keep`) | 30🪵 20⚙️ 20🪨 | +50 Max-HP & aktuelle HP sofort |
| Kaserne (`barracks`) | 18🪵 12⚙️ 5🪨 | Registriert sich in `barracks[]` (kein aktiver Effekt derzeit) |
| Farm (`farm`) | 10🪵 4🪨 | +3 Nahrung pro Tag |
| Markt (`market`) | 20🪵 10⚙️ 8🪨 | +10 Gold pro Tag |
| Katapult (`catapult`) | 18🪵 15⚙️ | AoE-Schaden (splash 3), Reichweite 6–28, Cooldown 3.5s |
| Kanone (`cannon`) | 10🪵 25⚙️ | AoE-Schaden (splash 2), Reichweite 22, Cooldown 2.8s, greift auch Drachen an (15 Schaden direkt) |
| Schmiede (`smithy`) | 15🪵 20⚙️ 10🪨 | Öffnet Schmiede-Modal bei Interaktion (E) |
| Riesenarmbrust (`crossbow`) | 14🪵 16⚙️ 8🪨 | 500 ATK, 600 HP, kann zerstört werden, greift Feinde UND Drachen an |

---

## Einheiten (Spieler)

Rekrutierung via Modal. Erscheinen in der Nähe des Spielers.

| Einheit | HP | ATK | SPD | Range | Kosten | Besonderheit |
|---|---|---|---|---|---|---|
| Ritter (`knight`) | 300 | 10–20 | 0.09 | 2.5 | 15💰 2🌾/Tag | Greift IMMER an (unbegrenzte Reichweite zum Suchen), auch Drachen |
| Bogenschütze (`archer`) | 150 | 20–30 | 0.055 | 18 | 20💰 3🌾/Tag | Fernkampf, schießt Pfeile |
| Speerkämpfer (`spear`) | 90 | 20 | 0.06 | 3 | 25💰 4🌾/Tag | Nahkampf |
| Kavallerist (`cavalry`) | 150 | 35 | 0.12 | 2.5 | 50💰 8🌾/Tag | Schnellster, greift auch Drachen an |
| Magier (`mage`) | 500 | 450–550 | 0.05 | 14 | 80💰 6🌾/Tag | AoE-Magie (splash 4), PointLight als Orb |

**Steuerung:** Linksklick auf Karte mit ausgewählter Einheit → Einheit bewegt sich zum Ziel.

---

## Ausrüstung (Einheiten)

Jede Einheit kann einmalig ausgerüstet werden (kein Doppelkauf).

| Item | Bonus | Kosten | Für |
|---|---|---|---|
| Stahlschwert | +10 ATK | 25💰 | Ritter, Speerkämpfer |
| Langbogen | +5 Range, +8 ATK | 20💰 | Bogenschütze |
| Eisenspeer | +12 ATK | 22💰 | Speerkämpfer |
| Plattenpanzer | +40 HP | 35💰 | Ritter, Kavallerist, Speerkämpfer |
| Magiermantel | +20 ATK | 45💰 | Magier |
| Pferdepanzer | +60 HP | 40💰 | Kavallerist |

---

## Schmiede-System

Öffnet sich via E-Interaktion in der Nähe eines Schmiede-Gebäudes.

**5 Schwerttypen** (wirken auf alle Ritter, Speerkämpfer, Kavalleristen gleichzeitig):

| Schwert | Kosten | Bonus |
|---|---|---|
| Holzschwert 🪵 | 8🪵 | +5 ATK |
| Steinschwert 🪨 | 10🪨 4🪵 | +12 ATK |
| Eisenschwert ⚙️ | 15⚙️ 5🪵 | +22 ATK |
| Diamantschwert 💎 | 8🪨 20⚙️ 50💰 | +40 ATK |
| Roteisenklinge 🔴 | 30⚙️ 80💰 | +60 ATK, +50 HP |

**3 Schmiede (einmalig anstellen):**

| Schmied | Kosten | Bonus |
|---|---|---|
| Grummel der Lehrling | 40💰 | +0% |
| Thorin der Schmied | 100💰 | +15% |
| Erika Meisterschmied | 200💰 | +30% |

Der Schmied-Bonus multipliziert den ATK-Bonus beim Schmieden.

---

## Natur & Ressourcenquellen

- **65 Bäume** — E zum Abbauen (3 HP), gibt je 1 Holz, schrumpfen beim Abbauen
- **18 Metallerze** — E zum Abbauen (2 HP), gibt 1 Metall
- **10 Steinerze** — E zum Abbauen (2 HP), gibt 1 Stein
- **6 Golderze** — E zum Abbauen (2 HP), gibt 3 Gold
- **6 Kühe** — E für 8 Gold + Dialog (Gold sinkt auf 60% nach jeder Interaktion)
- **8 Schafe** — E für 5 Gold + Dialog
- **3 Händler** — E öffnet Shop-Modal

---

## Händler (Shop-Modal)

| Ware | Kosten |
|---|---|
| 15× Holz | 18💰 |
| 8× Metall | 22💰 |
| 8× Stein | 15💰 |
| 20× Nahrung | 12💰 |
| Burg reparieren (+50 HP) | 40💰 |

---

## Feinde

- Erscheinen am Rand (Radius 50–58) in einem zufälligen Winkel
- Bewegen sich direkt auf Koordinate (0,0) zu (Burgmittelpunkt)
- Schaden an Burg: 4 HP/s bei Distanz < 4.5
- Kollidieren mit Gebäuden: werden zurückgestoßen, verlieren 1.5 HP/s
- **Elite-Feinde** ab Welle 4 (20% Chance): lila Rüstung, rotes Banner, +0.015 Geschwindigkeit, +2 HP Basis, 12+ Welle Gold Belohnung statt 5+

**Skalierung:**
- Geschwindigkeit: `0.045 + waveNum * 0.004`
- HP: `1 + (waveNum-1) * 0.8`
- Anzahl pro Welle: `5 + waveNum * 3`
- Spawn-Intervall: alle 480 ms

**Belohnung pro Kill:** `(elite ? 12 : 5) + waveNum` Gold + 2 Nahrung

---

## Drachen

Ab Welle 3, alle 3 Wellen oder bei Boss-Wellen.

| Typ | HP | ATK | Geschwindigkeit | Skalierung |
|---|---|---|---|---|
| Normaler Drache | 1.000 | 12 | 0.06 | 1.4× |
| Boss-Drache (Welle 5/10/15…) | 2.000 | 25 | 0.04 | 2.2× |

**Verhalten (Zustandsmaschine):**
1. `'fliegt'` — Kreist in Radius 28±5 um die Burg, feuert alle 2.5s (Boss: 1.5s) Feuerbälle
2. `'sturzflug'` — Stürzt auf zufälligen Punkt nahe Burgmitte, verursacht ATK-Schaden an Burg + Einheiten in Radius 5
3. `'rückzug'` — Steigt wieder auf, kehrt nach 3s zu `'fliegt'` zurück

**Feuer-Ziel:** 60% Burg (0,0), 40% Spielerposition ±3
**Feuerschaden:** 8 HP an Burg, 4 HP an Einheiten in Splash-Radius 3.5

**Wer greift Drachen an:**
- Bogenschützen-Türme (Reichweite 20, Cooldown 0.9s, Pfeil-Schaden ×2)
- Kanonen (Reichweite 22, 15 Schaden direkt, Cooldown 2.5s)
- Katapulte (Reichweite 30, 20 Schaden, Cooldown 3s)
- Riesenarmbrust (Reichweite 30, 500 Schaden ×2)
- Ritter & Kavalleristen (nähern sich, Nahkampfschaden)
- Bogenschützen & Magier (Fernkampf, Schaden ×2 bei Treffer)

**Belohnung:** 150 Gold (normal), 400 Gold (Boss)

---

## Projektile

Alle Projektile fliegen in einem Parabelbogen (`arc: true`) mit Mindesthöhe:

| Typ | Geschwindigkeit | Schaden | Splash | Mindesthöhe |
|---|---|---|---|---|
| Pfeil (`arrow`) | 0.55 | 1 | 0 | 2.5 |
| Armbrust-Bolzen (`crossbow`) | 0.70 | 500 | 0 | 3.0 |
| Katapult-Stein (`catapult`) | 0.28 | 3 | 3 | 6 |
| Kanonenkugel (`cannon`) | 0.65 | 4 | 2 | 4 |
| Magie-Kugel (`magic`) | 0.38 | 4 | 4 | 3 |
| Drachenfeuer (`dragonfire`) | 0.55 | 8 | 3.5 | — |

Bogenprojektile drehen sich in Flugrichtung. Bei Treffern gibt es einen Licht-Flash-Effekt.

---

## Tag/Nacht-Zyklus

- **Zykluslänge:** 150 Sekunden = 1 Tag
- **Nacht:** wenn `dayTime > 0.72` oder `dayTime < 0.08`
- Bei Tageswechsel:
  - +5 Gold Basis + 10× Märkte
  - +3× Farmen Nahrung
  - -0.5 Nahrung pro lebender Einheit (aufgerundet)
- Sonnenintensität: 2 (Tag) → 0.2 (Nacht)
- Sonnenfarbe: `0xffe8cc` (Tag) → `0x223366` (Nacht)
- Hintergrund/Nebel: `0x080510` (Tag) → `0x04020a` (Nacht)

---

## Kamera & Steuerung

| Aktion | Steuerung |
|---|---|
| Spieler bewegen | WASD oder Pfeiltasten |
| Kamera drehen | Rechts-Drag |
| Zoom | Mausrad |
| Interagieren | E |
| Bauen platzieren | Linksklick (im Baumodus) |
| Einheit hinschicken | Linksklick (Einheit ausgewählt) |
| Baumodus beenden | Escape |

Kamera-Parameter: `camTheta` (horizontaler Winkel), `camPhi` (0.12–1.3, vertikaler Winkel), `camRadius` (10–70). Orbit immer um Spielerposition.

---

## UI-Struktur

```
#top-bar          — Ressourcen-Chips (Holz/Metall/Stein/Nahrung/Gold/Einheiten) + Tagesanzeige
#unit-list        — Links oben: Liste aller lebenden Einheiten (klickbar zur Auswahl)
#side-panel       — Rechts: Tabs BAUEN | EINHEITEN | INFO
  Bauen           — Königreich-Status (HP, Gebäude, Einheiten, Welle) + Tipp
  Einheiten       — Karten aller Einheiten mit HP/ATK/Zustand + Ausrüsten-Button
  Info            — Steuerungsübersicht + Gebäude-Effekte
#bottom-bar       — Schaltflächen: Modus-Wahl (Bewegen/Bauen) + Rekrutieren + Welle starten
#notif            — Kurze Benachrichtigungen oben mittig (fade in/out, 2.3s)
#banner           — Große Meldungen (Welle, Sieg, Niederlage), 2.8s
#dragon-alert     — Besonderer Drachen-Alarm (rot, 3s)
#hp-canvas        — 2D Canvas-Overlay für HP-Balken
#hint             — Permanente Steuerungshinweise unten links
```

**Modals:**
- `modal-recruit` — Einheitenrekrutierung
- `modal-shop` — Händler-Shop
- `modal-equip` — Einheit ausrüsten
- `modal-smithy` — Schmiede (Tabs: Schwerter / Schmied)

---

## Spielzustand (globale Variablen)

```javascript
res = { wood, metal, stone, food, gold }  // Ressourcen
castleHP = 100, maxHP = 100               // Burg-HP
dayTime = 0.5, dayNum = 1                 // Zeit
waveNum = 1, waveActive = false           // Wellen
enemies[], projectiles[], dragons[]       // Spielobjekte
playerUnits[], selectedUnit              // Eigene Einheiten
buildMode                                 // Aktueller Baumodus
gameOver                                  // Spielende-Flag
```

---

## Registries (Arrays für automatische Systeme)

```javascript
archerTowers[]   // Türme, die automatisch schießen
barracks[]       // Kasernen (Position gespeichert)
farms[]          // Farmen (Tageseinkommen)
markets[]        // Märkte (Tageseinkommen)
catapults[]      // Katapulte mit Rotation
cannons[]        // Kanonen
smithies[]       // Schmieden mit Feuer-PointLight
crossbows[]      // Riesenarmbrüste (haben eigene HP!)
```

---

## Wellenablauf

1. `startWave()` wird manuell ausgelöst (Welle-Button)
2. Gegner werden alle 480ms gespawnt (`n = 5 + waveNum*3`)
3. Bei Welle ≥ 3 und `waveNum % 3 === 0`: Drache nach 3.5s
4. Bei Boss-Welle (`waveNum % 5 === 0`): Boss-Drache nach 2s
5. Welle endet wenn: `alive === 0 && enemies.length === 0 && dragons (alive) === 0`
6. Bonus: `20 + waveNum*10` Gold, dann `waveNum++`

---

## Game Loop (`animate()`)

Reihenfolge pro Frame:
1. Tag/Nacht-Update
2. Spieler-Bewegung (WASD, relativ zur Kamerarichtung)
3. Einheiten-KI (Zielsuche → Bewegung → Angriff → Animation)
4. Feinde-Update (Bewegung → Burgschaden → Gebäudekollision)
5. Drachen-Update (Zustandsmaschine + Gegenangriffe aller Verteidiger)
6. Wellen-Ende prüfen
7. Türme schießen
8. Katapulte schießen + rotieren
9. Kanonen schießen
10. Riesenarmbrüste schießen (Feindberührung → Schaden)
11. Projektile bewegen (Parabelbogen, Treffererkennung, Splash)
12. Tiere animieren (Wandern, Beinwackeln)
13. Schmiede-Feuer flackern
14. Händler wackeln
15. Bäume im Wind schwingen
16. Kamera updaten (Orbit um Spieler)
17. UI periodisch refreshen (jede Sekunde)
18. HP-Balken auf 2D Canvas zeichnen
19. Three.js render

---

## Bekannte Eigenheiten / Bugs

- Drachen-Kollision mit `dragon_dark` Material ist nicht definiert (führt zu einem `undefined`-Fehler beim Wing-Spar-Mesh, der aber nicht abstürzt)
- Katapult schießt direkt aus Position y=1.8 statt von oben
- Bogenschützen-KI: Bei `u.type==='archer'` wird `fireAt` mit `'arrow'` aufgerufen, beim Drachen-Angriff aber fälschlicherweise `u.type==='mage'?'magic':'arrow'` geprüft, obwohl der Zweig für Archer ist
- Einheiten-Nahrungsverbrauch: `-0.5 pro Einheit/Tag` (aufgerundet), kann nicht unter 0 gehen

---

## Nächste Schritte (besprochen)

- [ ] Detailliertere 3D-Figuren (war in Arbeit)
- [ ] Eigener Drache: Ei kaufen → ins Feuer legen → ausbrüten → eigener Drache kämpft für dich
- [ ] Mehrspielerkarte
- [ ] Speichern/Laden (localStorage)
