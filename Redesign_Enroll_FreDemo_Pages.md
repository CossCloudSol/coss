# Claude Code — Redesign /enroll-now-with-coss & /free-demo-class
# Project: C:\Users\zoomn\OneDrive\Dokumen\CLOUDE Code\coss-nextjs-complete\nextjs-project-coss

---

## BEFORE YOU START

Read these files first:
```
src/app/enroll-now-with-coss/page.tsx  (or .jsx)
src/app/free-demo-class/page.tsx       (or .jsx)
src/app/globals.css
tailwind.config.ts
src/components/  — list any form or UI components already used
```

Report what you find — form component names, how form submission works
(API route, email service, state management), existing field names,
branch options — before making any changes.

---

## TASK

Redesign both pages for maximum conversion. Keep all existing form
logic, field names, API calls, and submission handlers 100% intact.
Only change the visual layout and UI. Do NOT break the form.

---

## SHARED DESIGN TOKENS

Add these to globals.css if not already present:

```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
@media (prefers-reduced-motion: no-preference) {
  .animate-fade-up { animation: fadeUp 0.5s ease both; }
}
.live-dot-pulse { animation: pulse-dot 1.5s ease-in-out infinite; }
```

Brand colors (use as inline styles or extend tailwind config):
- Primary dark:   #0D1B2A
- Secondary dark: #1B3A5C  
- Brand orange:   #FF6B2B
- Orange hover:   #e85a1e
- Teal accent:    #0BA5A0
- Success green:  #10B981

---

## PAGE 1 — /enroll-now-with-coss

### Layout structure (top to bottom):

```
[HERO SECTION — dark navy bg #0D1B2A]
  Two columns: LEFT = headline + trust | RIGHT = form card
  
[FEATURES GRID — light gray bg #F0F2F5]
  6 tiles in 2 rows × 3 cols
  
[TESTIMONIALS — white bg]
  3 cards in a row
  
[BRANCH LOCATIONS — dark bg]
  Existing branch info
```

### HERO SECTION

```tsx
<section className="bg-[#0D1B2A] py-16 px-4">
  <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

    {/* LEFT — Headline + trust */}
    <div>
      {/* Admissions badge */}
      <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
        <span className="w-2 h-2 rounded-full bg-emerald-400 live-dot-pulse inline-block"></span>
        Admissions Open — June 2026 Batch
      </div>

      <h1 className="font-display text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
        Start Your <span className="text-[#FF6B2B]">IT Career</span><br/>
        in Hyderabad
      </h1>

      <p className="text-slate-400 text-base leading-relaxed mb-8 max-w-md">
        Expert trainers, hands-on labs, and 100% placement support.
        Join 1,200+ students already placed at top companies.
      </p>

      {/* Trust stats row */}
      <div className="flex flex-wrap gap-6 mb-8">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 text-lg">★</span>
          <div>
            <div className="text-white font-bold text-sm">4.8 / 5</div>
            <div className="text-slate-500 text-xs">Google Rating</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <i className="ti ti-users text-[#FF6B2B] text-lg" aria-hidden="true"></i>
          <div>
            <div className="text-white font-bold text-sm">1,200+</div>
            <div className="text-slate-500 text-xs">Students Placed</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <i className="ti ti-calendar text-[#FF6B2B] text-lg" aria-hidden="true"></i>
          <div>
            <div className="text-white font-bold text-sm">8+ Years</div>
            <div className="text-slate-500 text-xs">of Excellence</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <i className="ti ti-books text-[#FF6B2B] text-lg" aria-hidden="true"></i>
          <div>
            <div className="text-white font-bold text-sm">36+</div>
            <div className="text-slate-500 text-xs">Courses Offered</div>
          </div>
        </div>
      </div>

      {/* Social proof avatars */}
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          {/* 4 colored avatar circles with initials R S P K */}
          <div className="w-8 h-8 rounded-full bg-[#FF6B2B] border-2 border-[#0D1B2A] flex items-center justify-content text-white text-xs font-bold">R</div>
          <div className="w-8 h-8 rounded-full bg-[#0BA5A0] border-2 border-[#0D1B2A] flex items-center justify-content text-white text-xs font-bold">S</div>
          <div className="w-8 h-8 rounded-full bg-[#4D7CFE] border-2 border-[#0D1B2A] flex items-center justify-content text-white text-xs font-bold">P</div>
          <div className="w-8 h-8 rounded-full bg-[#8B5CF6] border-2 border-[#0D1B2A] flex items-center justify-content text-white text-xs font-bold">K</div>
        </div>
        <p className="text-slate-400 text-sm">
          <span className="text-white font-semibold">1,200+ students</span> enrolled this year — join them!
        </p>
      </div>
    </div>

    {/* RIGHT — Form card */}
    <div className="bg-white/[0.06] border border-white/[0.12] rounded-2xl p-8">
      <h2 className="font-display text-xl font-bold text-white mb-1">
        Book Free Demo — Callback in 2 hrs
      </h2>
      <p className="text-slate-400 text-sm mb-6">
        Fill the form and our counsellor will call within 2 hours.
      </p>

      {/* KEEP ALL EXISTING FORM FIELDS AND SUBMISSION LOGIC HERE */}
      {/* Just restyle the fields: */}
      {/* Input className: "w-full bg-white/[0.08] border border-white/[0.15] rounded-xl
          px-4 py-3 text-white placeholder-slate-500 text-sm
          focus:outline-none focus:border-[#FF6B2B] focus:bg-white/[0.12]
          transition-colors" */}
      {/* Label className: "block text-slate-300 text-sm font-medium mb-1.5" */}
      {/* Select className: same as input + "appearance-none" */}

      {/* CTA Button — replace existing button with: */}
      {/* <button type="submit"
            className="w-full bg-[#FF6B2B] hover:bg-[#e85a1e] text-white font-bold
            py-4 rounded-xl text-base transition-colors mt-2 flex flex-col items-center">
          <span>Get Free Counselling Now</span>
          <span className="text-xs font-normal opacity-80 mt-0.5">
            No spam · Callback within 2 hours
          </span>
        </button> */}

      {/* Trust microcopy below button */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <i className="ti ti-lock text-emerald-400" aria-hidden="true"></i>
          100% Secure
        </span>
        <span className="flex items-center gap-1">
          <i className="ti ti-shield-check text-emerald-400" aria-hidden="true"></i>
          No Spam
        </span>
        <span className="flex items-center gap-1">
          <i className="ti ti-clock text-emerald-400" aria-hidden="true"></i>
          Reply in 2 hrs
        </span>
      </div>
    </div>

  </div>
</section>
```

### FEATURES GRID

```tsx
<section className="py-16 px-4 bg-[#F0F2F5]">
  <div className="max-w-6xl mx-auto">
    <h2 className="font-display text-2xl font-bold text-[#0D1B2A] text-center mb-10">
      Why 1,200+ Students Choose COSS
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[
        { icon: 'ti-certificate', color: '#FF6B2B', bg: '#FFF7ED', title: 'Industry Certifications', desc: 'AWS, Microsoft, Google — globally recognised credentials.' },
        { icon: 'ti-tool',        color: '#0BA5A0', bg: '#E6FFFA', title: 'Hands-on Labs',         desc: 'Real tools from day one — no theory-only sessions.' },
        { icon: 'ti-briefcase',   color: '#059669', bg: '#ECFDF5', title: '100% Placement Support', desc: 'Resume, mock interviews, job portal access until placed.' },
        { icon: 'ti-user-check',  color: '#2563EB', bg: '#EFF6FF', title: 'Expert Trainers',       desc: 'Certified professionals with 10+ years industry experience.' },
        { icon: 'ti-clock',       color: '#7C3AED', bg: '#F3E8FF', title: 'Flexible Batches',      desc: 'Weekday, weekend, morning & evening — learn your way.' },
        { icon: 'ti-map-pin',     color: '#D97706', bg: '#FFFBEB', title: '2 Branches + Online',   desc: 'Dilsukhnagar, Ameerpet, and live online options.' },
      ].map((f) => (
        <div key={f.title} className="bg-white rounded-2xl border border-black/[0.07] p-6 flex gap-4 items-start">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{ background: f.bg }}>
            <i className={`ti ${f.icon} text-xl`} style={{ color: f.color }} aria-hidden="true"></i>
          </div>
          <div>
            <h3 className="font-semibold text-[#0D1B2A] text-sm mb-1">{f.title}</h3>
            <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>
```

### TESTIMONIALS

```tsx
<section className="py-16 px-4 bg-white">
  <div className="max-w-6xl mx-auto">
    <h2 className="font-display text-2xl font-bold text-[#0D1B2A] text-center mb-10">
      What Our Students Say
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[
        { stars:5, text: '"Got placed at TCS in 3 months. The hands-on approach made all the difference."', name:'Rahul M.', course:'AWS DevOps Batch' },
        { stars:5, text: '"Trainers are industry professionals — real projects from day one. Worth every rupee."', name:'Sneha P.', course:'Data Science Batch' },
        { stars:5, text: '"The free demo alone was better than paid classes I tried elsewhere."', name:'Kiran T.', course:'Full Stack Power BI Batch' },
      ].map((t) => (
        <div key={t.name} className="bg-[#F8FAFC] rounded-2xl border border-black/[0.06] p-6">
          <div className="text-amber-400 text-base mb-3">{'★'.repeat(t.stars)}</div>
          <p className="text-slate-600 text-sm leading-relaxed mb-4 italic">{t.text}</p>
          <div>
            <div className="font-semibold text-[#0D1B2A] text-sm">{t.name}</div>
            <div className="text-slate-400 text-xs">{t.course}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>
```

### KEEP the existing branch locations section below testimonials.
### KEEP the existing footer.

---

## PAGE 2 — /free-demo-class

### Layout structure:

```
[HERO — dark navy, two-col: bullets left, form right]
[HOW IT WORKS — 3 steps, light bg]
[WHAT YOU GET — 6 tiles grid]
[TESTIMONIALS — 3 cards]
[BOTTOM CTA STRIP — orange bg]
```

### HERO SECTION

```tsx
<section className="bg-[#0D1B2A] py-16 px-4">
  <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

    {/* LEFT */}
    <div className="pt-2">
      <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
        <span className="w-2 h-2 rounded-full bg-emerald-400 live-dot-pulse inline-block"></span>
        Live sessions available — Book yours today
      </div>

      <h1 className="font-display text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
        Attend a <span className="text-[#FF6B2B]">Free Demo</span><br/>
        Before You Enroll
      </h1>

      <p className="text-slate-400 text-base leading-relaxed mb-8">
        60-minute hands-on session with a certified trainer.
        No slides. No sales pitch. Just real training.
      </p>

      <div className="space-y-3 mb-8">
        {[
          'Real tools — AWS Console, Jenkins, Power BI live access',
          'Personalised career roadmap crafted just for you',
          'Meet your potential trainer before you commit',
          'Zero cost — absolutely no commitment required',
        ].map((item) => (
          <div key={item} className="flex items-start gap-3">
            <i className="ti ti-circle-check text-emerald-400 text-base mt-0.5 flex-shrink-0" aria-hidden="true"></i>
            <span className="text-slate-300 text-sm">{item}</span>
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-6 pt-6 border-t border-white/[0.08]">
        <div className="text-center">
          <div className="text-white font-bold text-xl">5,000+</div>
          <div className="text-slate-500 text-xs">Students trained</div>
        </div>
        <div className="text-center">
          <div className="text-white font-bold text-xl">4.8★</div>
          <div className="text-slate-500 text-xs">Google rating</div>
        </div>
        <div className="text-center">
          <div className="text-white font-bold text-xl">100%</div>
          <div className="text-slate-500 text-xs">Free, no catch</div>
        </div>
      </div>
    </div>

    {/* RIGHT — Form card */}
    <div className="bg-white/[0.06] border border-white/[0.12] rounded-2xl p-8">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="font-display text-xl font-bold text-white">
          Reserve Your Free Demo Slot
        </h2>
      </div>
      <p className="text-slate-400 text-sm mb-6">
        Fill the form — counsellor calls within 2 hours to schedule.
      </p>

      {/* KEEP ALL EXISTING FORM FIELDS AND SUBMISSION LOGIC */}
      {/* Apply same dark field styles as Page 1 */}

      {/* CTA button */}
      {/* <button type="submit" className="w-full bg-[#FF6B2B] hover:bg-[#e85a1e]
          text-white font-bold py-4 rounded-xl text-base transition-colors mt-2
          flex flex-col items-center">
        <span>Book My Free Demo Class</span>
        <span className="text-xs font-normal opacity-80 mt-0.5">
          Limited slots · Fills up fast
        </span>
      </button> */}

      {/* Social proof */}
      <div className="flex items-center gap-3 mt-4">
        <div className="flex -space-x-2">
          <div className="w-7 h-7 rounded-full bg-[#FF6B2B] border-2 border-[#0D1B2A] text-white text-xs font-bold flex items-center justify-center">R</div>
          <div className="w-7 h-7 rounded-full bg-[#0BA5A0] border-2 border-[#0D1B2A] text-white text-xs font-bold flex items-center justify-center">S</div>
          <div className="w-7 h-7 rounded-full bg-[#4D7CFE] border-2 border-[#0D1B2A] text-white text-xs font-bold flex items-center justify-center">P</div>
          <div className="w-7 h-7 rounded-full bg-[#8B5CF6] border-2 border-[#0D1B2A] text-white text-xs font-bold flex items-center justify-center">K</div>
        </div>
        <p className="text-slate-400 text-xs">
          <span className="text-white font-semibold">5,000+</span> attended this year
        </p>
      </div>
    </div>

  </div>
</section>
```

### HOW IT WORKS

```tsx
<section className="py-16 px-4 bg-[#F0F2F5]">
  <div className="max-w-4xl mx-auto text-center">
    <h2 className="font-display text-2xl font-bold text-[#0D1B2A] mb-12">
      How it works — 3 simple steps
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
      {[
        { num:'01', title:'Book your slot', desc:'Fill the form. Our counsellor calls within 2 hours to schedule your demo at a time that suits you.' },
        { num:'02', title:'Attend the demo', desc:'Join a 60-minute live session with a certified trainer. Hands-on labs, real tools, live demonstration.' },
        { num:'03', title:'Get your roadmap', desc:'After the demo our expert creates a personalised learning path. Zero pressure, no commitment needed.' },
      ].map((s, i) => (
        <div key={s.num} className="bg-white rounded-2xl border border-black/[0.07] p-8 text-center relative">
          <div className="w-12 h-12 rounded-full bg-[#0D1B2A] text-white font-display font-bold text-lg flex items-center justify-center mx-auto mb-4">
            {s.num}
          </div>
          <h3 className="font-semibold text-[#0D1B2A] text-base mb-2">{s.title}</h3>
          <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
        </div>
      ))}
    </div>
  </div>
</section>
```

### WHAT YOU GET (6 tiles)

```tsx
<section className="py-16 px-4 bg-white">
  <div className="max-w-6xl mx-auto">
    <h2 className="font-display text-2xl font-bold text-[#0D1B2A] text-center mb-4">
      What you get in the free demo
    </h2>
    <p className="text-slate-500 text-center text-sm mb-10">
      No slides, no sales pitch — a genuine hands-on session run by certified industry experts.
    </p>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[
        { icon:'ti-live-photo',   color:'#FF6B2B', bg:'#FFF7ED', title:'Live expert session',    desc:'60 mins hands-on class with a Microsoft/AWS-certified trainer.' },
        { icon:'ti-tool',         color:'#0BA5A0', bg:'#E6FFFA', title:'Real tool access',       desc:'Live industry tools — AWS Console, Azure, Jenkins & more.' },
        { icon:'ti-map',          color:'#2563EB', bg:'#EFF6FF', title:'Course roadmap',         desc:'Get a personalised learning path tailored to your goal.' },
        { icon:'ti-message-circle',color:'#7C3AED',bg:'#F3E8FF', title:'Q&A with trainer',      desc:'Ask anything — career switch, salary, syllabus scope.' },
        { icon:'ti-trending-up',  color:'#D97706', bg:'#FFFBEB', title:'Placement insights',    desc:'See real JDs, salary ranges & companies COSS alumni work at.' },
        { icon:'ti-gift',         color:'#059669', bg:'#ECFDF5', title:'Zero cost',             desc:'Completely free — no fees, no hidden charges, no commitment.' },
      ].map((f) => (
        <div key={f.title} className="bg-[#F8FAFC] rounded-2xl border border-black/[0.06] p-6 flex gap-4 items-start">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{ background: f.bg }}>
            <i className={`ti ${f.icon} text-xl`} style={{ color: f.color }} aria-hidden="true"></i>
          </div>
          <div>
            <h3 className="font-semibold text-[#0D1B2A] text-sm mb-1">{f.title}</h3>
            <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>
```

### TESTIMONIALS — same 3-card layout as Page 1

### BOTTOM CTA STRIP

```tsx
<section className="py-16 px-4 bg-[#FF6B2B]">
  <div className="max-w-2xl mx-auto text-center">
    <div className="text-white/80 text-sm font-semibold uppercase tracking-widest mb-3">
      Limited seats per batch
    </div>
    <h2 className="font-display text-3xl font-bold text-white mb-3">
      Your IT career starts with one free class
    </h2>
    <p className="text-white/80 text-base mb-8">
      No fees, no risk, no commitment — just real training that shows you exactly
      what your career could look like.
    </p>
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <a href="#top" className="bg-white text-[#FF6B2B] font-bold px-8 py-4 rounded-xl
         text-base hover:bg-orange-50 transition-colors">
        Book My Free Demo Class
      </a>
      <a href="https://wa.me/918885166007" target="_blank"
         className="bg-white/15 text-white font-semibold px-8 py-4 rounded-xl
         text-base border border-white/30 hover:bg-white/20 transition-colors
         flex items-center justify-center gap-2">
        <i className="ti ti-brand-whatsapp" aria-hidden="true"></i>
        Chat on WhatsApp
      </a>
    </div>
  </div>
</section>
```

### KEEP existing FAQ section above the bottom CTA strip.
### KEEP existing footer.

---

## CRITICAL RULES

1. Preserve ALL existing form fields, names, onChange handlers,
   onSubmit logic, API calls, error states, and success messages.
   Only restyle — never rewrite form logic.

2. Use font-display (Clash Display) for all headings.
   It must already be in tailwind.config.ts from earlier work.

3. Do NOT change page metadata, SEO tags, or breadcrumbs.

4. Do NOT touch any other page, component, or file.

5. After changes run: npm run build
   Fix any TypeScript errors before committing.

6. Check both pages at:
   - http://localhost:3000/enroll-now-with-coss
   - http://localhost:3000/free-demo-class

7. Commit both pages together:
   git add src/app/enroll-now-with-coss/page.tsx
   git add src/app/free-demo-class/page.tsx
   git commit -m "redesign: conversion-optimised layouts for enroll and free-demo pages"

8. After confirming both look correct:
   git push origin main
