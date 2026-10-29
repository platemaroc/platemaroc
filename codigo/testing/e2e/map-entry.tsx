import { createRoot } from 'react-dom/client';
import { MapFallback } from '../../frontend/maps/MapFallback.tsx';
(window as any).__log = [] as [string, number][];
const log = (e: string) => (window as any).__log.push([e, Math.round(performance.now())]);
function App() {
  return (<div>
    <div style={{ height: 1500, background: '#f5f5f5' }}>contenido largo</div>
    <MapFallback name="Café Hafa" lat={35.78} lng={-5.81} address="Tánger" directionsText="Siga la calle" staticMapSrc="data:image/gif;base64,R0lGODlhAQABAAAAACw=" renderInteractive={({ onReady }) => {
      log('renderInteractive');
      if (new URLSearchParams(location.search).get('ready')) setTimeout(onReady, 300);
      return <div id="gmap">SDK</div>;
    }} />
    <p id="below">texto debajo del mapa</p>
  </div>);
}
createRoot(document.getElementById('root')!).render(<App />);
log('app-render');
