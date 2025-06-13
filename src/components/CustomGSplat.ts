'use client';

import { useLayoutEffect, useRef, type FC } from 'react';
import {
    type Asset,
    type Entity as PcEntity,
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
    const localTime = useRef(0);

    useLayoutEffect(() => {
        if (asset) {
            const entity = asset.resource.instantiate({ vertex });
            assetRef.current = entity;
            parent.addChild(entity);

            const handle = app.on('update', (dt: number) => {
                localTime.current += dt;
                const material = assetRef.current?.gsplat?.material;
                if (material) {
                    material.setParameter('uTime', localTime.current);
                    material.setParameter('uSwirlAmount', swirlAmount);
                    material.setParameter('uNoiseScale', noiseScale);
                }
            });

            return () => {
                handle.off();
                entity.destroy();
                if (assetRef.current === entity) {
                    assetRef.current = null;
                }
            };
        }
    }, [asset, parent, swirlAmount, noiseScale]);

    return null;
};
