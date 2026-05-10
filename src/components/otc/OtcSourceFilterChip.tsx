import { Button } from '@/components/ui/button';

export type OtcSource = 'all' | 'intra' | 'inter';

const OPTIONS: Array<{ value: OtcSource; label: string }> = [
  { value: 'all', label: 'Sve' },
  { value: 'intra', label: 'Iz nase banke' },
  { value: 'inter', label: 'Iz drugih banaka' },
];

interface Props {
  value: OtcSource;
  onChange: (value: OtcSource) => void;
}

export default function OtcSourceFilterChip({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter po izvoru">
      {OPTIONS.map((opt) => (
        <Button
          key={opt.value}
          size="sm"
          variant={value === opt.value ? 'default' : 'outline'}
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={
            value === opt.value
              ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white'
              : ''
          }
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
