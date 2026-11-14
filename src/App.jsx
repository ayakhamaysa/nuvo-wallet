import { useEffect, useRef } from "react";
import { MotionConfig } from "framer-motion";
import { useLanguage } from "./useLanguage";
import Stage from "./components/Stage";
import { CardsSection, GetApp, Hero, Insights, Security, Send } from "./components/Sections";
import { ui } from "./data/ui";

export default function App() {
  const { lang, toggle } = useLanguage();
  const t = ui[lang];
  const stage = useRef(0); // which section is on screen (2.5 = halfway between sections 2 and 3)

  // Follow the scroll and work out the section number for the 3D phone
  useEffect(() => {
    const update = () => {
      const tops = [...document.querySelectorAll("[data-stage]")].map((s) => s.offsetTop);
      const y = window.scrollY;
      let i = 0;
      while (i < tops.length - 1 && y >= tops[i + 1]) i++;
      const next = tops[i + 1] ?? tops[i] + window.innerHeight;
      stage.current = i + Math.min(1, Math.max(0, (y - tops[i]) / (next - tops[i])));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <header className="fixed top-0 inset-x-0 z-40 h-16 flex items-center justify-between px-5 md:px-[4vw] bg-paper/70 backdrop-blur-xl border-b border-line/60">
        <a href="#top" className="flex items-center gap-2 font-display font-extrabold text-xl" dir="ltr">
          <span className="grid place-items-center w-8 h-8 rounded-xl bg-ink text-mint">N</span>
          NUVO
        </a>
        <nav className="hidden md:flex gap-8 text-sm font-semibold text-muted">
          {Object.entries(t.nav).map(([id, label]) => (
            <a key={id} href={`#${id}`} className="hover:text-ink transition-colors">
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={toggle} className="text-sm font-semibold text-muted hover:text-ink px-3 py-1.5">
            {t.switchLang}
          </button>
          <a href="#get" className="whitespace-nowrap text-sm font-bold rounded-full bg-ink text-paper px-4 py-2 hover:bg-emerald transition-colors">
            {t.getApp}
          </a>
        </div>
      </header>

      <Stage stage={stage} rtl={lang === "ar"} lang={lang} />

      {/* The text sits above the 3D. The mouse passes through it (to drag the phone);
          only links, buttons and form fields catch it */}
      <main className="relative z-20 pointer-events-none [&_a]:pointer-events-auto [&_button]:pointer-events-auto [&_input]:pointer-events-auto">
        <Hero lang={lang} />
        <Send lang={lang} />
        <Insights lang={lang} />
        <CardsSection lang={lang} />
        <Security lang={lang} />
        <GetApp lang={lang} />
      </main>

      <footer className="relative z-20 border-t border-line bg-paper">
        <div className="px-5 md:px-[4vw] py-7 flex flex-wrap gap-3 justify-between text-sm text-muted">
          <span>
            <b className="text-ink" dir="ltr">
              NUVO
            </b>{" "}
            · {t.concept}
          </span>
          <span>
            {t.madeBy}{" "}
            <a href="https://www.instagram.com/oneclick.ps" target="_blank" rel="noreferrer" className="font-bold text-ink">
              One Click
            </a>
          </span>
        </div>
      </footer>
    </MotionConfig>
  );
}
