import { CONTAINER, SECTION_PAD, TONE } from "@/components/home/v4/SectionHead";
import FinalCtaFormLazy from "@/components/home/v4/FinalCtaFormLazy";

/** Final CTA banner (Design v4): orange band; inline form from lg, one button on mobile. */
export default function FinalCta() {
  return (
    <section aria-labelledby="final-cta-title" className={`${TONE.white} ${SECTION_PAD}`}>
      <div className={CONTAINER}>
        <div className="on-dark relative flex flex-col gap-3 overflow-hidden rounded-2xl bg-[#b8531c] p-6 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between lg:gap-8 lg:p-12">
          <div className="relative min-w-0 lg:flex-[1_1_400px]">
            <h2 id="final-cta-title" className="font-heading text-2xl font-extrabold leading-[1.2] text-white lg:mb-2.5 lg:text-[36px] lg:leading-[1.15]">
              Your next step: a free demo class
            </h2>
            <p className="on-orange-sub mt-2 font-sans text-base lg:mt-0 lg:text-[17px]">
              <span className="lg:hidden">See the labs and decide with no pressure.</span>
              <span className="hidden lg:inline">Meet the trainer, see the labs and decide with no pressure.</span>
            </p>
          </div>
          <a
            href="#enroll-form"
            data-cta="book_demo"
            data-loc="final_cta"
            data-kind="demo"
            className="relative inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#0a3d4a] font-sans text-[15px] font-bold text-white lg:hidden"
          >
            Book free demo
          </a>
          <div className="hidden lg:contents">
            <FinalCtaFormLazy />
          </div>
        </div>
      </div>
    </section>
  );
}
