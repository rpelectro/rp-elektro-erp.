import { RichTextField } from "./RichTextField";
export function LongText({
  label,
  value,
  onChange,
  disabled,
  required,
  name,
  maxLength = 10000,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  maxLength?: number;
}) {
  return (
    <RichTextField
      label={label}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      name={name}
      maxLength={maxLength}
    />
  );
}
