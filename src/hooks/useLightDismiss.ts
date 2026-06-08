import { useEffect, type RefObject } from 'react';

/** Close a modal <dialog> when the backdrop (area outside the dialog box) is clicked. */
export function useLightDismiss(ref: RefObject<HTMLDialogElement | null>): void {
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onClick = (event: MouseEvent) => {
      if (event.target !== dialog) return; // clicks inside the content target a child element
      const r = dialog.getBoundingClientRect();
      const inside =
        r.left <= event.clientX && event.clientX <= r.right && r.top <= event.clientY && event.clientY <= r.bottom;
      if (!inside) dialog.close();
    };
    dialog.addEventListener('click', onClick);
    return () => dialog.removeEventListener('click', onClick);
  }, [ref]);
}
