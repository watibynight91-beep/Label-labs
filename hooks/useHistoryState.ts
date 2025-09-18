import { useState, useCallback } from 'react';

export const useHistoryState = <T>(initialState: T) => {
    const [history, setHistory] = useState<T[]>([initialState]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const state = history[currentIndex];

    const setState = useCallback((newState: T | ((prevState: T) => T)) => {
        const resolvedState = typeof newState === 'function' 
            ? (newState as (prevState: T) => T)(state) 
            : newState;
        
        if (JSON.stringify(resolvedState) === JSON.stringify(state)) {
            return; // Don't add to history if state is the same
        }

        const newHistory = history.slice(0, currentIndex + 1);
        newHistory.push(resolvedState);
        setHistory(newHistory);
        setCurrentIndex(newHistory.length - 1);
    }, [history, currentIndex, state]);
    
    const undo = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    }, [currentIndex]);

    const redo = useCallback(() => {
        if (currentIndex < history.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    }, [currentIndex, history.length]);
    
    const reset = useCallback((newState: T) => {
        setHistory([newState]);
        setCurrentIndex(0);
    }, []);

    const canUndo = currentIndex > 0;
    const canRedo = currentIndex < history.length - 1;

    return { state, setState, undo, redo, canUndo, canRedo, reset };
};
