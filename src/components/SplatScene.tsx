import React, { useState } from 'react';
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

const SHADER_OPTIONS = [
    { value: 0, label: 'Original Complex Swirl', description: 'High quality, complex 4D noise' },
    { value: 1, label: 'Fast Curl Noise', description: 'Optimized curl noise approximation' },
    { value: 2, label: 'Simple Swirl', description: 'Fast trigonometric swirl effect' },
    { value: 3, label: 'Original Julia Set', description: 'Complex quaternion Julia fractal' },
    { value: 4, label: 'Fast Julia Set', description: 'Optimized quaternion Julia' },
    { value: 5, label: 'Pseudo Julia', description: '3D Julia approximation' },
    { value: 6, label: 'Trigonometric Julia', description: 'Fastest Julia-like effect' },
];

const SplatScene: React.FC<SplatSceneProps> = ({ splatUrl }) => {
    const { asset, loading, error } = useSplat(splatUrl || '');
    const [selectedShader, setSelectedShader] = useState(2); // Default to Simple Swirl
    const [swirlAmount, setSwirlAmount] = useState(0.3);
    const [noiseScale, setNoiseScale] = useState(1.5);
    const [showControls, setShowControls] = useState(true);
    const [rotate, setRotate] = useState(false);

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

    const selectedShaderInfo = SHADER_OPTIONS.find(opt => opt.value === selectedShader);

    return (
        <>
            {/* Controls Panel */}
            <div className="absolute top-4 right-4 z-10">
                <button
                    onClick={() => setShowControls(!showControls)}
                    className="mb-2 px-3 py-1 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                    {showControls ? 'Hide Controls' : 'Show Controls'}
                </button>

                {showControls && (
                    <div className="bg-gray-900 bg-opacity-90 backdrop-blur-sm text-white p-4 rounded-lg shadow-lg max-w-sm">
                        <div className="mb-4">
                            <label className="text-sm font-medium mb-2 mr-2">
                                Rotate:
                            </label>
                            <input
                                type="checkbox"
                                checked={rotate}
                                onChange={(e) => setRotate(e.target.checked)}
                                className="w-4 h-4"
                            />
                        </div>
                        <h3 className="text-lg font-semibold mb-3">Shader Effects</h3>

                        {/* Shader Selection */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">
                                Effect Type:
                            </label>
                            <select
                                value={selectedShader}
                                onChange={(e) => setSelectedShader(Number(e.target.value))}
                                className="w-full p-2 bg-gray-800 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                            >
                                {SHADER_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {selectedShaderInfo && (
                                <p className="text-xs text-gray-400 mt-1">
                                    {selectedShaderInfo.description}
                                </p>
                            )}
                        </div>

                        {/* Swirl Amount */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">
                                Effect Intensity: {swirlAmount.toFixed(2)}
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={swirlAmount}
                                onChange={(e) => setSwirlAmount(Number(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>

                        {/* Noise Scale */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">
                                Noise Scale: {noiseScale.toFixed(2)}
                            </label>
                            <input
                                type="range"
                                min="0.1"
                                max="5"
                                step="0.1"
                                value={noiseScale}
                                onChange={(e) => setNoiseScale(Number(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>

                        {/* Performance Indicator */}
                        <div className="text-xs text-gray-400 border-t border-gray-600 pt-2 mt-2">
                            <strong>Performance:</strong>
                            {selectedShader <= 1 && <span className="text-red-400"> High GPU load</span>}
                            {selectedShader === 2 && <span className="text-yellow-400"> Medium GPU load</span>}
                            {selectedShader >= 3 && selectedShader <= 4 && <span className="text-red-400"> High GPU load</span>}
                            {selectedShader >= 5 && <span className="text-green-400"> Low GPU load</span>}
                        </div>
                    </div>
                )}
            </div>

            {/* 3D Scene */}
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
                    swirlAmount={swirlAmount}
                    noiseScale={noiseScale}
                    shaderMode={selectedShader}
                />
                {rotate && <Script script={SpinMe} speed={5} />}
            </Entity>
        </>
    );
};

export default SplatScene;