// Haptic feedback utilities for mobile devices
export const haptics = {
  // Light impact feedback
  light: () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
  },

  // Medium impact feedback
  medium: () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(20);
    }
  },

  // Heavy impact feedback
  heavy: () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(30);
    }
  },

  // Selection changed feedback
  selection: () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(5);
    }
  },

  // Success feedback
  success: () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
  },

  // Error feedback
  error: () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([10, 10, 10, 10, 10]);
    }
  },

  // Warning feedback
  warning: () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([20, 40, 20]);
    }
  },
};
