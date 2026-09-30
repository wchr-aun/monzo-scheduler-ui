"use client";

import {useEffect, useId, useRef, useState} from "react";
import styles from "./multi-select.module.css";

type MultiSelectOption<Value extends string> = {
  label: string;
  value: Value;
};

type MultiSelectProps<Value extends string> = {
  label: string;
  minimumSelections?: number;
  onChange: (values: Value[]) => void;
  options: readonly MultiSelectOption<Value>[];
  values: readonly Value[];
};

export function MultiSelect<Value extends string>({
  label,
  minimumSelections = 0,
  onChange,
  options,
  values,
}: MultiSelectProps<Value>) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  function toggleValue(value: Value) {
    const nextValues = values.includes(value)
      ? values.filter((candidate) => candidate !== value)
      : options
          .filter(
            (option) =>
              values.includes(option.value) || option.value === value,
          )
          .map((option) => option.value);

    if (nextValues.length >= minimumSelections) {
      onChange(nextValues);
    }
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        className={styles.trigger}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span>{label}</span>
        <span className={styles.count}>{values.length} selected</span>
      </button>
      {isOpen ? (
        <div
          aria-label={`${label} options`}
          className={styles.panel}
          id={panelId}
          role="group"
        >
          {options.map((option) => {
            const isChecked = values.includes(option.value);

            return (
              <label className={styles.option} key={option.value}>
                <input
                  checked={isChecked}
                  disabled={isChecked && values.length === minimumSelections}
                  onChange={() => toggleValue(option.value)}
                  type="checkbox"
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
