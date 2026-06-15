import { forwardRef, useState, useCallback } from 'react';
import { Input } from './Input';

interface NumericInputProps {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  placeholder?: string;
  allowDecimal?: boolean;
  disabled?: boolean;
  value?: number;
  onChange?: (value: number | undefined) => void;
  onBlur?: () => void;
  name?: string;
  containerClassName?: string;
}

function formatThousands(raw: string, allowDecimal: boolean): string {
  // Split on decimal separator (comma for Indonesian locale)
  const parts = raw.split(',');
  const intPart = parts[0].replace(/\./g, ''); // strip existing dots
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  if (allowDecimal && parts.length > 1) {
    return formatted + ',' + parts[1];
  }
  return formatted;
}

function parseNumeric(display: string): number | undefined {
  // Remove thousand separators (dots), replace decimal comma with dot
  const cleaned = display.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
}

function numericToDisplay(value: number | undefined, allowDecimal: boolean): string {
  if (value == null || isNaN(value)) return '';
  if (allowDecimal && !Number.isInteger(value)) {
    // Format: 1.234,56
    const [int, dec] = value.toString().split('.');
    const formattedInt = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formattedInt},${dec}`;
  }
  return value.toLocaleString('id-ID', { maximumFractionDigits: 0 });
}

export const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(
  function NumericInput({ value, onChange, onBlur, allowDecimal = false, ...props }, _ref) {
    const [display, setDisplay] = useState(() => numericToDisplay(value, allowDecimal));

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      let raw = e.target.value;

      // Only allow digits, dots (thousand sep) and comma (decimal)
      if (allowDecimal) {
        raw = raw.replace(/[^0-9.,]/g, '');
        // Ensure only one comma
        const commaIdx = raw.indexOf(',');
        if (commaIdx !== -1) {
          raw = raw.slice(0, commaIdx + 1) + raw.slice(commaIdx + 1).replace(/,/g, '');
        }
      } else {
        raw = raw.replace(/[^0-9]/g, '');
      }

      const formatted = raw === '' ? '' : formatThousands(raw, allowDecimal);
      setDisplay(formatted);
      onChange?.(parseNumeric(formatted));
    }, [allowDecimal, onChange]);

    const handleBlur = useCallback(() => {
      // Reformat on blur to clean up (e.g. trailing comma)
      const num = parseNumeric(display);
      setDisplay(numericToDisplay(num, allowDecimal));
      onBlur?.();
    }, [display, allowDecimal, onBlur]);

    return (
      <Input
        type="text"
        inputMode={allowDecimal ? 'decimal' : 'numeric'}
        value={display}
        onChange={handleChange}
        onBlur={handleBlur}
        {...props}
      />
    );
  },
);
