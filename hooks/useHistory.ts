import { useState, useCallback } from 'react';

export function useHistory<T>(initialState: T) {
    const [state, setState] = useState<T>(initialState);
    const [past, setPast] = useState<T[]>([]);
    const [future, setFuture] = useState<T[]>([]);

    // Sparar nuvarande state till historiken utan att ändra nuvarande state
    // Används precis innan en användare gör en ändring (t.ex. börjar dra ett objekt)
    const snapshot = useCallback(() => {
        setPast(prev => {
            // Begränsa historiken till t.ex. 50 steg för prestanda
            const newPast = [...prev, state];
            if (newPast.length > 50) return newPast.slice(newPast.length - 50);
            return newPast;
        });
        setFuture([]);
    }, [state]);

    const undo = useCallback(() => {
        if (past.length === 0) return;

        const previous = past[past.length - 1];
        const newPast = past.slice(0, past.length - 1);

        setFuture(prev => [state, ...prev]);
        setState(previous);
        setPast(newPast);
    }, [past, state]);

    const redo = useCallback(() => {
        if (future.length === 0) return;

        const next = future[0];
        const newFuture = future.slice(1);

        setPast(prev => [...prev, state]);
        setState(next);
        setFuture(newFuture);
    }, [future, state]);

    const resetHistory = useCallback((newState: T) => {
        setState(newState);
        setPast([]);
        setFuture([]);
    }, []);

    return {
        state,
        setState,
        snapshot,
        undo,
        redo,
        canUndo: past.length > 0,
        canRedo: future.length > 0,
        resetHistory
    };
}