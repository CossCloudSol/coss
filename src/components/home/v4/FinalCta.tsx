import FinalCtaForm from '@/components/home/v4/FinalCtaForm';

/** Final CTA banner (Design v4): orange band; inline form from lg, one button on mobile. */
export default function FinalCta() {
  return (
    <section aria-labelledby="final-cta-title" className="px-4 pb-10 pt-8 lg:px-8 lg:py-[88px]">
      <div className="relative mx-auto flex max-w-[1216px] flex-col gap-2.5 overflow-hidden rounded-[22px] bg-[#b8531c] px-[18px] py-[26px] text-white lg:flex-row lg:flex-wrap lg:items-center lg:justify-between lg:gap-[30px] lg:rounded-[30px] lg:p-[52px]">
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 hidden [background-image:radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1.5px)] [background-size:20px_20px] lg:block" />
        <span aria-hidden="true" className="pointer-events-none absolute -right-[70px] -top-[90px] h-[220px] w-[220px] rounded-full border-[40px] border-white/[0.08] lg:-right-[100px] lg:-top-[140px] lg:h-[380px] lg:w-[380px] lg:border-[60px]" />
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-40 left-[35%] hidden h-[300px] w-[300px] rounded-full bg-[#8f3f14]/50 lg:block" />
        <div className="relative min-w-0 lg:flex-[1_1_400px]">
          <h2 id="final-cta-title" className="font-heading text-2xl font-extrabold leading-[1.2] lg:mb-2.5 lg:text-[40px] lg:leading-[1.15]">
            Your next step: a free demo class
          </h2>
          <p className="mb-1.5 mt-2.5 font-sans text-[15px] text-[#ffe2d1] lg:mb-0 lg:mt-0 lg:text-[17px]">
            <span className="lg:hidden">See the labs and decide with no pressure.</span>
            <span className="hidden lg:inline">Meet the trainer, see the labs and decide with no pressure.</span>
          </p>
        </div>
        <a
          href="#enroll-form"
          data-cta="book_demo"
          data-loc="final_cta"
          className="relative inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#0a3d4a] font-sans text-[15px] font-bold text-white lg:hidden"
        >
          Book free demo
        </a>
        <div className="hidden lg:contents">
          <FinalCtaForm />
        </div>
      </div>
    </section>
  );
}
