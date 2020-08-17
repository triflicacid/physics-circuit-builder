import Popup from 'classes/popup';
import Page from './index';
import Tab from './tab';
import File from './file';
import Controls from './controls';
import * as utils from 'assets/utils';
import { NullError } from 'classes/errors';

export default function (): void {
  (<any>window).Page = Page;

  // console.log("%cSetting up app...", "color: lightblue; font-weight: bold;");

  // Tab Menu
  // let tabs: NodeListOf<HTMLElement> = document.querySelectorAll('.menu li a');
  let tabs: HTMLElement[] = utils.querySelectorAll('.menu li a');
  for (let tab of tabs) {
    tab.onclick = () => Tab.select(tab);
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
  utils.getElementById('popupCover').onclick = function () {
    Page.openPopups.forEach((p: Popup) => p.close());
  };

  // Hide all 'ifFileOpen' things
  // let ifo: NodeListOf<HTMLElement> = document.querySelectorAll('.ifFileOpen');
  let ifo: HTMLElement[] = utils.querySelectorAll('.ifFileOpen');
  for (let e of ifo) {
    Page.hide(e);
  }

  File.closeFilePopup.extraButton('Continue & Close', File.close);

  // Apple sliders
  // let sliders: NodeListOf<HTMLElement> = document.querySelectorAll('.appleSlider');
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
  Controls.init();
  Page.hide(Controls._analyse.analyseCircuit);
  Page.hide(Controls._analyse.analyseWire);
};