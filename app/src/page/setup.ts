import Popup from 'classes/popup';
import Page from './index';
import Tab from './tab';
import File from './file';
import Controls from './controls';
import * as utils from 'assets/utils';
import { NullError } from 'classes/errors';
import Vars from './vars';
import { WireContainer, MaterialContainer } from 'classes/component/all/index';
import { IMaterialDef } from 'models/material';
import Wire from 'classes/wire';
import { IComponentInfoCollection } from 'models/ComponentInfo';

export default async function (): Promise<void> {
  console.group("Setting Up...");

  (<any>window).Page = Page;

  // console.log("%cSetting up app...", "color: lightblue; font-weight: bold;");

  // Tab Menu
  // let tabs: NodeListOf<HTMLElement> = document.querySelectorAll('.menu li a');
  console.log("Adding onClick to menu tabs...");
  let tabs: HTMLElement[] = utils.querySelectorAll('.menu li a');
  for (let tab of tabs) {
    tab.onclick = () => Tab.select(tab);
  }

  // Tab Contents
  // tabs = document.querySelectorAll('.menu-tabs .menu-tab');
  console.log("Hidding tabs...");
  tabs = utils.querySelectorAll('.menu-tabs .menu-tab');
  for (let tab of tabs) {
    tab.setAttribute('hidden', 'hidden');
  }

  // Popup cover
  console.log("Hidding popup cover...");
  utils.getElementById('popupCover').setAttribute('hidden', 'hidden');

  // Load files
  console.log("Updating file list...");
  File.updateList();

  // When click on popupCOver, remove all popups
  console.log("Adding onClick to popup cover...");
  utils.getElementById('popupCover').onclick = function () {
    Page.openPopups.forEach((p: Popup) => p.close());
  };

  // Hide all 'ifFileOpen' things
  // let ifo: NodeListOf<HTMLElement> = document.querySelectorAll('.ifFileOpen');
  console.log("Hidding ifFileOpen things...");
  let ifo: HTMLElement[] = utils.querySelectorAll('.ifFileOpen');
  for (let e of ifo) {
    Page.hide(e);
  }

  console.log("Adding extra button to closeFile popup...");
  File.closeFilePopup.extraButton('Continue & Close', File.close);

  // Apple sliders
  // let sliders: NodeListOf<HTMLElement> = document.querySelectorAll('.appleSlider');
  console.log("Preparing apple sliders...");
  let sliders: HTMLElement[] = utils.querySelectorAll('.appleSlider');
  for (let slider of sliders) {
    if (slider.dataset.id === undefined) throw new NullError("<HTMLElement>.dataset", "Expected .appleSlider elements to have a dataset-id: " + slider);
    const id: string = slider.dataset.id;
    delete slider.dataset.id;
    slider.innerHTML = '<input class="toggle" id="' + id + '" type="checkbox" /><label id="control" class="control" for="' + id + '"></label><div class="atContainer"></div>';

    // const toggle: NodeListOf<HTMLElement> = slider.querySelectorAll(".toggle");
    const toggle: HTMLElement[] = utils.querySelectorAll(".toggle", slider);

    if (toggle[0] instanceof HTMLInputElement) {
      const elem: HTMLInputElement = toggle[0];
      elem.addEventListener('change', () => elem.checked ? slider.classList.add('isChecked') : slider.classList.remove('isChecked'));
    }
  }

  // Setup Controls
  console.log("Setting up controls...");
  Controls.init();
  Page.hide(Controls._analyse.analyseCircuit);
  Page.hide(Controls._analyse.analyseWire);

  {
    const path: string = './assets/data/materials.json';
    console.log("Fetching materials (" + path + ")...");

    // Load materials
    let response: Response = await fetch(path);
    let json: IMaterialDef[] = await response.json();
    for (let material of json) Vars.materials.push(material);

    // Update material list for components
    WireContainer.getMaterials();
    MaterialContainer.getMaterials();
    Wire.getMaterials();
  }

  {
    const path: string = './assets/data/components.json';
    console.log("Fetching component info (" + path + ")...");

    // Load components (for live help)
    let response: Response = await fetch(path);
    let json: IComponentInfoCollection = await response.json();
    for (let name in json) {
      if (json.hasOwnProperty(name)) Vars.componentInfo[name] = json[name];
    }
  }

  console.log("-- Finished");
  console.groupEnd();
  Page.isLoaded = true;
};