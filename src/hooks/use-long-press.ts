import { useCallback, useRef, useState } from "react";
import { haptics } from "@/lib/haptics";

interface UseLongPressOptions {
  onLongPress: () => void;
  onClick?: () => void;
  threshold?: number;
}

export function useLongPress({
  onLongPress,
  onClick,
  threshold = 500,
}: UseLongPressOptions) {
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const timeout = useRef<NodeJS.Timeout>();

  const start = useCallback(() => {
    timeout.current = setTimeout(() => {
      haptics.medium();
      onLongPress();
      setLongPressTriggered(true);
    }, threshold);
  }, [onLongPress, threshold]);

  const clear = useCallback(() => {
    timeout.current && clearTimeout(timeout.current);
    setLongPressTriggered(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!longPressTriggered && onClick) {
      onClick();
    }
  }, [onClick, longPressTriggered]);

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
    onClick: handleClick,
  };
}
