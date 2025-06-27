export const animations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },

  slideUp: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
  },

  scaleIn: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
  },

  stagger: {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  },
};

export const transitions = {
  spring: {
    type: "spring",
    stiffness: 260,
    damping: 20,
  },

  smooth: {
    type: "tween",
    duration: 0.3,
    ease: "easeInOut",
  },

  bounce: {
    type: "spring",
    stiffness: 400,
    damping: 17,
  },

  quick: {
    type: "spring",
    stiffness: 500,
    damping: 25,
  },
};

// Micro-interaction presets for buttons and interactive elements
export const microInteractions = {
  button: {
    hover: { scale: 1.02 },
    tap: { scale: 0.98 },
    transition: transitions.bounce,
  },

  iconButton: {
    hover: { scale: 1.1, rotate: 5 },
    tap: { scale: 0.9, rotate: -5 },
    transition: transitions.bounce,
  },

  link: {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
    transition: transitions.quick,
  },

  input: {
    focus: { scale: 1.02 },
    transition: transitions.quick,
  },

  badge: {
    hover: { scale: 1.1 },
    transition: transitions.quick,
  },

  card: {
    hover: { y: -2 },
    tap: { scale: 0.98 },
    transition: transitions.smooth,
  },

  listItem: {
    hover: { x: 5 },
    transition: transitions.smooth,
  },

  fab: {
    hover: { scale: 1.1 },
    tap: { scale: 0.9 },
    initial: { scale: 0 },
    animate: { scale: 1 },
    transition: transitions.spring,
  },
};
