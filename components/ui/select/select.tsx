"use client";

import {useRef} from "react";
import {Dropdown} from "@/components/ui/dropdown/dropdown";
import styles from "./select.module.css";

type SelectOption<Value extends string> = {
  label: string;
  value: Value;
};

type SelectProps<Value extends string> = {
  id: string;
  label: string;
  name: string;
  onChange: (value: Value) => void;
  options: readonly SelectOption<Value>[];
  value: Value;
};

export function Select<Value extends string>({
  id,
  label,
  name,
  onChange,
  options,
  value,
}: SelectProps<Value>) {
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedOption = options.find((option) => option.value === value);

  function focusOption(index: number) {
    const nextIndex = (index + options.length) % options.length;
    optionRefs.current[nextIndex]?.focus();
  }

  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input name={name} type="hidden" value={value} />
      <Dropdown
        fullWidth
        id={id}
        panelLabel={`${label} options`}
        panelRole="listbox"
        primaryText={selectedOption?.label ?? value}
      >
        {(close) =>
          options.map((option, index) => {
            const isSelected = option.value === value;

            return (
              <button
                aria-selected={isSelected}
                autoFocus={isSelected}
                className={`${styles.option} ${
                  isSelected ? styles.selected : ""
                }`}
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  close();
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    focusOption(index + 1);
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    focusOption(index - 1);
                  } else if (event.key === "Home") {
                    event.preventDefault();
                    focusOption(0);
                  } else if (event.key === "End") {
                    event.preventDefault();
                    focusOption(options.length - 1);
                  }
                }}
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                role="option"
                type="button"
              >
                <span>{option.label}</span>
              </button>
            );
          })
        }
      </Dropdown>
    </>
  );
}
