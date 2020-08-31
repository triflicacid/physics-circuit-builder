import Diode from "../Diode/index";
import type Circuit from "classes/circuit";
import * as utils from 'assets/utils';
import Component from "classes/component/Component";
import p5 from "p5";
import { Direction } from "models/enum";
import { IAdditionalComponentData, IComponentData } from "models/saveData";
import ILEDData from "./interface";
import Config from "assets/config";

/**
 * Light Emitting Diode [LED]: diode, but emits light
 * @extends Diode
 *
 * @property _hue               Hue of LED (0-360)
 * @property _lpw               Lumens per Watt
 *
 * @method getColour()          Get colour of LED
 * @method onScroll(e)          What to do when scrolled on?
 */
export class LightEmittingDiode extends Diode {
  protected _hue: number;

  public constructor(parentCircuit: Circuit) {
    super(parentCircuit);
    this._hue = utils.randomInt(0, 259);
    this._lpw = 90; // between 80 - 100, (https://www.rapidtables.com/calc/light/how-watt-to-lumen.html)
    this._isConfigurable = true;
  }

  protected _updateConfigStuff(clear: boolean = true): void {
    if (clear) this.configOptions.length = 0;

    // Hue
    this.configOptions.push(Config.newNumberInput(true, "Hue", 0, 359, this._hue, 1, (c: LightEmittingDiode, value: number): void => {
      c._hue = +value;
    })(this));

    super._updateConfigStuff(false);
  }

  public get hue(): number { return this._hue; }
  public set hue(h: number) { this._hue = utils.clamp(h, 0, 259); }

  /**
   * Get RGB colour of LED
   * @param  {Boolean} asHsb  Return HSB or RGB?
   * @return {Number[]} RGB values
   */
  public getColour(asHsb: boolean = false): [number, number, number] {
    let s: number = 100;
    let hsb: [number, number, number] = [this.hue, s, 100];
    if (asHsb) {
      hsb = <[number, number, number]>hsb.map((n) => utils.roundTo(n, 1));
      return hsb;
    } else {
      let rgb = utils.hsb2rgb(...hsb);
      rgb = <[number, number, number]>rgb.map((n) => utils.roundTo(n, 1));
      return rgb;
    }
  }

  render() {
    // Call 'render' of super-super class
    Component.prototype.render.call(this, (p: p5, colour: p5.Color, running: boolean): void => {
      const isOn = this.isOn();
      const isFacingLeft = this._dir === Direction.Left;

      // Circle
      p.strokeWeight(1);
      p.stroke(colour);
      if (this._blown) {
        p.fill(utils.randomInt(100));
      } else if (running && isOn) {
        p.fill(...this.getColour());
      } else {
        p.noFill();
      }
      p.ellipse(0, 0, this._w, this._w);

      // Line and triangle (like >|)
      {
        p.push();
        p.rotate(this._angle);
        // Triangle
        let y = this._w / 3;
        let w = this._w / 4;

        p.fill((this._broken && running) ? p.color(255, 70, 80) : colour);
        p.noStroke();
        p.beginShape();
        if (isFacingLeft) {
          p.vertex(w, -y);
          p.vertex(w, y);
          p.vertex(-w, 0);
        } else {
          p.vertex(-w, y);
          p.vertex(-w, -y);
          p.vertex(w, 0);
        }
        p.endShape(p.CLOSE);

        // Line
        p.stroke(colour);
        let x = w;
        y = this._w / 3.5;
        if (isFacingLeft) {
          p.line(-x, -y, -x, y);
        } else {
          p.line(x, -y, x, y);
        }
        p.pop();
      }

      // Arrows
      const len: number = 10;
      const arr_off: number = 3;
      const rot_main: number = (isFacingLeft) ? (utils.Degrees[270] - utils.Degrees[45]) : (-utils.Degrees[45]);
      const rot_angle: number = (isFacingLeft) ? (this._angle + utils.Degrees[270] - utils.Degrees[45]) : (this._angle - utils.Degrees[45]);

      // Topmost
      p.push();
      let angle: number = this._angle + rot_main - utils.Degrees[10];
      let coords = utils.polToCart(angle, this._w / 2);
      p.translate(...coords);
      p.rotate(rot_angle);
      p.stroke(0);
      p.line(0, 0, len, 0);
      p.beginShape();
      p.fill(colour);
      p.vertex(len, arr_off);
      p.vertex(len, -arr_off);
      p.vertex(len + arr_off, 0);
      p.endShape(p.CLOSE);
      p.pop();

      // Bottommost
      p.push();
      angle = this._angle + rot_main + utils.Degrees[10] + utils.Degrees[5];
      coords = utils.polToCart(angle, this._w / 2);
      p.translate(...coords);
      p.rotate(rot_angle);
      p.stroke(0);
      p.line(0, 0, len, 0);
      p.beginShape();
      p.fill(colour);
      p.vertex(len, arr_off);
      p.vertex(len, -arr_off);
      p.vertex(len + arr_off, 0);
      p.endShape(p.CLOSE);
      p.pop();
    });
  }

  public onScroll(event: WheelEvent): void {
    const delta: number = Math.sign(event.deltaY) * -2;
    let newHu = this._hue + delta;
    if (newHu < 0) newHu += 360;
    else if (newHu >= 360) newHu -= 360;
    this.hue = newHu;
  }

  // Diode.onClick() -> flip direction

  /**
   * Get data for this component
   * @param {IAdditionalComponentData} customData More data to add
   * @return {IComponentData} Data
   */
  public getData(customData?: IAdditionalComponentData): IComponentData {
    const data: IAdditionalComponentData = {
      hue: this.hue,
      ...customData
    };
    return super.getData(data);
  }

  /**
   * Given data, load into object
   * @param  data
   * @return this
   */
  public apply(data: ILEDData): LightEmittingDiode {
    super.apply(data);

    if (typeof data.hue === 'number' && !isNaN(data.hue)) this.hue = data.hue;
    return this;
  }
}

export default LightEmittingDiode;