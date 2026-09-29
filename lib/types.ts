export type Callout = {
  id: string;
  handle: string;
  name: string;
  avatar: string | null;
  wallet: string;
  text: string; // original language
  textEn?: string; // GMGN translation (app_lang=en)
  textZh?: string; // GMGN translation (app_lang=zh-CN)
  at: number; // unix ms
  followers: number;
  kol: boolean;
  multiplier: number;
};

export type FeedItem = Callout & {
  round: number | null; // null = landed during the break, didn't count
  reignMs: number | null; // null while it is the current king
  crowned: boolean;
};

export type Winner = {
  callout: Callout;
  round: number;
  startedAt: number; // first call out of the round
  wonAt: number;
  callouts: number; // counted call outs in that round
};

// live    → a king holds the hill, clock running
// crowned → the clock hit zero; 1-minute break before the next round
// open    → break is over, first call out starts a new round
export type GameStatus = "live" | "crowned" | "open" | "empty" | "error";

export type GameState = {
  source: "live" | "snapshot";
  prelaunch?: boolean; // no token address configured yet
  stale: boolean;
  error?: string;
  serverNow: number;
  roundSeconds: number;
  breakSeconds: number;
  token: { chain: string; address: string };
  status: GameStatus;
  round: number; // current (or last) round number
  king: Callout | null; // live: current king · crowned: the winner
  roundEndsAt: number | null;
  breakEndsAt: number | null;
  lastWinner: Winner | null;
  recent: FeedItem[];
  winners: Winner[];
  stats: {
    callouts: number;
    challengers: number;
    rounds: number;
    longestRoundMs: number;
    windowStart: number | null;
  };
};
