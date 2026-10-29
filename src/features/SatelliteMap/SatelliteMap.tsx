'use client';
import { Map } from '@vis.gl/react-maplibre';
import { StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { SatelliteLayers } from './SatelliteLayers';

const eoxStyle: StyleSpecification = {
    version: 8,
    sources: {
        'raster-tiles': {
            type: 'raster',
            tiles: [
                'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2025_3857/default/g/{z}/{y}/{x}.jpg',
            ],
            tileSize: 256,
            attribution:
                '<a href="https://cloudless.eox.at">EOxCloudless</a> by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2025)',
        },
    },
    layers: [
        {
            id: 'raster-layer',
            type: 'raster',
            source: 'raster-tiles',
        },
    ],
};

export function SatelliteMap() {
    return (
        <Map
            initialViewState={{
                longitude: 14.42,
                latitude: 50.08,
                zoom: 1.25,
            }}
            projection={'globe'}
            mapStyle={eoxStyle}
            minZoom={0}
            maxZoom={5}
            style={{ width: '100%', height: '100%' }}
        >
            <SatelliteLayers />
        </Map>
    );
}
