import type Circuit from "classes/circuit";
import * as utils from 'assets/utils';
import Component from "classes/component/Component";
import p5 from "p5";
import { Direction } from "models/enum";
import { IAdditionalComponentData, IComponentData } from "models/saveData";
import DCPowerSupply from "classes/component/all/DCPowerSupply/index";
import { ComponentError } from "classes/errors";
import IACPowerSupplyData from "./interface";

/**
 * An alternating current-producing thing
 * AC power
 * @extends DCPowerSupply
 *
 * @property _frame          After how many frames should we 'flip'
 * @property _lastFlipFrame  When did we last flip? (so we stop flipped twice per frame)
 * @property currentFrame    Get current frame of the control
 *
 * @method hertz(?hz)        Get / Set value (fps)
 * @method frame(?f)         Get / Set frame value (_frame)
 * @method onScroll(e)       What to do when scrolled on? - inherited from DCPowerSupply
 */
export class ACPowerSupply extends DCPowerSupply {
  protected _delta: number = 0.1;
  protected _maxVoltage: number = 230;
  protected _frame: number = 8;
  protected _lastFlipFrame: number = -1; // I.E. never

  public constructor(parentCircuit: Circuit) {
    super(parentCircuit);
    this._voltage = 1.5;
  }

  public get voltage(): number { return this._voltage; }
  public set voltage(v: number) { this._voltage = utils.clamp(v, -this._maxVoltage, this._maxVoltage); }

  public get maxVoltage(): number { return this._maxVoltage; }
  public get currentFrame(): number { return this.circuit.control.p5.frameCount; } //Get current frame that control is on

  /**
   * Get / Set cycles per second
   * @param  {Number} hz  If present, what to set hertz to; else, get.
   * @return {Number} Hertz (cycles per second)
   */
  public hertz(hz?: number): number {
    if (hz !== undefined) {
      let val: number = Math.round(hz);
      if (val <= 0) val = 1;
      let frames = this.circuit.control.frameRate() / val;
      this._frame = frames;
      return val;
    } else {
      return this.circuit.control.frameRate() / this._frame;
    }
  }

  /**
   * Get / Set _frame
   * @param  {Number} f   If present, what to set _frame to; else, get.
   * @return {Number} Execute every x frames...
    */
  public frame(f?: number): number {
    if (f !== undefined) {
      let val: number = Math.round(f);
      if (val <= 0) val = 1;
      this._frame = val;
    }
    return this._frame;
  }

  public eval(): void {
    Component.prototype.eval.call(this, () => {
      if (this.circuit.depth !== 0)
        throw new ComponentError(`ACPowerSupply component must be in top-level circuit`);
      if (
        this.currentFrame !== this._lastFlipFrame &&
        this.currentFrame % this._frame === 0
      ) {
        this._lastFlipFrame = this.currentFrame;
        this.flip(false);
      }
    });
  }

  public render(): void {
    const isOn = this.isOn();

    Component.prototype.render.call(this, (p: p5, colour: p5.Color, running: boolean) => {
      const isBlown: boolean = this.isBlown();

      // Circle
      p.strokeWeight(1);
      p.stroke(colour);
      p.noFill();
      p.ellipse(0, 0, this._w, this._w);

      // Sine Wave
      p.beginShape();
      p.strokeWeight(2);
      const bound: number = this._w / 4;
      if (running) {
        for (let x = 0; x <= 360; x += 5) {
          let px: number = utils.mapNumber(x, 0, 360, -bound, bound);
          let py: number = Math.sin(utils.deg2rad(x));
          py = this.direction === Direction.Right ?
            utils.mapNumber(py, -1, 1, -bound, bound) :
            utils.mapNumber(py, -1, 1, bound, -bound);
          p.vertex(px, py);
        }
        p.endShape();
      } else {
        p.line(-bound, 0, bound, 0);
      }

      // Plus sign
      if (running) {
        const [sign, ...fill] = (this.direction === Direction.Right || isBlown) ? ["+", 255, 0, 0] : ["-", 0, 0, 255];
        p.noStroke();
        p.fill(...fill);
        p.textSize(Component.SMALL_TEXT * 1.5);
        p.text(sign, this._w / 2 - 12, 0);
      }

      // Show voltage in green box
      if (running && this.control.showInfo) {
        p.textAlign(p.CENTER, p.CENTER);
        p.strokeWeight(1);
        p.stroke(0, 100, 0);
        p.fill(160, 255, 200);

        let h = this._h / 3;
        p.rect(0, this._h / 2 + h, this._w, h);

        p.textSize(Component.SMALL_TEXT);
        p.noStroke();
        p.fill(0);
        const textCoords: [number, number] = [0, this._h / 1.9 + h];
        if (isBlown) {
          p.text('- - -', ...textCoords);
        } else {
          let v: number = utils.roundTo(this.voltage, 1);
          if (!running) {
            p.text("±" + Math.abs(v) + "V", ...textCoords);
          } else {
            p.text(v + "V", ...textCoords);
          }
        }

        p.textAlign(p.LEFT, p.TOP);
      }
    }
    );
  }

  /**
   * Get data for this component
   * @param {IAdditionalComponentData} customData More data to add
   * @return {IComponentData} Data
   */
  public getData(customData?: IAdditionalComponentData): IComponentData {
    const data: IAdditionalComponentData = {
      frame: this._frame,
      ...customData
    };
    return super.getData(data);
  }

  /**
   * Given data, load into object
   * @param  data
   * @return this
   */
  public apply(data: IACPowerSupplyData): ACPowerSupply {
    super.apply(data);

    if (typeof data.frame === 'number' && !isNaN(data.frame)) this._frame = data.frame;
    return this;
  }
}

export default ACPowerSupply;