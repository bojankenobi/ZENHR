# Blueprint: Project "Cognitive Odyssey"

## 1. Koncept i Vizija

Igra zadržava tvoju **8-bit/16-bit estetiku** sa **CRT scanline efektima** kako bi se kandidat osećao kao da igra nostalgični arkadni naslov, dok sistem u pozadini vrši analizu kognitivnih sposobnosti.

## 2. Mapiranje HR Metrike na Game Mechanic

|**HR Parametar**|**Mehanika u tvojoj igri**|**Tehnička implementacija**|
|---|---|---|
|**Radna Memorija**|Navigacioni kodovi|Modifikacija `LevelSystem.js` najava.|
|**Pažnja**|IFF (Identification Friend or Foe)|Proširenje `EnemySystem.js` i `Enemy.js`.|
|**Multitasking**|System Stabilizers|Novi UI elementi u `ui-layer` unutar `index.html`.|
|**Numerička Obrada**|Smart Power-ups|Modifikacija `Bonus.js` i `BonusSystem.js`.|

---

## 3. Novi Sistemski Moduli (Roadmap)

### Faza 1: Fondacija Analitike (`AnalyticsSystem.js`)

- **Zadatak:** Kreiranje novog modula koji prati `timestamp` svakog bitnog događaja (pucanj, pogodak, greška).
    
- **Integracija:** Povezivanje sa `Game.js` kako bi se podaci prikupljali u realnom vremenu.
    

### Faza 2: Modul za Radnu Memoriju

- **Zadatak:** Pre svakog nivoa u `LevelSystem.js`, prikazati trocifrenu sekvencu.
    
- **Interakcija:** Tokom nivoa, igrač mora da pritisne tastere koji odgovaraju sekvenci kada se pojavi "Memory Prompt".
    

### Faza 3: Selektivna Pažnja

- **Zadatak:** Uvođenje "Civilnih brodova" u `EnemySystem.js`.
    
- **Kazna:** Ako igrač uništi civilni brod, `CollisionSystem.js` beleži pad u "Inhibiciji impulsa", a ne samo gubitak poena.
    

### Faza 4: Matematički Bonusi

- **Zadatak:** Unutar `Bonus.js`, pored tipa (BOMB, SPREAD), dodajemo tekstualnu labelu sa brojem.
    
- **Logika:** Igrač dobija instrukciju: "Pokupi samo parne brojeve".
    

---

## 4. Arhitektura Podataka (Backend Integration)

Kada `Game.js` okine `triggerGameOver()` ili `triggerVictory()`, igra će generisati finalni izveštaj.

JavaScript

```
{
  "session_info": { "user": "Bojan", "duration": "300s" },
  "metrics": {
    "attention_span": 0.92,       // Procenat pogođenih neprijatelja vs civila
    "memory_accuracy": 0.80,     // Tačnost unetih kodova
    "math_speed_avg": "1.2s",    // Vreme potrebno za odluku kod bonusa
    "stress_recovery": "0.5s"    // Vreme reakcije nakon što izgubi HP [cite: 332, 338]
  }
}
```

---

## 5. Tehnološki Stack (Potvrda tvoje osnove)

- **Frontend:** Vanilla JS (tvoj trenutni kod).
    
- **Engine:** Tvoj Custom `Engine.js`.
    
- **Styling:** Tvoj `style.css` sa CRT filterima.
    
- **Novi dodatak:** `fetch` API za slanje rezultata na tvoj Python/FastAPI backend.