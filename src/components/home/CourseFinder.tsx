'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Compass } from 'lucide-react';
import WhatsAppLink from '@/components/WhatsAppLink';
import { FINDER_QUESTIONS, type FinderSuggestion } from '@/lib/home-tracks';

type Answers = Partial<Record<'background' | 'interest' | 'mode', string>>;

/**
 * "Find your course in 3 questions" (Design v4 Main.dc.html). Radio groups, so the keyboard and
 * screen readers get the native behaviour. Only the interest answer picks the course; the other
 * two answers go into the WhatsApp message so a counsellor has the context.
 */
export default function CourseFinder({ suggestions }: { suggestions: Record<string, FinderSuggestion> }) {
  const [answers, setAnswers] = useState<Answers>({});
  const suggestion = answers.interest ? suggestions[answers.interest] : undefined;

  const parts = [
    answers.background && `Background: ${answers.background}`,
    answers.interest && `Interest: ${answers.interest}`,
    answers.mode && `Learning mode: ${answers.mode}`,
  ].filter(Boolean);
  const message = `Hi, please send me a course plan.${parts.length ? ' ' + parts.join('. ') + '.' : ''}`;

  return (
    <section aria-labelledby="finder-title" className="bg-[#f6f9fa] px-4 pt-10 md:px-8 md:pt-20 dark:bg-slate-950">
      <div className="light-surface relative mx-auto flex max-w-[1200px] flex-col gap-8 overflow-hidden rounded-[28px] border border-[#e3eaec] bg-white p-5 md:flex-row md:gap-11 md:p-11">
        <span aria-hidden="true" className="absolute -bottom-[90px] -left-[70px] h-[280px] w-[280px] rounded-full bg-[#fdf0e8]" />
        <div className="relative flex flex-1 flex-col gap-3">
          <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#b8531c] text-white">
            <Compass className="h-7 w-7" />
          </span>
          <h2 id="finder-title" className="font-heading text-[26px] font-extrabold leading-tight text-[#0a3d4a] md:text-[34px]">
            Find your course in 3 questions
          </h2>
          <p className="text-base leading-relaxed text-[#4a5c61]">
            Answer three quick questions and we will suggest where to start. A counsellor can send you the plan on WhatsApp.
          </p>
        </div>

        <div className="relative flex flex-[2] flex-col gap-5">
          {FINDER_QUESTIONS.map((q, i) => (
            <fieldset key={q.key} className="m-0 border-0 p-0">
              <legend className="mb-2.5 text-base font-semibold text-[#17262a]">
                {i + 1}. {q.question}
              </legend>
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt) => (
                  <label key={opt} className="cursor-pointer">
                    <input
                      type="radio"
                      name={`finder-${q.key}`}
                      value={opt}
                      checked={answers[q.key] === opt}
                      onChange={() => setAnswers((a) => ({ ...a, [q.key]: opt }))}
                      className="peer sr-only"
                    />
                    <span className="flex min-h-[44px] items-center whitespace-nowrap rounded-full border border-[#cfdadd] bg-white px-[18px] text-[15px] font-medium text-[#26383d] peer-checked:border-[#005663] peer-checked:bg-[#005663] peer-checked:font-bold peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#005663]">
                      {opt}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#eaf4f5] px-[22px] py-[18px]">
            <div aria-live="polite">
              <div className="text-[13px] text-[#4a5c61]">Suggested start</div>
              <div className="font-heading text-xl font-extrabold text-[#0a3d4a]">
                {suggestion ? suggestion.label : 'Answer the questions to see a suggestion'}
              </div>
              {suggestion?.href && (
                <Link href={suggestion.href} className="mt-1 inline-flex min-h-[44px] items-center text-sm font-bold text-[#8f3f14] underline">
                  See the course
                </Link>
              )}
            </div>
            <WhatsAppLink
              ctaType="hero"
              pageType="static"
              message={message}
              className="flex h-[50px] items-center justify-center rounded-xl bg-[#b8531c] px-6 text-[15px] font-bold text-white hover:bg-[#8f3f14]"
            >
              Send me the plan
            </WhatsAppLink>
          </div>
        </div>
      </div>
    </section>
  );
}
