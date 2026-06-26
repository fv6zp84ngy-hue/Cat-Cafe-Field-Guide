interface Props {
  label: string
  value: number
  max?: number
}

export default function RatingBar({ label, value, max = 5 }: Props) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[10px] tracking-widest uppercase text-sepia w-20 shrink-0">
        {label}
      </span>
      <div className="flex gap-1 flex-1">
        {Array.from({ length: max }, (_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-sm transition-colors ${
              i < value ? 'bg-terracotta' : 'bg-paper'
            }`}
          />
        ))}
      </div>
      <span className="font-mono text-[10px] text-ink opacity-50 w-4 text-right">
        {value}
      </span>
    </div>
  )
}
