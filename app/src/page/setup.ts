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

  // (<any>window).Page = Page;


  // Tab Menu
  // let tabs: NodeListOf<HTMLElement> = document.querySelectorAll('.menu li a');
  let tabs: HTMLElement[] = utils.querySelectorAll('.menu li a');
  for (let tab of tabs) {
    tab.addEventListener('click', () => Tab.select(tab));
  }

  // Tab Contents
  // tabs = document.querySelectorAll('.menu-tabs .menu-tab');
  tabs = utils.querySelectorAll('.menu-tabs .menu-tab');
  for (let tab of tabs) {
    tab.setAttribute('hidden', 'hidden');
  }

  // Popup cover
  utils.getElementById('popupCover').setAttribute('hidden', 'hidden');

  // Load files
  File.updateList();

  // When click on popupCOver, remove all popups
  utils.getElementById('popupCover').addEventListener('click', () => {
    Page.openPopups.forEach((p: Popup) => p.close());
  });

  // Hide all 'ifFileOpen' things
  let ifo: HTMLElement[] = utils.querySelectorAll('.ifFileOpen');
  for (let e of ifo) {
    Page.hide(e);
  }

  File.closeFilePopup.extraButton('Continue & Close', File.close);

  // Apple sliders
  let sliders: HTMLElement[] = utils.querySelectorAll('.appleSlider');
  for (let slider of sliders) {
    if (slider.dataset.id === void 0) throw new NullError("<HTMLElement>.dataset", "Expected .appleSlider elements to have a dataset-id: " + slider);
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
  Controls.init();

  {
    const path: string = './assets/data/materials.json';
    console.log("Fetching materials (" + path + ")...");

    // Load materials
    let response: Response = await fetch(path);
    let json: IMaterialDef[] = await response.json();
    Vars.materials = json;

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
    Vars.componentInfo = json;
    Vars.componentInfo = <IComponentInfoCollection>utils.sortObject(Vars.componentInfo);
  }

  console.groupEnd();
  Page.isLoaded = true;
};