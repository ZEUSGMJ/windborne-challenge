'use client';
import { createPathComponent } from '@react-leaflet/core';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

interface MarkerClusterGroupProps extends L.MarkerClusterGroupOptions {
  children: React.ReactNode;
}

const MarkerClusterGroup = createPathComponent<L.MarkerClusterGroup, MarkerClusterGroupProps>(
  ({ children: _c, ...props }, ctx) => {
    const clusterProps: Record<string, unknown> = {};
    const clusterEvents: Record<string, L.LeafletEventHandlerFn> = {};

    Object.entries(props).forEach(([propName, prop]) => {
      if (propName.startsWith('on')) {
        clusterEvents[propName] = prop as L.LeafletEventHandlerFn;
      } else {
        clusterProps[propName] = prop;
      }
    });

    const markerClusterGroup = L.markerClusterGroup(clusterProps as L.MarkerClusterGroupOptions);
    const instance = markerClusterGroup;

    Object.entries(clusterEvents).forEach(([eventAsProp, callback]) => {
      const event = eventAsProp.substring(2).toLowerCase();
      instance.on(event, callback);
    });

    return {
      instance,
      context: { ...ctx, layerContainer: instance },
    };
  }
);

export default MarkerClusterGroup;
