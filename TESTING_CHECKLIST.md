# Checklista för 2D och 3D-funktionalitet

## 1. 2D Canvas Funktionalitet

### 1.1. Symbolbibliotek och Objektplacering:

- **Dra och Släpp - Etablering:**
  - [ ] Bod
  - [ ] WC
  - [ ] Kontor
- **Dra och Släpp - Logistik:**
  - [ ] Container 10m³
  - [ ] Container 30m³
  - [ ] Tippcontainer (Öppen)
  - [ ] Infart
  - [ ] Parkering
  - [ ] Upplag
  - [ ] Lossnings-/Lastzon
  - [ ] Vändplan
- **Dra och Släpp - Säkerhet:**
  - [ ] Första Hjälpen
  - [ ] Hjärtstartare
  - [ ] Återsamlingsplats
  - [ ] Brandsläckare
  - [ ] Brandpost
  - [ ] Ögondusch
- **Dra och Släpp - Miljö:**
  - [ ] Miljöstation
  - [ ] Farligt Avfall
- **Dra och Släpp - Utrustning:**
  - [ ] Kran (med riskzons-cirkel)
  - [ ] Elcentral
  - [ ] Vatten (utkastare/post)
  - [ ] Belysningsmast
  - [ ] Gas
- **Dra och Släpp - Skyltar & Hänvisning:**
  - [ ] Utrymningspil
  - [ ] Varningsskylt
  - [ ] Förbudsskylt
  - [ ] Påbudsskylt (Skyddsutrustning)
  - [ ] Parkering Förbjuden
- **Placering av objekt:** Kontrollera att objekt hamnar korrekt under muspekaren vid klick.

### 1.2. Ritverktyg:

- [ ] **Linjeverktyg (Gångväg):** Rita, avsluta (högerklick/enter), och avbryta (ESC).
- [ ] **Linjeverktyg (Staket):** Rita, avsluta, och avbryta.
- [ ] **Linjeverktyg (Byggtrafik):** Rita, avsluta, och avbryta.
- [ ] **Yt-verktyg (Schakt):** Rita rektangel, kontrollera fyllning och kantlinje.
- [ ] **Textverktyg:** Lägga till, redigera och flytta text.
- [ ] **Ritpenna:** Rita fritt, kontrollera att linjen sparas som ett objekt.
- [ ] **Grind:** Placera grind på ett ritat staket.

### 1.3. Objektinteraktion:

- [ ] **Markering:** Klicka för att markera ett objekt (visuell feedback).
- [ ] **Avmarkering:** Klicka utanför objekt för att avmarkera.
- [ ] **Flytta:** Markera och dra objekt till ny position.
- [ ] **Rotation:** Markera och rotera objekt.
- [ ] **Skalning/Storleksändring:** Markera och ändra storlek på objekt (där det är applicerbart, t.ex. Schakt).
- [ ] **Radera:** Markera ett objekt och radera med Delete/Backspace.
- [ ] **Dubbelklick:** Kontrollera att dubbelklick på objekt inte orsakar oönskat beteende (t.ex. buggar).
- **Ångra/Gör om (Undo/Redo):**
  - [ ] Ångra placering av objekt.
  - [ ] Ångra flytt/rotation/skalning.
  - [ ] Ångra radering.
  - [ ] Testa "Gör om" för alla ovanstående.

### 1.4. Projektinformation och Exportera:

- **Projektinformation:**
  - [ ] Hitta och fylla i fälten: Företagsnamn, Projektnamn, Projektnummer, etc.
  - [ ] Kontrollera att informationen är synlig/sparad i gränssnittet.
- **Spara Projektfil (.apd):**
  - [ ] Spara ett projekt med flera olika objekt-typer.
  - [ ] Rensa projektet.
  - [ ] Ladda in den sparade .apd-filen och verifiera att allt återställs korrekt.
- **Exportera som PDF/Bild:**
  - [ ] Generera export.
  - **Visuell Kontroll (PDF/Bild):**
    - [ ] Är bakgrundsbilden med?
    - [ ] Är alla utplacerade 2D-objekt synliga och korrekt renderade?
    - [ ] Är alla ritade linjer/ytor (staket, schakt etc.) med?
    - [ ] Är projektinformationen (namn, nr, etc.) korrekt med i exporten?
    - [ ] Är förteckningen (legend) på högersidan korrekt?
    - [ ] Räknar den antalet av varje objekt-typ korrekt?
    - [ ] Visar den korrekta ikoner och namn?
    - [ ] Är eventuell logotyp synlig?

## 2. 3D Funktionalitet

### 2.1. Visuell Representation:

- [ ] **Växla till 3D-vy:** Knappen fungerar och byter till 3D-läge.
- [ ] **Laddning:** Laddningsskärmen visas korrekt och 3D-vyn startar utan fel.
- [ ] **Bakgrund:** 2D-bakgrundsbilden visas som ett plan i 3D-vyn.
- **Objekt-rendering:**
  - [ ] Gå igenom alla objekt från 2D-biblioteket.
  - [ ] Kontrollera att varje objekt har en korrekt och visuellt tilltalande 3D-modell.
  - [ ] Verifiera att modellen är placerad och roterad enligt 2D-objektets position.
- **Särskild kontroll:**
  - [ ] Kranar (ser de ut som kranar?)
  - [ ] Bodar, kontor (korrekt skala och utseende?)
  - [ ] Staket, gångvägar (renderas de som linjer/staket i 3D?)
  - [ ] Schakt (renderas det som en nedsänkning eller markerad yta?)
- [ ] **Inga visuella buggar:** Leta efter flimmer, Z-fighting (objekt som blinkar igenom varandra), eller felaktiga texturer.

### 2.2. Interaktion och Stabilitet i 3D:

- **Navigering:**
  - [ ] Panorera (Pan): Flytta kameran i sidled.
  - [ ] Zooma: Zooma in och ut (scrollhjul).
  - [ ] Rotera/Orbitera: Rotera kameran runt scenen.
- **Stresstest:**
  - [ ] Placera ett stort antal objekt (>50) i 2D och växla till 3D. Kontrollera prestanda (FPS).
  - [ ] Växla snabbt mellan 2D och 3D-vy flera gånger.
- **Stabilitet (Krasch-test):**
  - [ ] Dubbelklicka: Dubbelklicka på olika 3D-objekt.
  - [ ] Dubbelklicka: Dubbelklicka på bakgrundsplanet.
  - [ ] Dubbelklicka: Dubbelklicka i "tomma luften".
- [ ] Kontrollera webbläsarens konsol för felmeddelanden under alla 3D-operationer.
- **Objektinteraktion i 3D (om implementerat):**
  - [ ] Finns det möjlighet att markera/flytta objekt direkt i 3D? Om ja, testa detta.
  - [ ] Uppdateras ändringar gjorda i 3D tillbaka till 2D-vyn?