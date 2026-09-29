import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import TL from "./timeline.json";
import { b2f, C } from "./lib";
import { Climb, Cta, End, Hall, Hook, Logo, Step1, Step2, Step3, Trail, Words } from "./scenes";

// One component per key in timeline.json "scenes". Hard cuts on the beat; transitions live inside scenes.
const SCENES: Record<keyof typeof TL.scenes, React.FC> = {
  hook: Hook,
  logo: Logo,
  climb: Climb,
  step1: Step1,
  step2: Step2,
  step3: Step3,
  words: Words,
  trail: Trail,
  hall: Hall,
  cta: Cta,
  end: End,
};

export const Promo: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => (
  <AbsoluteFill style={{ background: C.ink }}>
    {(Object.keys(SCENES) as (keyof typeof TL.scenes)[]).map((k) => {
      const [a, b] = TL.scenes[k];
      const Comp = SCENES[k];
      return (
        <Sequence key={k} from={b2f(a)} durationInFrames={b2f(b) - b2f(a)} name={k}>
          <Comp />
        </Sequence>
      );
    })}
    {withAudio && <Audio src={staticFile("promo/audio/promo-master.wav")} />}
  </AbsoluteFill>
);
