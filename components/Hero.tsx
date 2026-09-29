"use client";

import { useEffect, useRef, useState } from "react";
import { BSCSCAN_ADDRESS_URL, FLAP_TOKEN_URL, GMGN_TOKEN_URL, HAS_TOKEN } from "@/lib/config";
import { ago, clock, compact, shortAddr } from "@/lib/format";
import { phaseAt } from "@/lib/game";
import { calloutText, useI18n } from "@/lib/i18n";
import type { Callout, GameState } from "@/lib/types";
import type { Connection } from "./useGame";
import { Confetti } from "./Confetti";
import { CopyButton } from "./CopyButton";
import { zoneAttrs } from "./Descent";
import { PixelAvatar, PixelCloud, PixelCrown } from "./pixel";
import { Bird } from "./sprites";

const SEGMENTS = 20;

export function Hero({ state, now, connection }: { state: GameState; now: number; connection: Connection }) {
  const { t } = useI18n();
  const phase = phaseAt(state, now);
  const { status, king, winner } = phase;
  const roundMs = state.roundSeconds * 1000;
  const breakMs = state.breakSeconds * 1000;

  const live = status === "live";
  const crowned = status === "crowned";
  const open = status === "open";

  const digits = live ? clock(phase.roundRemaining) : crowned ? clock(phase.breakRemaining) : clock(roundMs); // open / empty / pre-launch: show the round length
  const filled = live
    ? Math.ceil((phase.roundRemaining / roundMs) * SEGMENTS)
    : crowned
      ? Math.ceil((phase.breakRemaining / breakMs) * SEGMENTS)
      : open || state.prelaunch
        ? SEGMENTS
        : 0;
  const tone = live ? (phase.roundRemaining <= 10_000 ? "timer--danger" : phase.roundRemaining <= 60_000 ? "timer--warn" : "") : "";

  // New call out → drop-in + clock flash. Clock runs out → confetti.
  const prevKing = useRef(king?.id);
  const prevStatus = useRef<string | null>(null);
  const [entrance, setEntrance] = useState(0);
  const [burst, setBurst] = useState(0);
  useEffect(() => {
    if (live && king?.id && prevKing.current && king.id !== prevKing.current) setEntrance((n) => n + 1);
    prevKing.current = king?.id;
  }, [king?.id, live]);
  useEffect(() => {
    const was = prevStatus.current;
    prevStatus.current = status;
    const justCrowned = status === "crowned" && (was === "live" || (was === null && phase.breakRemaining > 5_000));
    if (justCrowned) setBurst((n) => n + 1);
  }, [status, phase.breakRemaining]);

  const label = state.prelaunch ? t("t_prelaunch") : live ? t("t_live") : crowned ? t("t_crowned") : open ? t("t_open") : t("t_empty");

  const card =
    live && king ? (
      <KingCard king={king} now={now} entrance={entrance} crowned={false} />
    ) : crowned && winner ? (
      <KingCard king={winner.callout} now={now} entrance={burst} crowned round={winner.round} />
    ) : (
      <OpenCard state={state} open={open} />
    );

  return (
    <section id="top" aria-labelledby="hero-title" className="relative flex flex-col lg:min-h-[760px]" {...zoneAttrs("top")}>
      <Sun />
      <Clouds />
      <Birds />
      <Confetti burst={burst} name={winner?.callout.name} />
      <p className="sr-only" aria-live="polite">
        {crowned && winner ? `${winner.callout.name} was crowned king of the hill.` : ""}
      </p>

      <div data-mountain-content className="relative z-10 mx-auto max-w-[1320px] px-4 pt-6 sm:px-6 lg:pt-7">
        <h1 id="hero-title" className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/logo-wordmark-1200.webp"
            srcSet="/assets/logo-wordmark-600.webp 600w, /assets/logo-wordmark-1200.webp 1200w"
            sizes="(min-width: 1024px) 440px, 300px"
            alt="King of the Hill"
            width={1200}
            height={450}
            fetchPriority="high"
            className="pixelated w-[300px] drop-shadow-[0_6px_0_rgb(15_29_58/.3)] lg:w-[440px]"
          />
        </h1>

        <div className="mt-6 grid grid-cols-1 gap-y-7 lg:mt-10 lg:grid-cols-12 lg:gap-x-6">
          {/* ── Left: the clock ── */}
          <div className="text-center lg:col-span-4 lg:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              <SourceBadge state={state} connection={connection} />
              {state.round > 0 ? (
                <span className="px-outline-sm font-display text-sm font-bold tracking-[0.12em] uppercase">{t("round", { n: open ? state.round + 1 : state.round })}</span>
              ) : null}
            </div>
            <div
              key={`t-${entrance}`}
              className={`mt-4 ${tone} ${entrance ? "timer--reset" : ""}`}
              role="timer"
              aria-live="off"
              aria-label={live ? `${digits} left for the current king` : crowned ? `Next round in ${digits}` : label}
            >
              <p className={`px-outline-sm font-display text-base font-bold tracking-[0.18em] uppercase ${crowned ? "text-gold" : ""}`}>{label}</p>
              <p className={`timer-digits px-outline mt-1 text-[128px] sm:text-[156px] lg:text-[168px] ${open ? "blink-slow" : ""}`}>{digits}</p>
              <div className="mx-auto mt-3 flex max-w-[400px] gap-1 lg:mx-0" aria-hidden>
                {Array.from({ length: SEGMENTS }, (_, i) => {
                  const on = i < filled;
                  const color = crowned ? "var(--gold)" : live && phase.roundRemaining <= 60_000 ? "var(--gold)" : "var(--grass)";
                  return (
                    <span
                      key={i}
                      className="h-4 flex-1"
                      style={{
                        background: on ? color : "rgb(15 29 58 / 0.25)",
                        boxShadow: on ? "inset 0 -4px 0 rgb(0 0 0 / .2), 0 0 0 2px var(--ink)" : "0 0 0 2px rgb(15 29 58 / .35)",
                      }}
                    />
                  );
                })}
              </div>
            </div>
            <div className="mt-8 hidden flex-wrap gap-5 lg:flex">
              <Ctas open={open} />
            </div>
          </div>

          {/* ── Right: the throne ── */}
          <div className="lg:col-span-4 lg:col-start-9 lg:pt-10">
            {card}
            <div className="mt-8 flex flex-wrap justify-center gap-5 lg:hidden">
              <Ctas open={open} />
            </div>
          </div>
        </div>
      </div>

      {/* Where the croc stands: the Mountain wrapper lines the painting's croc
          up with this point (mobile: below the CTAs; desktop: between the
          clock and the throne). */}
      <div className="relative h-[300px] shrink-0 lg:absolute lg:inset-x-0 lg:top-[560px] lg:h-0" aria-hidden>
        <div data-croc-anchor className="absolute bottom-4 left-0 lg:bottom-0" />
      </div>
    </section>
  );
}

function Ctas({ open }: { open: boolean }) {
  const { t } = useI18n();
  if (!HAS_TOKEN)
    return (
      <span aria-disabled="true" className="btn-px">
        {t("launching_soon")}
      </span>
    );
  return (
    <>
      <a className="btn-px" href={GMGN_TOKEN_URL} target="_blank" rel="noopener noreferrer">
        {open ? t("cta_take") : t("cta_callout")} <span aria-hidden>↗</span>
      </a>
      <a className="btn-px btn-px--ghost" href={FLAP_TOKEN_URL} target="_blank" rel="noopener noreferrer">
        {t("cta_buy")} <span aria-hidden>↗</span>
      </a>
    </>
  );
}

function KingCard({ king, now, entrance, crowned, round }: { king: Callout; now: number; entrance: number; crowned: boolean; round?: number }) {
  const { t, lang } = useI18n();
  return (
    <article
      key={`k-${king.id}-${entrance}-${crowned}`}
      aria-label={crowned ? t("crowned_king") : t("current_king")}
      className={`px-box relative max-w-[620px] p-5 sm:p-6 ${crowned ? "bg-gold" : "bg-parchment"} ${entrance ? "king-enter" : ""}`}
    >
      <div className="absolute -top-5 left-5 bg-ink px-3 py-1 font-display text-xs font-bold tracking-[0.2em] text-gold uppercase">
        {crowned ? (round ? t("crowned_king_round", { n: round }) : t("crowned_king")) : t("current_king")}
      </div>

      <div className="flex items-start gap-4">
        <div className="relative mt-3">
          <PixelCrown className={`absolute top-[-26px] left-1/2 w-12 -translate-x-1/2 -rotate-[8deg] ${entrance ? "crown-enter" : ""}`} />
          <div className="px-box">
            <PixelAvatar src={king.avatar} seed={king.wallet} size={72} grain={4} alt="" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h2 className="line-clamp-2 font-display text-2xl leading-tight font-bold [overflow-wrap:anywhere]">{king.name}</h2>
            {king.kol ? <span className="bg-ruby px-1.5 font-display text-[11px] font-bold tracking-wider text-white uppercase">KOL</span> : null}
          </div>
          <p className="mt-0.5 text-sm text-ink-soft">
            {king.handle ? (
              <a className="underline decoration-2 underline-offset-2 hover:text-ruby" href={`https://x.com/${king.handle}`} target="_blank" rel="noopener noreferrer">
                @{king.handle}
              </a>
            ) : null}
            {king.followers > 0 ? <span> · {t("followers", { n: compact(king.followers) })}</span> : null}
          </p>
          <div className="mt-2 inline-flex flex-wrap items-center bg-ink/8 text-sm">
            <a className="px-2 py-1 font-display font-bold hover:text-ruby" href={BSCSCAN_ADDRESS_URL(king.wallet)} target="_blank" rel="noopener noreferrer" title={king.wallet}>
              {shortAddr(king.wallet)}
            </a>
            <CopyButton value={king.wallet} label="king wallet" />
          </div>
        </div>
      </div>

      <blockquote className="relative mt-5 border-l-4 border-ink pl-4 text-lg leading-snug [overflow-wrap:anywhere]">
        <p className="line-clamp-3">“{calloutText(king, lang) || t("no_text")}”</p>
      </blockquote>

      <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-display text-sm font-bold tracking-wide uppercase">
        <span>{t("called_ago", { t: ago(now - king.at, t) })}</span>
        {crowned ? <span className="text-ruby">{t("king_of_hill")}</span> : <span className="text-grass-ink">{t("holding")}</span>}
      </p>
    </article>
  );
}

function OpenCard({ state, open }: { state: GameState; open: boolean }) {
  const { t } = useI18n();
  const last = state.lastWinner;
  return (
    <div className="px-box relative max-w-[620px] bg-parchment p-6">
      <div className="absolute -top-5 left-5 bg-ink px-3 py-1 font-display text-xs font-bold tracking-[0.2em] text-gold uppercase">
        {open ? t("round", { n: state.round + 1 }) : t("the_throne")}
      </div>
      <p className="mt-1 font-display text-2xl font-bold">{t("hill_empty")}</p>
      <p className="mt-2 text-[15px] leading-relaxed">
        {state.prelaunch ? t("hill_prelaunch") : state.status === "error" ? t("hill_error") : t("hill_empty_body")}
      </p>
      {last ? (
        <div className="mt-5 flex items-center gap-3 border-t-4 border-dotted border-ink/20 pt-4">
          <div className="relative">
            <PixelCrown className="absolute -top-3 left-1/2 w-6 -translate-x-1/2 -rotate-[8deg]" />
            <PixelAvatar src={last.callout.avatar} seed={last.callout.wallet} size={36} grain={4} />
          </div>
          <p className="min-w-0 text-sm">
            <span className="font-display font-bold uppercase">{t("last_king")}</span> <span className="[overflow-wrap:anywhere]">{last.callout.name}</span>
          </p>
        </div>
      ) : null}
    </div>
  );
}

function SourceBadge({ state, connection }: { state: GameState; connection: Connection }) {
  const { t } = useI18n();
  if (state.prelaunch)
    return <span className="px-box bg-gold px-2 py-0.5 font-display text-xs font-bold tracking-widest uppercase">{t("launching_soon")}</span>;
  if (connection === "reconnecting" || state.stale)
    return <span className="px-box bg-gold px-2 py-0.5 font-display text-xs font-bold tracking-widest uppercase">{t("reconnecting")}</span>;
  if (state.source === "snapshot")
    return (
      <span className="px-box bg-cloud px-2 py-0.5 font-display text-xs font-bold tracking-widest uppercase" title="No GMGN API key configured: replaying a real snapshot of the test token">
        {t("demo")}
      </span>
    );
  return (
    <span className="px-box inline-flex items-center gap-1.5 bg-ruby px-2 py-0.5 font-display text-xs font-bold tracking-widest text-white uppercase">
      <span className="blink inline-block h-2 w-2 bg-white" aria-hidden /> {t("live")}
    </span>
  );
}

function Sun() {
  return (
    <div className="pointer-events-none absolute top-[7%] right-[9%] h-24 w-24" aria-hidden data-parallax="0.08">
      <div className="absolute inset-[-60%] bg-[radial-gradient(circle,rgb(255_250_223/.55)_0_22%,rgb(255_250_223/.18)_38%,transparent_60%)]" />
      <div className="absolute inset-[22%] bg-[#fbfadf] shadow-[0_0_0_6px_rgb(251_250_223/.45),0_0_0_12px_rgb(251_250_223/.2)]" />
    </div>
  );
}

function Birds() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[14%] h-40" aria-hidden>
      <div className="fly absolute top-0 left-0" style={{ animationDuration: "38s", animationDelay: "-6s" }}>
        <Bird style={{ left: 0, top: 0 }} />
        <Bird style={{ left: 26, top: 14, transform: "scale(.8)" }} />
        <Bird style={{ left: -18, top: 20, transform: "scale(.7)" }} />
      </div>
      <div className="fly absolute top-20 left-0" style={{ animationDuration: "52s", animationDelay: "-30s" }}>
        <Bird style={{ left: 0, top: 0, transform: "scale(.7)" }} />
        <Bird style={{ left: 22, top: 10, transform: "scale(.6)" }} />
      </div>
    </div>
  );
}

function Clouds() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden data-parallax="0.1">
      <PixelCloud className="drift absolute top-[12%] w-40 opacity-90" style={{ animationDuration: "140s", animationDelay: "-40s" }} />
      <PixelCloud className="drift absolute top-[34%] w-24 opacity-80" style={{ animationDuration: "180s", animationDelay: "-120s" }} />
      <PixelCloud className="drift absolute top-[6%] w-28 opacity-70" style={{ animationDuration: "220s", animationDelay: "-10s" }} />
      {[
        [8, 22],
        [46, 9],
        [62, 30],
        [30, 52],
        [88, 18],
      ].map(([l, t], i) => (
        <span key={i} className="absolute h-2 w-2 bg-cloud" style={{ left: `${l}%`, top: `${t}%`, animation: `twinkle ${2 + i * 0.4}s steps(2,end) infinite` }} />
      ))}
    </div>
  );
}
