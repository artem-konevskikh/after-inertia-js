import envMap from '/helipad-env-atlas.png';
import { Entity } from '@playcanvas/react';
import { Camera, EnvAtlas, Render, Script } from '@playcanvas/react/components';
import { useEnvAtlas } from '@playcanvas/react/hooks';

// @ts-ignore - Types aren't exported for the Camera controls
import { CameraControls } from 'playcanvas/scripts/esm/camera-controls.mjs';

function Scene() {
  const { asset } = useEnvAtlas(envMap);

  if (!asset) return;

  return (
    <>
      <EnvAtlas asset={asset} showSkybox={false} />

      <Entity position={[4, 4, -4]}>
        <Camera clearColor="#b5b5cf" />
        <Script script={CameraControls} />
      </Entity>

      <Entity>
        <Render type="box" />
      </Entity>
    </>
  );
}

export default Scene;
