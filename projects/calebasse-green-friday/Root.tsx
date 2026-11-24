import React from "react";
import { Composition } from "remotion";
import { SceneA, SceneAProps } from "./SceneA";
import { SceneC, SceneCProps } from "./SceneC";

export const Root: React.FC = () => (
  <>
    <Composition
      id="GreenFridayA"
      component={SceneA}
      durationInFrames={360}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ products: [] } as SceneAProps}
    />
    <Composition
      id="GreenFridayC"
      component={SceneC}
      durationInFrames={450}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ products: [] } as SceneCProps}
    />
  </>
);
