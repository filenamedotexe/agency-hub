export const uiDebug = {
  log: (component: string, action: string, details?: any) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[UI-DEBUG] ${component} - ${action}`, details || "");
    }
  },

  error: (component: string, error: Error) => {
    console.error(`[UI-ERROR] ${component}:`, error);
  },

  measure: (label: string, fn: () => void) => {
    const start = performance.now();
    fn();
    const end = performance.now();
    console.log(`[UI-PERF] ${label}: ${(end - start).toFixed(2)}ms`);
  },
};
