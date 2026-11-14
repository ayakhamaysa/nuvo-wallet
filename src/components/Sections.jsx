import { useState } from "react";
import { motion } from "framer-motion";
import { ui } from "../data/ui";

// Text that rises softly into view
function Rise({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.35 }}
      transition={{ duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// One full-screen section. data-stage tells the 3D phone which pose to take
function Section({ id, children, className = "" }) {
  return (
    <section id={id} data-stage className={`relative min-h-svh flex px-5 md:px-[7vw] ${className}`}>
      {children}
    </section>
  );
}

const Column = ({ children, side = "start" }) => (
  <div className={`w-full md:w-[42%] ${side === "end" ? "md:ms-auto" : ""}`}>{children}</div>
);

const Label = ({ children }) => (
  <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald">
    <span className="w-1.5 h-1.5 rounded-full bg-emerald" />
    {children}
  </p>
);

// "Coming soon" store buttons (no real link yet)
function Stores({ lang }) {
  const t = ui[lang];
  return (
    <div className="flex flex-wrap items-center gap-3">
      {t.stores.map((s, i) => (
        <span key={s} className="inline-flex items-center gap-2.5 rounded-2xl bg-ink text-paper px-4 py-2.5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            {i === 0 ? (
              <path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.8-3.5.8-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.6 1.3-2.6s-2.5-1-2.5-3.7ZM14.1 5.9c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2.1-.5 2.7-1.3Z" />
            ) : (
              <path d="M4 3.5v17a1 1 0 0 0 1.5.9l14.7-8.5a1 1 0 0 0 0-1.8L5.5 2.6A1 1 0 0 0 4 3.5Z" />
            )}
          </svg>
          <span className="leading-tight">
            <span className="block text-[10px] opacity-70">{t.soon}</span>
            <span className="block text-sm font-bold">{s}</span>
          </span>
        </span>
      ))}
    </div>
  );
}

export function Hero({ lang }) {
  const t = ui[lang];
  return (
    // Title, text and store buttons at the top; the phone rises from below them
    <Section id="top" className="flex-col items-center justify-start pt-24 md:pt-28 pb-12 text-center">
      <Rise>
        <Label>{t.heroLabel}</Label>
        <h1 className="font-display font-extrabold text-5xl md:text-7xl tracking-tight mt-4 leading-[1.02] max-w-4xl">{t.heroTitle}</h1>
      </Rise>
      <Rise delay={0.15} className="flex flex-col items-center gap-5 mt-5">
        {/* the 3D phone measures where this block ends, to sit right under it on phones */}
        <p className="text-muted max-w-md">{t.heroText}</p>
        <div id="hero-end">
          <Stores lang={lang} />
        </div>
      </Rise>
    </Section>
  );
}

// A section with text on one side and the phone on the other
function Feature({ id, side, label, title, text, children }) {
  return (
    <Section id={id} className="items-end md:items-center pb-6 md:pb-0">
      <Column side={side}>
        <Rise className="rounded-3xl bg-paper/85 backdrop-blur-xl md:bg-transparent md:backdrop-blur-none px-4 py-4 md:p-0">
          <Label>{label}</Label>
          <h2 className="font-display font-extrabold text-[1.7rem] md:text-6xl tracking-tight mt-3 md:mt-4 leading-[1.08]">{title}</h2>
          <p className="text-muted text-sm md:text-base mt-3 md:mt-5 max-w-md leading-relaxed">{text}</p>
          {children}
        </Rise>
      </Column>
    </Section>
  );
}

export function Send({ lang }) {
  const t = ui[lang];
  return (
    <Feature id="send" side="start" label={t.sendLabel} title={t.sendTitle} text={t.sendText}>
      <ul className="mt-4 md:mt-7 space-y-2 md:space-y-3 text-sm md:text-base">
        {t.sendPoints.map((p) => (
          <li key={p} className="flex items-center gap-3">
            <span className="grid place-items-center w-6 h-6 rounded-full bg-mint text-ink text-xs font-bold">✓</span>
            {p}
          </li>
        ))}
      </ul>
    </Feature>
  );
}

export function Insights({ lang }) {
  const t = ui[lang];
  return <Feature id="insights" side="end" label={t.insightsLabel} title={t.insightsTitle} text={t.insightsText} />;
}

export function CardsSection({ lang }) {
  const t = ui[lang];
  return <Feature id="cards" side="start" label={t.cardsLabel} title={t.cardsTitle} text={t.cardsText} />;
}

export function Security({ lang }) {
  const t = ui[lang];
  return (
    <Feature id="security" side="end" label={t.securityLabel} title={t.securityTitle} text={t.securityText}>
      <div className="grid grid-cols-3 gap-4 mt-4 md:mt-8">
        {t.stats.map((s) => (
          <div key={s.t}>
            <p className="font-display font-extrabold text-2xl md:text-4xl" dir="ltr">
              {s.n}
              <span className="text-emerald text-xl">{s.u}</span>
            </p>
            <p className="text-muted text-xs mt-1">{s.t}</p>
          </div>
        ))}
      </div>
    </Feature>
  );
}

// Waiting list form (it only shows a thank-you; there is no server)
export function GetApp({ lang }) {
  const t = ui[lang];
  const [done, setDone] = useState(false);
  return (
    <Feature id="get" side="start" label={t.heroLabel} title={t.ctaTitle} text={t.ctaText}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setDone(true);
        }}
        className="mt-7 flex gap-2 max-w-md pointer-events-auto"
      >
        {done ? (
          <p className="rounded-full bg-mint text-ink font-bold px-6 py-3.5">{t.ctaDone}</p>
        ) : (
          <>
            <input
              id="email"
              type="email"
              required
              placeholder={t.ctaPlaceholder}
              aria-label={t.ctaPlaceholder}
              className="flex-1 min-w-0 rounded-full border border-line bg-white px-5 py-3.5 focus:outline-none focus:border-emerald"
            />
            <button className="rounded-full bg-ink text-paper px-6 py-3.5 font-bold hover:bg-emerald transition-colors">{t.ctaButton}</button>
          </>
        )}
      </form>
      <div className="mt-6">
        <Stores lang={lang} />
      </div>
    </Feature>
  );
}
