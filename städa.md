ACT AS: Senior Full-Stack Architect & QA Lead.
CONTEXT: Vi bygger "ByggPilot APD Maker". En React-applikation med följande kritiska flöde:
1. INPUT: Ladda upp PDF/Bild -> Konvertera till bild -> Sätt som bakgrund på Canvas.
2. 2D-LÄGE: Drag-and-drop symboler, rita linjer/staket ovanpå bakgrunden.
3. 3D-LÄGE: Realtidsvisualisering av 2D-datan i en 3D-värld (Three.js/Fiber).
4. OUTPUT: Export till PDF/Bild av både 2D-ritning och 3D-vy.

CURRENT STATUS: Projektet är instabilt. Fixar vi X går Y sönder (Regression hell).
- PDF-uppladdning kraschar (ReferenceError/Undefined).
- 3D-vyn visar "linjer överallt" eller glitchar (troligen minnesläckage eller dubbla instanser).
- Drag-and-drop logik krockar med zoom/panorering.

UPPGIFT - GENOMFÖR EN "DEEP CODE REVIEW" I 4 STEG:

STEG 1: STATEMANAGEMENT & BEROENDEN (Analysera logiken först)
Analysera hur vi sparar "State".
- Har vi en "Single Source of Truth" (t.ex. en array av objekt med koordinater) som BÅDE 2D-canvas och 3D-scenen läser ifrån?
- Om 2D och 3D har separat state -> DETTA ÄR FELET. Identifiera var synkningen brister.
- Kontrollera 'handlePDF' och filuppladdningen. Saknas imports? Hanterar vi asynkrona event korrekt?

STEG 2: 3D-LIVSCYKEL (Fixa "Linjer överallt")
Granska hur 3D-komponenten monteras.
- Använder vi `useEffect` korrekt för att städa upp (dispose) gamla geometrier och material när komponenten laddas om?
- Om vi inte kör `geometry.dispose()` och `material.dispose()`, får vi grafikfel. Ge mig koden för att säkra "Cleanup".

STEG 3: UPLOAD & KONVERTERING (Fixa PDF-felet)
Granska PDF-uppladdningsfunktionen.
- Säkerställ att vi använder rätt bibliotek (t.ex. pdfjs-dist) och att 'workerSrc' är korrekt konfigurerad.
- Ge mig en felsäker funktion för att ta emot en fil -> verifiera typ -> konvertera till Base64/Blob -> Sätta state.

STEG 4: SKRIV INTE OM ALLT - GE MIG EN ÅTGÄRDSPLAN
Innan du skriver någon kod: Lista exakt vilka filer som är inblandade i dessa fel och beskriv logikfelet i dem. Jag vill godkänna din plan innan du ändrar en rad.