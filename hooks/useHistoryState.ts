import { useState, useCallback } from 'react';

/**
 * A custom React hook that manages state with undo/redo capabilities.
 * It tracks the history of a state object, allowing for navigation
 * back and forth through changes.
 *
 * @template T The type of the state being managed.
 * @param {T} initialState The initial state value.
 * @returns {{
 *   state: T;
 *   setState: (newState: T | ((prevState: T) => T)) => void;
 *   undo: () => void;
 *   redo: () => void;
 *   canUndo: boolean;
 *   canRedo: boolean;
 *   reset: (newState: T) => void;
 * }} An object containing the current state and functions to manipulate it.
 */
export const useHistoryState = <T>(initialState: T) => {
    const [history, setHistory] = useState<T[]>([initialState]);
    const [currentIndex, setCurrentIndex] = useState(0);

    /** The current state value. */
    const state = history[currentIndex];

    /**
     * Updates the state and adds it to the history. This clears any "redo" history.
     * @param {T | ((prevState: T) => T)} newState The new state or a function that returns the new state.
     */
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

    /** Moves to the previous state in the history. */
    const undo = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    }, [currentIndex]);

    /** Moves to the next state in the history. */
    const redo = useCallback(() => {
        if (currentIndex < history.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    }, [currentIndex, history.length]);

    /**
     * Resets the history to a single new state.
     * @param {T} newState The new state to reset to.
     */
    const reset = useCallback((newState: T) => {
        setHistory([newState]);
        setCurrentIndex(0);
    }, []);

    /** A boolean indicating if there is a previous state to undo to. */
    const canUndo = currentIndex > 0;
    /** A boolean indicating if there is a next state to redo to. */
    const canRedo = currentIndex < history.length - 1;

    return { state, setState, undo, redo, canUndo, canRedo, reset };
};
