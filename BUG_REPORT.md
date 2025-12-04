
# BUGGRApport & Åtgärdsplan: ByggPilot APD Maker

**Datum:** 2024-07-26
**Granskare:** Senior Tech Lead & UX Expert

## Sammanfattning

Kodbasen har granskats enligt "GUBBE-SÄKRAD"-principerna. Flera kritiska fel har identifierats som leder till instabilitet, prestandaproblem och trasig funktionalitet. Denna rapport detaljerar felen och föreslår en prioriterad åtgärdsplan.

---

## 1. Kritiska Fel (Severity 1 - Måste Åtgärdas)

### 1.1 Minnesläcka & Grafikfel i 3D-vyn
- **Fil:** `src/components/3d/ThreeDView.tsx`
- **Problem:** Komponenten skapar 3D-objekt men tar aldrig bort dem från grafikminnet. Varje gång ett objekt ändras eller vyn byts, ligger de gamla objekten kvar osynligt.
- **Konsekvens:** Leder till visuella buggar ("sträck överallt"), sjunkande prestanda över tid, och slutligen en krasch av applikationen. Bryter mot **Stabilitetsregel #3**.
- **Åtgärd:** Implementera "cleanup"-logik. Använd en `useEffect`-hook i `ThreeDObject`-komponenten för att anropa `dispose()` på geometrier och material när komponenten tas bort.

### 1.2 Trasig Objektlista i Förteckningen
- **Fil:** `src/components/legend/LegendPanel.tsx`
- **Problem:** Koden som automatiskt räknar objekten på ritningen kraschar eftersom den försöker läsa en egenskap (`obj.label`) som inte existerar.
- **Konsekvens:** Förteckningen ("Legend") är alltid tom, vilket gör en kärnfunktion oanvändbar och förvirrande.
- **Åtgärd:** Korrigera egenskapen från `obj.label` till `obj.item.name` i `useMemo`-hooken.

### 1.3 Allvarlig Prop-konflikt för Förteckning
- **Fil:** `src/App.tsx` och `src/components/legend/LegendPanel.tsx`
- **Problem:** `App.tsx` skickar en uppsättning `props` (t.ex. `projectInfo`) till `LegendPanel`-komponenten, men komponenten förväntar sig helt andra `props` (t.ex. `onClose`).
- **Konsekvens:** Detta indikerar ett allvarligt instabilt tillstånd i koden som borde orsaka en krasch. Att det inte gör det tyder på att fel ignoreras under bygget.
- **Åtgärd:** Synkronisera `props`-definitionen i `LegendPanel.tsx` med de `props` som faktiskt skickas från `App.tsx`. Ta emot `projectInfo` och `setProjectInfo` och implementera logik för att visa och redigera dem.

---

## 2. UX-Brister (Användarvänlighet)

### 2.1 Otydlig Varning vid Radering
- **Fil:** `src/components/header/Header.tsx`
- **Problem:** "Rensa Projekt"-knappen använder en `toast`-notis för att bekräfta en destruktiv handling. En toast kan enkelt klickas bort av misstag.
- **"Gubbe-UX" Regel:** FÖRLÅTANDE GRÄNSSNITT. Det ska vara svårt att göra katastrofala misstag.
- **Åtgärd:** Byt ut `toast`-varningen mot en **modal dialogruta** som tvingar användaren till ett aktivt val: "Ja, radera" eller "Avbryt".

### 2.2 Otydliga Ikon-knappar
- **Fil:** `src/components/header/Header.tsx`
- **Problem:** Knapparna för att visa/dölja sidopanelerna (Bibliotek och Förteckning) är endast ikoner, vilket inte är tillräckligt tydligt för målgruppen.
- **"Gubbe-UX" Regel:** Knappar ska ha tydlig text.
- **Åtgärd:** Komplettera ikonerna med text, t.ex. "Visa Bibliotek". På mindre skärmar kan detta lösas med en `tooltip` som visas vid hovring.

### 2.3 Förbättringspotential för Rit-feedback
- **Fil:** `src/components/library/LibraryPanel.tsx`
- **Problem:** När man väljer ett rit-verktyg (t.ex. "Staket") ändras muspekaren först när man för den över canvasen.
- **"Gubbe-UX" Regel:** Ge omedelbar feedback.
- **Åtgärd:** Tvinga fram en global ändring av muspekaren till `crosshair` direkt när ett rit-verktyg väljs i `handleItemSelect`-funktionen.

---

## Rekommenderad Åtgärdsplan

1.  **Stabilisera Appen:** Åtgärda de tre **kritiska felen (1.1, 1.2, 1.3)** i den ordningen. Detta kommer att lösa krascherna, minnesläckorna och den trasiga funktionaliteten.
2.  **Förbättra UX:** När appen är stabil, implementera åtgärderna för **UX-bristerna (2.1, 2.2, 2.3)** för att göra gränssnittet mer "Gubbe-säkrat".
