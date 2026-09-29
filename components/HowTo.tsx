"use client";

import { FLAP_TOKEN_URL, GMGN_TOKEN_URL, ROUND_SECONDS, TOKEN_TICKER } from "@/lib/config";
import { clock } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { zoneAttrs } from "./Descent";

// Inside the mountain: the mine teaches the game.
export function HowTo() {
  const { t } = useI18n();
  const STEPS = [
    { n: "01", title: t("step1_title"), body: t("step1_body", { ticker: TOKEN_TICKER }), cta: { label: t("cta_buy"), href: FLAP_TOKEN_URL } },
    { n: "02", title: t("step2_title"), body: t("step2_body"), cta: { label: t("cta_callout"), href: GMGN_TOKEN_URL } },
    { n: "03", title: t("step3_title"), body: t("step3_body", { clock: clock(ROUND_SECONDS * 1000) }), cta: null },
  ];
  return (
    <section id="mine" aria-labelledby="how-title" className="relative scroll-mt-16 bg-[#2a1a0e] text-cloud" {...zoneAttrs("mine")}>
      <div className="relative h-[440px] overflow-hidden sm:h-[520px] lg:h-[600px]">
        <div data-parallax="0.08" className="absolute inset-x-0 -top-[6%] -bottom-[6%] will-change-transform">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/mine-1920.webp"
            srcSet="/assets/mine-960.webp 960w, /assets/mine-1920.webp 1920w"
            sizes="100vw"
            alt="Pixel-art gold mine tunnel with torches, rails, gold ore and a cart full of gold"
            width={1920}
            height={1086}
            loading="lazy"
            className="pixelated h-full w-full object-cover object-[20%_50%] sm:object-center"
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgb(20_10_4/.65),transparent_62%)]" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-[#2a1a0e]" />

        <div className="relative mx-auto flex h-full max-w-[1240px] items-center justify-center px-4 text-center sm:px-6">
          <header data-reveal="drop">
            <p className="font-display text-sm font-bold tracking-[0.2em] text-gold uppercase [text-shadow:2px_2px_0_#000]">{t("mine_kicker")}</p>
            <h2 id="how-title" className="px-outline mt-3 font-display text-5xl leading-none font-bold sm:text-6xl">
              {t("mine_title")}
            </h2>
          </header>
        </div>
      </div>

      <div className="relative mx-auto max-w-[1240px] px-4 pb-[calc(max(100vw,760px)*0.08+64px)] sm:px-6">
        <ol className="grid gap-x-8 gap-y-14 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.n} data-reveal style={{ ["--i" as string]: i }} className="relative pt-10">
              {/* the sign hangs from two chains */}
              <span className="chain absolute top-0 left-[18%] h-10 w-1.5" aria-hidden />
              <span className="chain absolute top-0 right-[18%] h-10 w-1.5" aria-hidden />
              <article className="wood-sign relative flex h-full flex-col p-6 pt-7 text-parchment">
                <span className="timer-digits text-7xl leading-none text-gold [text-shadow:3px_3px_0_#2a1a0e]">{s.n}</span>
                <h3 className="mt-3 font-display text-2xl font-bold [text-shadow:2px_2px_0_#2a1a0e]">{s.title}</h3>
                <p className="mt-3 flex-1 text-[15px] leading-relaxed text-parchment/90">{s.body}</p>
                {s.cta && s.cta.href ? (
                  <a className="btn-px btn-px--sm mt-6 self-start" href={s.cta.href} target="_blank" rel="noopener noreferrer">
                    {s.cta.label} <span aria-hidden>↗</span>
                  </a>
                ) : s.cta ? (
                  <span aria-disabled="true" className="btn-px btn-px--sm mt-6 self-start">
                    {t("soon")}
                  </span>
                ) : (
                  <p className="mt-6 inline-flex items-center gap-2 self-start bg-gold px-3 py-2 font-display text-sm font-bold tracking-wider text-ink uppercase">
                    {t("last_wins")}
                  </p>
                )}
              </article>
            </li>
          ))}
        </ol>

        {/* House rules, nailed to a plank on the tunnel wall */}
        <div data-reveal className="wood-sign relative mt-16 grid gap-8 p-6 pt-8 text-parchment md:grid-cols-[auto_1fr_1fr] md:items-start md:gap-10 md:p-8">
          <p className="font-display text-2xl leading-none font-bold text-gold uppercase [text-shadow:2px_2px_0_#2a1a0e] md:max-w-[6ch]">
            {t("rules_title")}
          </p>
          <Rule title={t("rule1_title")}>{t("rule1_body")}</Rule>
          <Rule title={t("rule2_title")}>{t("rule2_body")}</Rule>
        </div>
      </div>
    </section>
  );
}

function Rule({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-display text-lg font-bold [text-shadow:2px_2px_0_#2a1a0e]">{title}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-parchment/85">{children}</p>
    </div>
  );
}
