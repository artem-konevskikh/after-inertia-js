'use client';

import { useLayoutEffect, useRef, type FC } from 'react';
import {
    type Asset,
    type Entity as PcEntity,
    type EventHandle,
} from 'playcanvas';
import { useParent, useApp } from '@playcanvas/react/hooks';
import vertex from './gsplat.vert?raw';

interface GsplatProps {
    asset: Asset;
    swirlAmount?: number;
    noiseScale?: number;
}

export const GSplat: FC<GsplatProps> = ({ asset, swirlAmount = 1.0, noiseScale = 1.0 }) => {
    const parent: PcEntity = useParent();
    const app = useApp();
    const assetRef = useRef<PcEntity | null>(null);
    let localTime: number = 0;

    useLayoutEffect(() => {
        let handle: EventHandle;

        if (asset) {
            assetRef.current = asset.resource.instantiate({ vertex });
            parent.addChild(assetRef.current!);

            handle = app.on('update', (dt: number) => {
                localTime += dt;
                const material = assetRef.current?.gsplat?.material;
                if (material) {
                    material.setParameter('uTime', localTime);
                    material.setParameter('uSwirlAmount', swirlAmount);
                    material.setParameter('uNoiseScale', noiseScale);
                }
            });
        }

        return () => {
            if (!assetRef.current) return;
            if (handle) handle.off();
            parent.removeChild(assetRef.current);
        };
    }, [asset, parent, swirlAmount, noiseScale]);

    return null;
};
