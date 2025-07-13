"use client"

import Select from 'react-select';

interface ComboboxProps {
  options: { label: string; value: unknown; email?: string }[];
  value?: unknown;
  onChange: (value: unknown) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyPlaceholder?: string;
  className?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Selecione...',
  className,
}: ComboboxProps) {
  // Adaptar options para o formato do react-select
  const selectOptions = options.map(opt => ({
    value: opt.value,
    label: opt.label,
    email: opt.email,
  }));
  const selectedOption = selectOptions.find(opt => String(opt.value) === String(value)) || null;

  return (
    <Select
      className={className}
      options={selectOptions}
      value={selectedOption}
      onChange={opt => onChange(opt ? opt.value : null)}
      placeholder={placeholder}
      isClearable
      formatOptionLabel={opt => (
        <div>
          <div style={{ fontWeight: 500 }}>{opt.label}</div>
          {opt.email && <div style={{ fontSize: 12, color: '#888' }}>{opt.email}</div>}
        </div>
      )}
      noOptionsMessage={() => 'Nenhum item encontrado.'}
      styles={{
        option: (provided) => ({ ...provided, cursor: 'pointer' }),
        control: (provided) => ({ ...provided, minHeight: 38 }),
      }}
    />
  );
} 