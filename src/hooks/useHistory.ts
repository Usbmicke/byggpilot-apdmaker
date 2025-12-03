import { useState, useRef, useCallback } from 'react';

// Typdefinition för historik-hookens returvärde
export interface UseHistoryReturn<T> {
    state: T;
    setState: (newState: T) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    snapshot: () => void; 
    resetHistory: (initialState: T) => void;
}

/**
 * En anpassad React-hook för att hantera state-historik (ångra/gör om).
 * @param initialState Det initiala state-värdet.
 */
export const useHistory = <T,>(initialState: T): UseHistoryReturn<T> => {
    // Ref för att lagra historiken utan att trigga omrendreringar
    const history = useRef<T[]>([initialState]);
    // Ref för att hålla koll på nuvarande position i historiken
    const historyPosition = useRef<number>(0);

    // Det state som faktiskt visas i komponenten
    const [state, setInternalState] = useState<T>(initialState);

    // Funktion för att uppdatera state och historik
    const setState = useCallback((newState: T) => {
        // Ta bort eventuell framtida historik (redo-steg)
        const newHistory = history.current.slice(0, historyPosition.current + 1);
        
        // Lägg till det nya state-värdet
        newHistory.push(newState);
        history.current = newHistory;
        historyPosition.current = newHistory.length - 1;

        setInternalState(newState);
    }, []);

    // Manuell funktion för att spara en ögonblicksbild av nuvarande state
    const snapshot = useCallback(() => {
        const currentHistory = history.current;
        const currentStateIndex = historyPosition.current;

        // Om vi är mitt i historiken, kapa den framtida historiken
        if (currentStateIndex < currentHistory.length - 1) {
            history.current = currentHistory.slice(0, currentStateIndex + 1);
        }

        // Lägg till nuvarande state som en ny historikpunkt
        history.current.push(state);
        historyPosition.current = history.current.length - 1;
    }, [state]);

    // Funktion för att ångra till föregående state
    const undo = useCallback(() => {
        if (historyPosition.current > 0) {
            historyPosition.current--;
            setInternalState(history.current[historyPosition.current]);
        }
    }, []);

    // Funktion för att göra om till nästa state
    const redo = useCallback(() => {
        if (historyPosition.current < history.current.length - 1) {
            historyPosition.current++;
            setInternalState(history.current[historyPosition.current]);
        }
    }, []);

    // Återställer hela historiken till ett nytt initialt state
    const resetHistory = useCallback((initialState: T) => {
        history.current = [initialState];
        historyPosition.current = 0;
        setInternalState(initialState);
    }, []);

    // Booleans för att enkelt kunna kontrollera om ångra/gör om är möjligt
    const canUndo = historyPosition.current > 0;
    const canRedo = historyPosition.current < history.current.length - 1;

    return { state, setState, undo, redo, canUndo, canRedo, snapshot, resetHistory };
};
