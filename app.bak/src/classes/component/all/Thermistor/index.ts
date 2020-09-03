import Resistor from "../Resistor/index";
import type Circuit from "classes/circuit";
import * as utils from 'assets/utils';
import Component from "classes/component/Component";
import Control from "classes/control";
import p5 from "p5";
import Sounds from "assets/sounds";
import { IAdditionalComponentData, IComponentData } from "models/saveData";
import IThermistorData from "./interface";

/**
 * Resistance changes with heat
 * @extends Resistor
 *
 * @property _mode              Thermistor mode
 * @property _min               Minimum temperature
 * @property _max               Maximum temperature
 */
export class Thermistor extends Resistor {
  public static minResistance = Component.ZERO_RESISTANCE;
  public static maxResistance = 2;

  protected _min: number = 0;
  protected _max: number = 0;
  protected _mode: ThermistorMode = 0;

  public constructor(parentCircuit: Circuit) {
    super(parentCircuit);
    this.mode = ThermistorMode.NTC;
  }

  public get mode(): ThermistorMode { return this._mode; }
  public set mode(m: ThermistorMode) {
    this._mode = m;
    [this._min, this._max] = (m === ThermistorMode.NTC) ? [-55, 200] : [0, 120];
  }

  public get min(): number { return this._min; }
  public get max(): number { return this._max; }

  /**
   * Return string representation of object (name)
   * @override
   * @return {String} description
   */
  public toString(): string {
    const modeStr: string = this._mode === ThermistorMode.NTC ? "NTC" : "PTC";
    return modeStr + "-" + super.toString();
  }

  public eval(): void {
    super.eval(() => {
      // Calculate resistance of component
      const temp: number = utils.clamp(this._externalTemp, Control.MIN_TEMP, Control.MAX_TEMP);

      // Default; PTC. smaller temp -> smaller resistance
      let min: number = Thermistor.minResistance;
      let max: number = Thermistor.maxResistance;

      // If NTC; smaller temp -> larger resistance
      if (this._mode === ThermistorMode.NTC) [min, max] = [max, min];

      const r: number = utils.mapNumber(temp, Control.MIN_TEMP, Control.MAX_TEMP, min, max);
      this._resistance = r;
    });
  }

  public render(): void {
    super.render((p: p5, colour: p5.Color) => {
      p.strokeWeight(1.3);
      p.stroke(colour);

      const ext: number = 8;

      // Bottom tail
      const len = 10;
      const y = this._h / 2 + ext;
      const x = -this._w / 2;
      p.line(x, y, x + len, y);

      // Diagonal
      const dx = this._w / 1.25;
      p.line(x + len, y, x + dx, -this._h / 2 - ext);

      // Text
      const text = (this._mode === ThermistorMode.NTC ? "-" : "+") + "t°";
      p.noStroke();
      p.fill(colour);
      p.textSize(Component.SMALL_TEXT);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(text, 0, y);
      p.textAlign(p.LEFT, p.TOP);
    });
  }

  /**
   * Toggle between modes
   */
  public toggle(): void {
    if (this._mode === ThermistorMode.PTC) {
      this._mode = ThermistorMode.NTC;
      Sounds.Play("toggle-off");
    } else {
      this._mode = ThermistorMode.PTC;
      Sounds.Play("toggle-on");
    }
  }

  public onMouseDown(event: MouseEvent): void {
    this.toggle();
  }

  /**
   * Get data for this component
   * @param {IAdditionalComponentData} customData More data to add
   * @return {IComponentData} Data
   */
  public getData(customData?: IAdditionalComponentData): IComponentData {
    const data: IAdditionalComponentData = {
      mode: this._mode,
      ...customData
    };
    return super.getData(data);
  }

  /**
   * Given data, load into object
   * @param  data
   * @return this
   */
  public apply(data: IThermistorData): Thermistor {
    super.apply(data);

    if (data.mode === ThermistorMode.PTC || data.mode === ThermistorMode.NTC) this._mode = data.mode;
    return this;
  }
}

export enum ThermistorMode {
  NTC,
  PTC
}

export default Thermistor;