import React from "react";
import { Composition } from "remotion";
import { Scene } from "./Scene";

export const Root: React.FC = () => (
  <Composition id="GinsengAllee" component={Scene} durationInFrames={390} fps={30} width={1080} height={1920} defaultProps={{}} />
);
