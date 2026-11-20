// Neon Bay Cover Studio — bootstrap. Builds the editor, loads the sample
// photos, and, when opened with ?shot=…, hands over to the screenshot scenes
// in shots.js instead of the normal editor view.

import { createEditor } from './editor.js';
import { runShotMode, shotName } from './shots.js';

window.addEventListener('DOMContentLoaded', async () => {
  const editor = createEditor();
  await editor.init();
  if (shotName()) await runShotMode(editor);
});
