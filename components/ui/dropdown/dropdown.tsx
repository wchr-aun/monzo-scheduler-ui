"use client";

import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import styles from "./dropdown.module.css";

type DropdownProps = {
  children: (close: () => void) => ReactNode;
  fullWidth?: boolean;
  id?: string;
  panelLabel: string;
  panelRole?: "group" | "listbox";
  primaryText: ReactNode;
  secondaryText?: ReactNode;
};

export function Dropdown({
  children,
  fullWidth = false,
  id,
  panelLabel,
  panelRole = "group",
  primaryText,
  secondaryText,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const generatedPanelId = useId();
  const panelId = `${id ?? generatedPanelId}-options`;
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback((restoreFocus = true) => {
    setIsOpen(false);
    if (restoreFocus) {
      triggerRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        close(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [close, isOpen]);

  function handleTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
    }
  }

  return (
    <div
      className={`${styles.container} ${fullWidth ? styles.fullWidth : ""}`}
      ref={containerRef}
    >
      <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        aria-haspopup={panelRole === "listbox" ? "listbox" : undefined}
        className={styles.trigger}
        id={id}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
        ref={triggerRef}
        type="button"
      >
        <span>{primaryText}</span>
        {secondaryText ? (
          <span className={styles.secondaryText}>{secondaryText}</span>
        ) : null}
      </button>
      {isOpen ? (
        <div
          aria-label={panelLabel}
          className={styles.panel}
          id={panelId}
          role={panelRole}
        >
          {children(() => close())}
        </div>
      ) : null}
    </div>
  );
}
