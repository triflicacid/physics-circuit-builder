import type Circuit from "classes/circuit";
import * as utils from 'assets/utils';
import Cell from "../Cell/index";
import Component from "classes/component/Component";
import p5 from "p5";
import { Direction } from "models/enum";
import { IAdditionalComponentData, IComponentData } from "models/saveData";
import IDCPowerSupplyData from "./interface";

/**
 * A direct current-producing thing. Linked to slider
 * DC power
 * @extends Cell
 *
 * @property _maxVoltage     Maximum voltage we can produce
 * @property _delta         On scroll, how much should we change the voltage by?
 *
 * @method sensitivity(?d)   Get / Set this._delta
 * @method onScroll(e)          What to do when scrolled on?
 */
export class DCPowerSupply extends Cell {
  protected _delta: number = 0.1;
  protected _maxVoltage: number = 230;

  public constructor(parentCircuit: Circuit) {
    super(parentCircuit);
    this._voltage = 1.5;
  }

  public get voltage(): number { return this._voltage; }
  public set voltage(v: number) { this._voltage = utils.clamp(v, -this._maxVoltage, this._maxVoltage); }

  public get maxVoltage(): number { return this._maxVoltage; }

  /**
   * Get / Set this._delta
   * @param  {Number} val    If not empty: what to set this._delta to
   * @return {Number}        The sentitivity (this._delta)
   */
  public sensitivity(val?: number): number {
    if (val !== undefined) {
      val = val <= 0 ? 0.1 : utils.clamp(val, 1e-3, 1e3);
      this._delta = val;
    }
    return this._delta;
  }

  public render(): void {
    // const isOn = this.isOn();

    Component.prototype.render.call(this, (p: p5, colour: p5.Color, running: boolean) => {
      // Circle
      p.strokeWeight(1);
      p.stroke(colour);
      p.noFill();
      p.ellipse(0, 0, this._w, this._w);

      p.textAlign(p.CENTER, p.CENTER);
      // Plus / Minus sign
      let pad = 15;
      p.noStroke();
      p.fill(colour);
      p.textStyle(p.BOLD);
      p.textSize(22);

      // RIGHT: + -
      // LEFT: - +
      const isRight: boolean = this.direction === Direction.Right;
      let minus: [number, number] = isRight ? [-(this._w / 2) + pad, 0] : [this._w / 2 - pad, -2];
      let plus: [number, number] = isRight ? [this._w / 2 - pad, 0] : [-(this._w / 2) + pad, 0];

      if (running) p.fill(10, 20, 200);
      p.text("-", ...minus);

      if (running) p.fill(200, 10, 20);
      p.text("+", ...plus);

      p.textStyle(p.NORMAL);

      // Show voltage in green box
      if (running && this.control.showInfo) {
        p.strokeWeight(1);
        p.stroke(0, 100, 0);
        p.fill(160, 255, 200);

        let h = this._h / 3;
        p.rect(0, this._h / 2 + h, this._w, h);

        p.textSize(Component.SMALL_TEXT);
        p.noStroke();
        p.fill(0);
        p.text(this.value() + "V", 0, this._h / 1.9 + h);
      }
      p.textAlign(p.LEFT, p.TOP);
    });
  }

  /**
   * Get formatted voltage value
   * @return {Number} Formatted voltage
   */
  public value(): number {
    let v: string = this.voltage.toFixed(1);
    return +v;
  }

  public onScroll(event: WheelEvent) {
    const delta = Math.sign(event.deltaY) * -this._delta;
    this.voltage += delta;
  }

  /**
   * Get data for this component
   * @param {IAdditionalComponentData} customData More data to add
   * @return {IComponentData} Data
   */
  public getData(customData?: IAdditionalComponentData): IComponentData {
    const data: IAdditionalComponentData = {
      delta: this._delta,
      maxVoltage: this._maxVoltage,
      ...customData
    };
    return super.getData(data);
  }

  /**
   * Given data, load into object
   * @param  data
   * @return this
   */
  public apply(data: IDCPowerSupplyData): DCPowerSupply {
    super.apply(data);

    if (typeof data.delta === 'number' && !isNaN(data.delta)) this._delta = data.delta;
    if (typeof data.maxVoltage === 'number' && !isNaN(data.maxVoltage)) this._maxVoltage = data.maxVoltage;
    return this;
  }
}

export default DCPowerSupply;