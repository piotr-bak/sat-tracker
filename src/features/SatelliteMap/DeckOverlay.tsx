import { MapLibreOverlay, MapLibreOverlayProps } from '@deck.gl/maplibre';
import { useControl } from '@vis.gl/react-maplibre';

// It's a component and not a plain function because useControl needs the map from React context
// so it has to sit inside <Map>. Writing it as a component allows it to be placed declaratively
// as a child of the map - which is the pattern followed by the deck.gl docs.

export function DeckOverlay(props: MapLibreOverlayProps) {
    const overlay = useControl<MapLibreOverlay>(
        () => new MapLibreOverlay(props),
    );
    overlay.setProps(props);
    return undefined;
}
