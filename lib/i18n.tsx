"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Callout } from "./types";

export type Lang = "en" | "zh";
export const LANGS: { id: Lang; label: string }[] = [
  { id: "en", label: "EN" },
  { id: "zh", label: "中文" },
];

// English is the source of truth; every key must exist in zh too.
const en = {
  nav_challengers: "Challengers",
  nav_how: "How to play",
  nav_hall: "Hall of kings",
  nav_callout: "Call out",
  skip: "Skip to content",
  copy: "Copy",
  copied: "Copied",
  copy_failed: "Failed",
  lang_label: "Language",

  live: "Live",
  demo: "Demo replay",
  reconnecting: "Reconnecting…",
  round: "Round {n}",
  t_live: "Time left on the hill",
  t_crowned: "King crowned · next round in",
  t_open: "The hill is open",
  t_empty: "Waiting for the first call out",
  cta_take: "Take the hill on GMGN",
  cta_callout: "Call out on GMGN",
  cta_buy: "Buy on Flap",
  current_king: "Current king",
  crowned_king: "Crowned king",
  crowned_king_round: "Crowned king · round {n}",
  followers: "{n} followers",
  called_ago: "Called {t}",
  king_of_hill: "King of the hill!",
  holding: "Holding the hill",
  the_throne: "The throne",
  hill_empty: "The hill is empty.",
  hill_empty_body: "The first call out on GMGN takes the hill and starts the clock.",
  hill_error: "We can’t reach GMGN right now. The throne will show up as soon as the feed is back.",
  last_king: "Last king:",
  new_king: "New king crowned!",
  no_text: "(no text)",

  slopes_kicker: "2,000m · the slopes",
  slopes_title: "The challengers are climbing.",
  slopes_body: "Every call out on GMGN is a challenger heading for the summit, newest first. Each one knocks the king off and resets the clock.",
  stat_callouts: "Call outs",
  stat_challengers: "Challengers",
  stat_kings: "Kings",
  stat_longest: "Longest round",
  no_challengers: "No challengers yet",
  no_challengers_body: "The first call out on GMGN will set up camp on the trail.",
  more_trail: "Further down the trail",
  enter_mine: "Enter the mine",
  tag_break: "During break · didn’t count",
  tag_on_hill: "On the hill · {t}",
  tag_crowned: "Crowned · round {n}",
  tag_held: "Held {t} · round {n}",

  mine_kicker: "Inside the mountain · the mine",
  mine_title: "How to take the hill",
  step1_title: "Grab the token",
  step1_body: "Pick up {ticker} on Flap. Every trade pays a small fee, and those fees are the prize.",
  step2_title: "Call it out on GMGN",
  step2_body: "Open the token on GMGN and post a call out. The moment it lands, your wallet is the new king and the clock resets.",
  step3_title: "Hold the hill",
  step3_body: "Every new call out resets the clock to {clock}. If it reaches 00:00 on your call, you’re crowned and the fees go to your wallet.",
  last_wins: "Last call out wins",
  rules_title: "Mine rules",
  rule1_title: "Only the last call out counts",
  rule1_body: "Calling out more often doesn’t stack. What matters is being the most recent caller when the clock runs out.",
  rule2_title: "1-minute break, then a new round",
  rule2_body: "When a king is crowned the hill rests for 1 minute. Then it opens again, and the first call out on GMGN starts a fresh round.",

  hall_kicker: "400m · the crypt of kings",
  hall_title: "Hall of Kings",
  hall_body: "Below the mine lies the crypt. Every caller who held the hill for {m} minutes is laid to rest here with their crown. Newest king first.",
  no_king: "No king crowned yet",
  no_king_body: "The first caller to hold the hill until 00:00 gets the first tomb.",
  latest_king: "Latest king · round {n}",
  col_crowned: "Crowned",
  col_round: "Round",
  col_callouts: "Call outs",
  dig_deeper: "Dig deeper",

  footer_tagline: "The last call out on GMGN takes the crown. Hold the hill for 5 minutes and the fees are yours.",
  explore: "Explore",
  token: "Token",
  back_summit: "Back to the summit",

  just_now: "just now",
  ago: "{t} ago",

  soon: "Soon",
  launching_soon: "Launching soon",
  t_prelaunch: "Every call out resets the clock to",
  ca_soon: "Coming soon",
  hill_prelaunch: "The contract drops soon. The first call out on GMGN after launch takes the hill.",
};

export type Key = keyof typeof en;

const zh: Record<Key, string> = {
  nav_challengers: "挑战者",
  nav_how: "玩法",
  nav_hall: "国王殿堂",
  nav_callout: "喊单",
  skip: "跳到内容",
  copy: "复制",
  copied: "已复制",
  copy_failed: "失败",
  lang_label: "语言",

  live: "直播",
  demo: "演示回放",
  reconnecting: "重新连接中…",
  round: "第 {n} 轮",
  t_live: "山顶剩余时间",
  t_crowned: "国王已加冕 · 下一轮倒计时",
  t_open: "山顶空缺中",
  t_empty: "等待第一个喊单",
  cta_take: "去 GMGN 抢占山顶",
  cta_callout: "在 GMGN 喊单",
  cta_buy: "在 Flap 购买",
  current_king: "当前国王",
  crowned_king: "加冕国王",
  crowned_king_round: "加冕国王 · 第 {n} 轮",
  followers: "{n} 粉丝",
  called_ago: "{t}喊单",
  king_of_hill: "山丘之王！",
  holding: "守住山顶中",
  the_throne: "王座",
  hill_empty: "山顶无人。",
  hill_empty_body: "GMGN 上的第一个喊单将占领山顶并开始计时。",
  hill_error: "暂时无法连接 GMGN。数据恢复后王座会立即显示。",
  last_king: "上一任国王：",
  new_king: "新国王加冕！",
  no_text: "（无内容）",

  slopes_kicker: "海拔 2,000 米 · 山坡",
  slopes_title: "挑战者正在攀登。",
  slopes_body: "GMGN 上的每一个喊单都是冲向山顶的挑战者，最新的排在最前。每次喊单都会把国王拉下王座并重置计时。",
  stat_callouts: "喊单数",
  stat_challengers: "挑战者",
  stat_kings: "国王",
  stat_longest: "最长回合",
  no_challengers: "还没有挑战者",
  no_challengers_body: "GMGN 上的第一个喊单会在山路上扎营。",
  more_trail: "沿山路继续向下",
  enter_mine: "进入矿洞",
  tag_break: "休息时间 · 不计入",
  tag_on_hill: "占领山顶 · {t}",
  tag_crowned: "已加冕 · 第 {n} 轮",
  tag_held: "守住 {t} · 第 {n} 轮",

  mine_kicker: "山体内部 · 矿洞",
  mine_title: "如何占领山顶",
  step1_title: "买入代币",
  step1_body: "在 Flap 买入 {ticker}。每笔交易都会支付少量手续费，这些手续费就是奖励。",
  step2_title: "在 GMGN 喊单",
  step2_body: "在 GMGN 打开代币并发布喊单。喊单发出的那一刻，你的钱包就是新国王，计时重置。",
  step3_title: "守住山顶",
  step3_body: "每个新喊单都会把计时重置为 {clock}。如果计时在你的喊单上归零，你就加冕为王，手续费归你的钱包。",
  last_wins: "最后喊单者获胜",
  rules_title: "矿洞规则",
  rule1_title: "只有最后一个喊单有效",
  rule1_body: "多次喊单不会叠加。关键是在计时归零时，你是最近一个喊单的人。",
  rule2_title: "休息 1 分钟，然后开始新一轮",
  rule2_body: "国王加冕后山顶休息 1 分钟。之后重新开放，GMGN 上的第一个喊单开启新一轮。",

  hall_kicker: "海拔 400 米 · 国王墓穴",
  hall_title: "国王殿堂",
  hall_body: "矿洞之下是墓穴。每位守住山顶 {m} 分钟的喊单者都会带着王冠安葬于此。最新的国王排在最前。",
  no_king: "还没有国王加冕",
  no_king_body: "第一个守住山顶直到 00:00 的人将获得第一座墓。",
  latest_king: "最新国王 · 第 {n} 轮",
  col_crowned: "加冕时间",
  col_round: "回合",
  col_callouts: "喊单数",
  dig_deeper: "继续深挖",

  footer_tagline: "GMGN 上最后一个喊单者赢得王冠。守住山顶 5 分钟，手续费就归你。",
  explore: "浏览",
  token: "代币",
  back_summit: "回到山顶",

  just_now: "刚刚",
  ago: "{t}前",

  soon: "即将推出",
  launching_soon: "即将上线",
  t_prelaunch: "每次喊单都会把计时重置为",
  ca_soon: "即将公布",
  hill_prelaunch: "合约即将公布。上线后 GMGN 上的第一个喊单将占领山顶。",
};

const DICTS: Record<Lang, Record<Key, string>> = { en, zh };
const STORAGE_KEY = "koth-lang";

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: Key, vars?: Record<string, string | number>) => string };
const I18n = createContext<Ctx | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  // English on the server and first paint; the saved choice applies after mount.
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {}
    if (saved !== "zh") return;
    const id = setTimeout(() => setLangState("zh"), 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {}
  }, []);

  const t = useCallback(
    (k: Key, vars?: Record<string, string | number>) => {
      let s = DICTS[lang][k] ?? en[k];
      if (vars) for (const [name, v] of Object.entries(vars)) s = s.replaceAll(`{${name}}`, String(v));
      return s;
    },
    [lang],
  );

  return <I18n.Provider value={{ lang, setLang, t }}>{children}</I18n.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18n);
  if (!ctx) throw new Error("useI18n outside LangProvider");
  return ctx;
}

// The call out's text in the chosen language, using GMGN's own translations.
export function calloutText(c: Callout, lang: Lang) {
  if (lang === "zh") return c.textZh || c.text;
  return c.textEn || c.text;
}

export function LangSwitch({ className = "" }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  return (
    <div role="group" aria-label={t("lang_label")} className={`px-box inline-flex bg-cloud text-ink ${className}`}>
      {LANGS.map((l) => (
        <button
          key={l.id}
          type="button"
          aria-pressed={lang === l.id}
          onClick={() => setLang(l.id)}
          className="min-h-8 px-2 font-display text-xs font-bold tracking-wider uppercase transition-colors hover:bg-gold aria-pressed:bg-ink aria-pressed:text-gold"
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
