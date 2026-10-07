import { chooseApp } from './shared/chooseApp';

// Load only the chosen app so its CSS and code never mix with the other one.
const root = document.getElementById('root')!;
const entry = chooseApp() === 'eventcam' ? import('./eventcam/Entry') : import('./captionEntry');
entry.then((m) => m.mount(root));
