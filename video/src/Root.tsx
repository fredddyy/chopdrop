import { Composition } from "remotion";
import { ChopDropBrag } from "./ChopDropBrag";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ChopDropBrag"
      component={ChopDropBrag}
      durationInFrames={30 * 23} // 23 seconds at 30fps
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
