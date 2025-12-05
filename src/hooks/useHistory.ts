
import { useReducer, useCallback, useRef } from 'react';

// Debounce-funktion för att förhindra att historiken spammas vid snabba uppdateringar.
const debounce = <F extends (...args: any[]) => any>(func: F, delay: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<F>): void => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
};

// Typdefinitioner för reducer-logiken
type HistoryAction<T> = 
    | { type: 'SET_STATE'; payload: T }
    | { type: 'UNDO' }
    | { type: 'REDO' }
    | { type: 'RESET'; payload: T };

interface HistoryState<T> {
    past: T[];
    present: T;
    future: T[];
}

// Reducer-funktion som hanterar all state-logik.
const historyReducer = <T,>(state: HistoryState<T>, action: HistoryAction<T>): HistoryState<T> => {
    const { past, present, future } = state;

    switch (action.type) {
        case 'SET_STATE':
            // Om den nya staten är densamma som den nuvarande, gör ingenting.
            if (action.payload === present) return state;
            return {
                past: [...past, present], // Lägg till nuvarande state i det förflutna
                present: action.payload, // Uppdatera nuvarande state
                future: [], // Rensa framtiden, eftersom vi har skapat en ny tidslinje
            };
        case 'UNDO':
            if (past.length === 0) return state; // Kan inte ångra
            const previous = past[past.length - 1];
            const newPast = past.slice(0, past.length - 1);
            return {
                past: newPast,
                present: previous,
                future: [present, ...future],
            };
        case 'REDO':
            if (future.length === 0) return state; // Kan inte göra om
            const next = future[0];
            const newFuture = future.slice(1);
            return {
                past: [...past, present],
                present: next,
                future: newFuture,
            };
        case 'RESET':
            return {
                past: [],
                present: action.payload,
                future: [],
            };
        default:
            return state;
    }
};

export interface UseHistoryReturn<T> {
    state: T;
    setState: (newState: T, immediate?: boolean) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    resetHistory: (initialState: T) => void;
}

export const useHistory = <T,>(initialState: T): UseHistoryReturn<T> => {
    const [state, dispatch] = useReducer(historyReducer, {
        past: [],
        present: initialState,
        future: [],
    });

    const debouncedSetState = useRef(
        debounce((newState: T) => {
            dispatch({ type: 'SET_STATE', payload: newState });
        }, 300)
    ).current;

    const setState = useCallback((newState: T, immediate = false) => {
        if (immediate) {
            dispatch({ type: 'SET_STATE', payload: newState });
        } else {
            debouncedSetState(newState);
        }
    }, [debouncedSetState]);

    const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
    const redo = useCallback(() => dispatch({ type: 'REDO' }), []);

    const resetHistory = useCallback((newState: T) => {
        dispatch({ type: 'RESET', payload: newState });
    }, []);

    return {
        state: state.present,
        setState,
        undo,
        redo,
        canUndo: state.past.length > 0,
        canRedo: state.future.length > 0,
        resetHistory,
    };
};
