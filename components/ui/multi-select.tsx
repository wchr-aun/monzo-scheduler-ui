"use client";

import {Dropdown} from "./dropdown";
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
    <Dropdown
      panelLabel={`${label} options`}
      primaryText={label}
      secondaryText={`${values.length} selected`}
    >
      {() =>
        options.map((option) => {
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
        })
      }
    </Dropdown>
  );
}
