import React from 'react';

interface DropdownOption<T extends string> {
  label: string;
  value: T;
  description?: string;
}

interface DropdownProps<T extends string> {
  label: string;
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

export const Dropdown = <T extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
}: DropdownProps<T>) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value as T;
    // Validate that the selected value exists in options
    if (options.some((opt) => opt.value === selectedValue)) {
      onChange(selectedValue);
    }
  };

  const selectedOpt = options.find((opt) => opt.value === value);

  return (
    <div className="dropdown-container">
      <label className="dropdown-label">{label}</label>
      <div className="dropdown-select-wrapper">
        <select
          className="dropdown-select"
          value={value}
          disabled={disabled}
          onChange={handleChange}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="dropdown-arrow">
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      {selectedOpt?.description && (
        <span className="dropdown-description">{selectedOpt.description}</span>
      )}
    </div>
  );
};
