import Popup, { PopupMode } from 'classes/popup';
import Controls from './controls';
import Control from 'classes/control';
import * as utils from 'assets/utils';
import { NullError } from 'classes/errors';
import Sounds from 'assets/sounds';
import { File } from './file';
import Component from 'classes/component/Component';
import Circuit from 'classes/circuit';
import Beep from 'assets/beep';
import Vars from './vars';

export default class Page {
  public static isLoaded: boolean = false; // Has the page loaded?
  public static control: Control | null = null; // Current Control object
  public static readonly window: HTMLElement = utils.getElementById("window"); // "Parent" or root element
  public static readonly openPopups: Popup[] = []; // Array of OPEN popups
  public static readonly container: string = "canvas-container"; // ID of container of circuit <canvas />
  public static playSounds: boolean = true; // Play sounds?
  public static autoStartCircuit: boolean = true; // Auto-start circuit on opening

  public static readonly utils = utils;
  public static readonly sounds = Sounds;
  public static readonly beep = Beep;
  public static readonly popup = Popup;
  public static readonly popupMode = PopupMode;
  public static readonly file = File;
  public static readonly controls = Controls;
  public static readonly component = Component;
  public static readonly circuit = Circuit;
  public static readonly vars = Vars;

  /**
   * Show a given element
   * @param {HTMLElement} elem Element to show
   */
  public static show(elem: HTMLElement | null): void {
    if (elem == null) throw new NullError("elem", "Cannot 'show' null");
    elem.removeAttribute("hidden");
  }

  /**
   * Hide a given element
   * @param {HTMLElement} elem Element to hide
   */
  public static hide(elem: HTMLElement | null): void {
    if (elem == null) throw new NullError("elem", "Cannot 'hide' null");
    elem.setAttribute("hidden", "hidden");
  }

  /**
   * Is a circuit open?
   * @return {Boolean}
   */
  public static isCircuitOpen(): boolean {
    return Page.control instanceof Control;
  }

  /**
   * Throw a circuit-caused error
   * @param  {String} title    Error title
   * @param  {String} msg      Error message
   * @return {Popup} The popup
   */
  public static circuitError(title: string, ...msg: string[]): Popup {
    return new Popup(title, ...msg)
      .mode(PopupMode.Error)
      .onClose(() => Controls.stop())
      .open();
  }
}