"use client";

import { BSCSCAN_ADDRESS_URL, FLAP_TOKEN_URL, GMGN_TOKEN_URL, HAS_TOKEN, TOKEN_ADDRESS } from "@/lib/config";
import { shortAddr } from "@/lib/format";
import { LangSwitch, useI18n, type Key } from "@/lib/i18n";
import { CopyButton } from "./CopyButton";
import { XButton } from "./XButton";
import { zoneAttrs } from "./Descent";

const LINKS = [
  { href: "#challengers", label: "nav_challengers" },
  { href: "#mine", label: "nav_how" },
  { href: "#hall", label: "nav_hall" },
] satisfies { href: string; label: Key }[];

// The core: the bottom of the mountain. A compact footer on basalt, right
// under the lava band.
export function Footer() {
  const { t } = useI18n();
  return (
    <footer id="core" className="relative overflow-hidden bg-[#1d1c21] text-cloud" {...zoneAttrs("core")}>
      <div className="relative mx-auto grid max-w-[1240px] gap-10 px-4 pt-[max(5vw,56px)] pb-8 sm:px-6 md:grid-cols-[1.2fr_1fr_1.2fr] md:items-start">
        <div>
          <a href="#top" className="inline-flex items-center gap-3" aria-label={t("back_summit")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo-wordmark-600.webp" alt="King of the Hill" width={600} height={224} loading="lazy" className="pixelated h-11 w-auto" />
          </a>
          <p className="mt-4 max-w-[34ch] text-sm leading-relaxed text-cloud/75">{t("footer_tagline")}</p>
          <div className="mt-5 flex items-center gap-3">
            <XButton />
            <LangSwitch />
          </div>
        </div>

        <nav aria-label="Footer">
          <p className="font-display text-xs font-bold tracking-[0.2em] text-[#ff9a3c] uppercase">{t("explore")}</p>
          <ul className="mt-3 grid gap-2 font-display text-sm font-bold tracking-wide uppercase">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a className="hover:text-gold" href={l.href}>
                  {t(l.label)}
                </a>
              </li>
            ))}
            <li>
              <a className="text-gold hover:text-cloud" href="#top">
                ▲ {t("back_summit")}
              </a>
            </li>
          </ul>
        </nav>

        <div>
          <p className="font-display text-xs font-bold tracking-[0.2em] text-[#ff9a3c] uppercase">{t("token")}</p>
          <div className="mt-3 inline-flex max-w-full items-center bg-cloud text-ink">
            <span className="px-3 font-display text-xs font-bold tracking-wider text-ink-soft uppercase">CA</span>
            {HAS_TOKEN ? (
              <>
                <code className="font-display text-sm font-bold" title={TOKEN_ADDRESS}>
                  {shortAddr(TOKEN_ADDRESS)}
                </code>
                <CopyButton value={TOKEN_ADDRESS} label="token contract address" />
              </>
            ) : (
              <span className="pr-3 font-display text-sm font-bold">{t("ca_soon")}</span>
            )}
          </div>
          {HAS_TOKEN ? (
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 font-display text-sm font-bold tracking-wide uppercase">
            <li>
              <a className="hover:text-gold" href={GMGN_TOKEN_URL} target="_blank" rel="noopener noreferrer">
                GMGN ↗
              </a>
            </li>
            <li>
              <a className="hover:text-gold" href={FLAP_TOKEN_URL} target="_blank" rel="noopener noreferrer">
                Flap ↗
              </a>
            </li>
            <li>
              <a className="hover:text-gold" href={BSCSCAN_ADDRESS_URL(TOKEN_ADDRESS)} target="_blank" rel="noopener noreferrer">
                BscScan ↗
              </a>
            </li>
          </ul>
          ) : null}
        </div>
      </div>

      <div className="h-1 bg-gradient-to-r from-[#e8601c] via-[#fbd322] to-[#e8601c]" aria-hidden />
    </footer>
  );
}
