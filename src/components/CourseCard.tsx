import Link from 'next/link'

export interface CourseCardProps {
  title: string
  badge: string
  badgeVariant: 'orange' | 'teal' | 'violet' | 'rose' | 'amber' | 'green'
  accentVariant: 'hr' | 'cloud' | 'medical' | 'devops' | 'sap' | 'oracle' |
                 'data' | 'security' | 'fullstack' | 'digital' | 'softskills' | 'quantum'
  categoryLabel?: string
  duration: string
  mode: string
  level: string
  description: string
  highlights: [string, string]
  originalPrice: string
  discountedPrice: string
  emi: string
  urgency: string
  href: string
  animationIndex?: number
}

const accentGradients: Record<string, string> = {
  hr:         'linear-gradient(180deg, #FF6B2B, #FF9A6B)',
  cloud:      'linear-gradient(180deg, #0BA5A0, #34D399)',
  medical:    'linear-gradient(180deg, #7C3AED, #A78BFA)',
  devops:     'linear-gradient(180deg, #E11D48, #FB7185)',
  sap:        'linear-gradient(180deg, #0369A1, #38BDF8)',
  oracle:     'linear-gradient(180deg, #D97706, #FCD34D)',
  data:       'linear-gradient(180deg, #6366F1, #A5B4FC)',
  security:   'linear-gradient(180deg, #DC2626, #F87171)',
  fullstack:  'linear-gradient(180deg, #059669, #6EE7B7)',
  digital:    'linear-gradient(180deg, #DB2777, #F9A8D4)',
  softskills: 'linear-gradient(180deg, #7C3AED, #C4B5FD)',
  quantum:    'linear-gradient(180deg, #0D9488, #5EEAD4)',
}

const badgeBg: Record<string, string> = {
  orange: '#FF6B2B',
  teal:   '#0BA5A0',
  violet: '#7C3AED',
  rose:   '#E11D48',
  amber:  '#D97706',
  green:  '#059669',
}

export default function CourseCard({
  title,
  badge,
  badgeVariant,
  accentVariant,
  categoryLabel,
  duration,
  mode,
  level,
  description,
  highlights,
  originalPrice,
  discountedPrice,
  emi,
  urgency,
  href,
  animationIndex = 0,
}: CourseCardProps) {
  return (
    <div
      className="animate-fade-up bg-white rounded-[20px] overflow-hidden border border-black/[0.07] shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex flex-col transition-[transform,box-shadow] duration-[220ms] ease-[ease] hover:-translate-y-[6px] hover:shadow-[0_20px_48px_rgba(0,0,0,0.13)]"
      style={{ animationDelay: `${animationIndex * 0.05}s` }}
    >
      {/* Card Header */}
      <div
        className="relative p-[22px_20px_18px] min-h-[155px] overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0D1B2A 0%, #1B3A5C 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-[30px] -right-[30px] w-[130px] h-[130px] rounded-full bg-white/[0.04] pointer-events-none" />
        <div className="absolute -bottom-[20px] left-1/2 w-[200px] h-[60px] rounded-full bg-white/[0.025] pointer-events-none" />

        {/* Accent strip */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-r-sm"
          style={{ background: accentGradients[accentVariant] }}
        />

        {/* Top row: badge only */}
        <div className="mb-[10px]">
          <span
            className="inline-flex items-center gap-[5px] whitespace-nowrap px-[11px] py-[4px] rounded-full text-[11px] font-semibold tracking-[0.3px] text-white"
            style={{ background: badgeBg[badgeVariant] }}
          >
            <span className="inline-block w-[6px] h-[6px] rounded-full bg-white/70" />
            {badge}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-display text-[18px] font-semibold text-white leading-[1.3] mb-[14px] tracking-[-0.2px]">
          {title}
        </h3>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-[7px]">
          <span className="inline-flex items-center gap-[5px] bg-white/10 border border-white/[0.14] text-white/85 rounded-full px-[11px] py-[4px] text-[11px] font-medium backdrop-blur-sm">
            <svg className="w-3 h-3 opacity-80 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {duration}
          </span>
          <span className="inline-flex items-center gap-[5px] bg-white/10 border border-white/[0.14] text-white/85 rounded-full px-[11px] py-[4px] text-[11px] font-medium backdrop-blur-sm">
            <svg className="w-3 h-3 opacity-80 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            {mode}
          </span>
          <span className="inline-flex items-center gap-[5px] bg-white/10 border border-white/[0.14] text-white/85 rounded-full px-[11px] py-[4px] text-[11px] font-medium backdrop-blur-sm">
            <svg className="w-3 h-3 opacity-80 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 20h20M6 20V10M12 20V4M18 20v-6"/>
            </svg>
            {level}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="px-5 py-[18px] flex-1 flex flex-col gap-[14px]">
        {/* Institute-level trust stat (replaces per-course rating/enrollment claims) */}
        <div className="flex items-center gap-[10px]">
          <span className="bg-sky-50 text-sky-700 text-[11px] font-semibold px-[10px] py-[3px] rounded-full border border-sky-200">
            5,000+ students trained
          </span>
        </div>

        {/* Description */}
        <p className="text-[13px] leading-[1.65] text-slate-500 flex-1">{description}</p>

        {/* Highlights */}
        <div className="flex flex-col gap-[6px]">
          {highlights.map((h, i) => (
            <div key={i} className="flex items-center gap-[7px] text-[12px] text-gray-700 font-medium">
              <svg className="w-[14px] h-[14px] text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {h}
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-100" />

      {/* Card Footer */}
      <div className="flex items-center justify-between gap-3 px-5 pt-[14px] pb-[18px]">
        <div>
          <div className="text-[11px] text-slate-400 line-through mb-[1px]">{originalPrice}</div>
          <div className="font-display text-[22px] font-bold text-[#0D1B2A] leading-none">{discountedPrice}</div>
          <div className="text-[10px] text-slate-500 mt-[2px]">{emi}</div>
        </div>
        <Link
          href={href}
          className="inline-flex items-center gap-[6px] bg-[#FF6B2B] text-white px-5 py-[11px] rounded-xl text-[13px] font-semibold whitespace-nowrap tracking-[0.1px] transition-[background,transform] duration-[180ms] hover:bg-[#e85a1e] hover:scale-[1.03]"
        >
          View <span className="sr-only">{title} </span>Details
          <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </Link>
      </div>

      {/* Urgency strip */}
      <div className="bg-[#FFF7ED] border-t border-[#FED7AA] px-5 py-[7px] flex items-center gap-[6px] text-[11px] font-semibold text-[#C2410C]">
        <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        {urgency}
      </div>
    </div>
  )
}
