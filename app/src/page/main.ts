import File from './file';
import Page from './index';
import { NullError } from 'classes/errors';

export default async function () {
  // console.log("%cRunning main code...", "color: lightblue; font-weight: bold;");

  await File.load('twoWaySwitch.json');

  if (Page.control != null) {
    Page.control.isRunning = true;
    // Control._gridSnapping = true;
  } else {
    throw new NullError("Page.control", "By __main__, Control must be initialized.");
  }
}