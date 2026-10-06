"use client"
import React, { useState, useEffect } from 'react';
import { formatNumber, parseNumber } from '@/lib/format';

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value?: number | string;
  onChangeValue?: (value: number) => void;
  name?: string;
}

export function FormattedNumberInput({ value, onChangeValue, name, className, defaultValue, ...props }: Props) {
  const [displayValue, setDisplayValue] = useState("");

  useEffect(() => {
    const valToFormat = value !== undefined ? value : (defaultValue as string | number);
    if (valToFormat !== undefined && valToFormat !== null && valToFormat !== "") {
      // Ubah dari format dot notation JS (cth 1000.5) ke string lalu panggil formatNumber
      setDisplayValue(formatNumber(valToFormat));
    } else {
      setDisplayValue("");
    }
  }, [value, defaultValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    // Izinkan angka dan satu koma
    raw = raw.replace(/[^\d,]/g, '');
    
    // Cegah koma berlebih
    const commaParts = raw.split(',');
    if (commaParts.length > 2) {
      raw = commaParts[0] + ',' + commaParts.slice(1).join('');
    }
    
    if (raw === "") {
      setDisplayValue("");
      onChangeValue?.(0);
      return;
    }

    // Jika ujungnya koma, biarkan user mengetik desimalnya
    if (raw.endsWith(',')) {
      // Kita format angka utuhnya saja, lalu tempelkan komanya
      const numPart = raw.slice(0, -1);
      if (numPart) {
        setDisplayValue(formatNumber(parseNumber(numPart)) + ',');
      } else {
        setDisplayValue('0,');
      }
      return;
    }

    // Jika ada desimal (ada koma di tengah)
    if (raw.includes(',')) {
      const parts = raw.split(',');
      const intPart = formatNumber(parseNumber(parts[0]));
      const decPart = parts[1]; // angka setelah koma
      setDisplayValue(intPart + ',' + decPart);
      const val = parseNumber(raw);
      onChangeValue?.(val);
      return;
    }

    // Hanya bilangan bulat
    const val = parseNumber(raw);
    setDisplayValue(formatNumber(val));
    onChangeValue?.(val);
  };

  return (
    <>
      <input
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        className={className}
        {...props}
      />
      {name && (
        <input type="hidden" name={name} value={displayValue ? parseNumber(displayValue) : ""} />
      )}
    </>
  );
}
export default FormattedNumberInput;
