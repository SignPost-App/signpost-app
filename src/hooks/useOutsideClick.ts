import { RefObject, useEffect } from 'react';

export function useOutsideClick(
  ref: RefObject<HTMLElement | null>,
  onClickOutside: () => void,
  active: boolean,
) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClickOutside();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [active, onClickOutside, ref]);
}
