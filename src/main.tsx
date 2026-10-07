import { chooseApp } from './shared/chooseApp';

// Load only the chosen view so its CSS and code never mix with the other one.
const root = document.getElementById('root')!;
const bigScreen = new URLSearchParams(window.location.search).get('screen') === 'captions';
const entry = bigScreen
  ? import('./shared/BigScreen')
  : chooseApp() === 'eventcam' ? import('./eventcam/Entry') : import('./captionEntry');
entry.then((m) => m.mount(root));
