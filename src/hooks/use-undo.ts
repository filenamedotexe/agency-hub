"use client";

import { useState, useCallback } from "react";

export function useUndo<T>(initialState: T) {
  const [state, setState] = useState(initialState);
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const set = useCallback(
    (newState: T) => {
      const newHistory = history.slice(0, currentIndex + 1);
      newHistory.push(newState);

      setHistory(newHistory);
      setCurrentIndex(newHistory.length - 1);
      setState(newState);
    },
    [history, currentIndex]
  );

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setState(history[currentIndex - 1]);
    }
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setState(history[currentIndex + 1]);
    }
  }, [currentIndex, history]);

  const reset = useCallback(() => {
    setState(initialState);
    setHistory([initialState]);
    setCurrentIndex(0);
  }, [initialState]);

  return {
    state,
    set,
    undo,
    redo,
    reset,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
    history: history.slice(0, currentIndex + 1),
  };
}
