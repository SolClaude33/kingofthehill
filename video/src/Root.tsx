import { Composition } from "remotion";
import { Promo } from "./promo/Promo";
import { FPS, TOTAL_FRAMES } from "./promo/lib";

export const Root = () => (
  <>
    <Composition id="KothPromo" component={Promo} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} defaultProps={{ withAudio: true }} />
  </>
);
