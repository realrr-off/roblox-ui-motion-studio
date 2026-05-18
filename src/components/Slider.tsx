import React, { useState, useEffect } from 'react';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
  disabled?: boolean;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step = 0.1,
  unit = '',
  onChange,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState<string>(value.toString());

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numeric = parseFloat(e.target.value);
    if (!isNaN(numeric)) {
      setInputValue(e.target.value);
      onChange(Math.min(max, Math.max(min, numeric)));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    let numeric = parseFloat(inputValue);
    if (isNaN(numeric)) {
      numeric = min;
    }
    const clamped = Math.min(max, Math.max(min, numeric));
    setInputValue(clamped.toString());
    onChange(clamped);
  };

  return (
    <div className="slider-container">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <div className="slider-input-wrapper">
          <input
            type="number"
            className="slider-number-input"
            value={inputValue}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
          />
          {unit && <span className="slider-unit">{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        className="slider-range-input"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={handleSliderChange}
      />
      <div className="slider-limits">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
};
