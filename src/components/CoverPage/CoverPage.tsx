export default function CoverPage() {
  return (
    <div className="h-full w-full relative overflow-hidden">
      <img
        src="/Cover.png"
        alt="Cat Cafe Field Guide cover"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute bottom-8 right-8 -rotate-6 origin-bottom-right">
        <div className="bg-paper/95 border-2 border-ink px-5 py-3 shadow-card">
          <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-terracotta mb-1">
            Not a Review App
          </p>
          <p className="font-display text-3xl leading-none text-ink">
            A <span className="italic">very</span> personal
          </p>
          <p className="font-display text-3xl leading-none text-ink">
            cat cafe field guide.
          </p>
        </div>
      </div>
    </div>
  )
}
