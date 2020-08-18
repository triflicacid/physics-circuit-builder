import __setup__ from 'page/setup';
import __main__ from 'page/main';

// console.log("%cApp fully loaded.", "color: lightblue; font-weight: bold;");

window.addEventListener('load', async () => {
  // console.log("%cInitiating...", "color: lightblue; font-weight: bold;");
  await __setup__();
  await __main__();
});
