import React from 'react';
import { Entity } from '@playcanvas/react';
import { Camera, Script } from '@playcanvas/react/components';
import { GSplat } from './CustomGSplat';
import { OrbitControls } from '@playcanvas/react/scripts';
import { Script as PcScript } from 'playcanvas'
import { useSplat } from '@playcanvas/react/hooks';

interface SplatSceneProps {
    splatUrl: string | null;
}

class SpinMe extends PcScript {
    speed = 1;
    update(dt: number) {
        this.entity.rotate(dt * this.speed, dt * this.speed, dt * this.speed)  // @ts-ignore
    }
}

const SplatScene: React.FC<SplatSceneProps> = ({ splatUrl }) => {
    const { asset, loading, error } = useSplat(splatUrl || '');

    if (!splatUrl) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-900">
                <p className="text-white text-lg">Initializing...</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-900">
                <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-lg">Loading splat scene...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full bg-red-900">
                <div className="text-center text-white max-w-md">
                    <p className="text-lg mb-2">Error loading splat scene</p>
                    <p className="text-sm text-red-200">{String(error)}</p>
                </div>
            </div>
        );
    }

    if (!asset) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-900">
                <p className="text-white text-lg">No splat data available</p>
            </div>
        );
    }

    return (
        <>
            <Entity position={[0, 2, 100]}>
                <Camera clearColor="#0a0a0a" />
                <OrbitControls
                    inertiaFactor={0.07}
                    distanceMin={0.1}
                    distanceMax={50}
                />
            </Entity>

            <Entity rotation={[0, 0, 0, 1]}>
                <GSplat
                    asset={asset}
                    swirlAmount={0.3}
                    noiseScale={1.5}
                />
                <Script script={SpinMe} speed={5} />
            </Entity>
        </>
    );
};

export default SplatScene;