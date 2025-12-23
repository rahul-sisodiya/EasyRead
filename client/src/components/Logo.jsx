export default function Logo({ size = 28, label = "EasyRead" }) {
  const s = Number(size);
  return (
    <div className="flex items-center gap-2 select-none">
      <svg width={s} height={s} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="50%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" rx="12" ry="12" width="40" height="40" fill="#0b0b0d" stroke="#26262b" strokeWidth="2" />
        <path d="M14 16h10c2.5 0 4 1.5 4 4s-1.5 4-4 4h-6v8h-4V16zm20 0h-8v4h4v12h4V16z" fill="url(#lg1)" />
        <circle cx="40" cy="8" r="3" fill="#ffffff10" />
      </svg>
      <span className="font-semibold text-white tracking-wide">{label}</span>
    </div>
  );
}