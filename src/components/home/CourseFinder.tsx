import Link from "next/link";
import { FINDER_QUESTIONS, type FinderSuggestion } from "@/lib/home-tracks";
import { ICON } from "@/lib/home-v4";
import { WA_NUMBER } from "@/lib/whatsapp";
import { CARD, CONTAINER, ICON_TILE, SECTION_PAD, TONE } from "@/components/home/v4/SectionHead";

function slugOf(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * "Find your course in 3 questions" (Design v4 Main.dc.html). Plain server HTML: the answers are
 * native radio inputs, and the suggested course changes through :has() rules in globals.css
 * (`.home-finder`), so this section ships no client JavaScript and costs no hydration.
 * "Send me the plan" is a real WhatsApp link; the page's small CTA script upgrades it to open the
 * WhatsApp widget (name + phone, saved as a lead) once the widget is ready.
 */
export default function CourseFinder({ suggestions }: { suggestions: Record<string, FinderSuggestion> }) {
  const digits = WA_NUMBER.replace(/\D/g, "");
  const ten = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits.slice(-10);
  const fallback0 = Object.values(suggestions)[0] ?? null;
  const fallback = `https://wa.me/91${ten}?text=${encodeURIComponent("Hi, please send me a course plan.")}`;
  return (
    <section aria-labelledby="finder-title" className={`home-finder ${TONE.tint} ${SECTION_PAD}`}>
      <div className={CONTAINER}>
        <div className={`${CARD} relative flex flex-col gap-8 p-6 lg:flex-row lg:flex-wrap lg:gap-12 lg:p-10`}>
          <div className="relative min-w-0 lg:flex-[1_1_300px]">
            <span aria-hidden="true" className={`${ICON_TILE} bg-[#b8531c] text-white`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <path d="m16 8-6 2-2 6 6-2z" />
              </svg>
            </span>
            <h2 id="finder-title" className="mb-3 mt-5 font-heading text-[27px] font-extrabold leading-[1.15] text-[#0a3d4a] lg:text-[32px]">
              Find your course in 3 questions
            </h2>
            <p className="font-sans text-base leading-[1.6] text-[#4a5c61]">Answer three quick questions and we will suggest where to start. A counsellor can send you the plan on WhatsApp.</p>
          </div>

          <div className="relative flex min-w-0 flex-col gap-5 lg:flex-[2_1_520px]">
            {FINDER_QUESTIONS.map((q, i) => (
              <fieldset key={q.key} className="m-0 border-0 p-0">
                <legend className="mb-2.5 font-sans text-base font-semibold text-[#17262a]">
                  {i + 1}. {q.question}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {q.options.map((opt) => (
                    <label key={opt} className="cursor-pointer">
                      <input type="radio" name={`finder-${q.key}`} value={slugOf(opt)} data-course={q.key === "interest" ? suggestions[opt]?.label : undefined} className="peer sr-only" />
                      <span className="flex min-h-11 items-center whitespace-nowrap rounded-full border border-[#cfdadd] bg-white px-4 font-sans text-sm font-medium text-[#26383d] peer-checked:border-[#005663] peer-checked:bg-[#005663] peer-checked:font-bold peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#005663] lg:px-[18px] lg:text-[15px]">
                        {opt}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-[#eaf4f5] px-5 py-4">
              <div aria-live="polite">
                <p className="font-sans text-sm text-[#4a5c61]">Suggested start</p>
                <p className="finder-default font-heading text-xl font-extrabold text-[#0a3d4a]">Answer the questions to see a suggestion</p>
                {fallback0 && (
                  <div className="finder-fallback">
                    <p className="font-heading text-xl font-extrabold text-[#0a3d4a]">{fallback0.label}</p>
                    {fallback0.href && (
                      <Link
                        href={fallback0.href}
                        data-cta="finder_course"
                        data-loc="course_finder"
                        className="inline-flex min-h-[44px] items-center font-sans text-sm font-bold text-[#8f3f14] underline"
                      >
                        See the course
                      </Link>
                    )}
                  </div>
                )}
                {Object.entries(suggestions).map(([opt, s]) => (
                  <div key={opt} data-for={slugOf(opt)} className="finder-suggest hidden">
                    <p className="font-heading text-xl font-extrabold text-[#0a3d4a]">{s.label}</p>
                    {s.href && (
                      <Link href={s.href} data-cta="finder_course" data-loc="course_finder" className="inline-flex min-h-[44px] items-center font-sans text-sm font-bold text-[#8f3f14] underline">
                        See the course
                      </Link>
                    )}
                  </div>
                ))}
              </div>
              <a
                href={fallback}
                target="_blank"
                rel="noopener noreferrer"
                data-cta="finder_plan"
                data-loc="course_finder"
                data-plan=""
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#b8531c] px-[22px] font-sans text-[15px] font-bold text-white shadow-[0_8px_20px_-10px_rgba(184,83,28,0.8)] hover:bg-[#8f3f14]"
              >
                Send me the plan
                <svg className="ml-2" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d={ICON.whatsapp} />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
