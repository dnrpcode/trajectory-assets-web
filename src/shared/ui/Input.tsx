import React, { useState, useId, forwardRef } from 'react';
import { cn } from '@/shared/utils/cn';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  inputSize?: 'sm' | 'md' | 'lg';
  containerClassName?: string;
}

const sizeStyles = {
  sm: { height: '34px', fontSize: 'var(--text-xs)',   padH: '10px' },
  md: { height: '40px', fontSize: 'var(--text-sm)',   padH: '14px' },
  lg: { height: '48px', fontSize: 'var(--text-base)', padH: '16px' },
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    hint,
    prefix,
    suffix,
    inputSize = 'md',
    disabled,
    type = 'text',
    id: externalId,
    containerClassName,
    className,
    onFocus,
    onBlur,
    ...props
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const autoId = useId();
  const inputId = externalId || autoId;
  const s = sizeStyles[inputSize];

  const borderColor = error   ? 'var(--loss-500)'
                    : focused ? 'var(--blue-400)'
                    :           'var(--border-default)';

  const focusShadow = focused && !error ? 'var(--ring-brand)'
                    : focused &&  error ? 'var(--ring-loss)'
                    :                     'none';

  return (
    <div className={cn('flex flex-col gap-[6px] font-sans', containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold uppercase cursor-default"
          style={{
            color: error ? 'var(--loss-400)' : 'var(--text-secondary)',
            letterSpacing: 'var(--tracking-caps)',
          }}
        >
          {label}
        </label>
      )}
      <div
        className="flex items-center bg-[var(--bg-raised)] rounded-md transition-[border-color,box-shadow] duration-[150ms]"
        style={{
          border: `1px solid ${borderColor}`,
          height: s.height,
          boxShadow: focusShadow,
          opacity: disabled ? 0.45 : 1,
          pointerEvents: disabled ? 'none' : 'auto',
        }}
      >
        {prefix && (
          <span className="flex-shrink-0 select-none font-mono" style={{ padding: `0 4px 0 ${s.padH}`, fontSize: s.fontSize, color: 'var(--text-secondary)' }}>
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          className={cn('flex-1 h-full bg-transparent border-none outline-none min-w-0 text-[var(--text-primary)]', className)}
          style={{
            paddingLeft:  prefix ? '6px' : s.padH,
            paddingRight: suffix ? '6px' : s.padH,
            fontSize: s.fontSize,
            fontFamily: type === 'number' ? 'var(--font-mono)' : 'var(--font-sans)',
          }}
          {...props}
        />
        {suffix && (
          <span className="flex-shrink-0 select-none font-mono" style={{ padding: `0 ${s.padH} 0 4px`, fontSize: s.fontSize, color: 'var(--text-secondary)' }}>
            {suffix}
          </span>
        )}
      </div>
      {(error || hint) && (
        <span className="text-xs leading-normal" style={{ color: error ? 'var(--loss-400)' : 'var(--text-muted)' }}>
          {error || hint}
        </span>
      )}
    </div>
  );
});
