'use client';

import { useEffect, useState } from 'react';

interface DebouncedSearchInputProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  className: string;
  debounceMs?: number;
}

export function DebouncedSearchInput(props: DebouncedSearchInputProps) {
  const {
    value,
    onValueChange,
    placeholder,
    className,
    debounceMs = 450,
  } = props;
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (localValue === value) return;

    const timeoutId = window.setTimeout(() => {
      onValueChange(localValue);
    }, debounceMs);

    return () => window.clearTimeout(timeoutId);
  }, [debounceMs, localValue, onValueChange, value]);

  return (
    <input
      value={localValue}
      onChange={(event) => setLocalValue(event.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
}
