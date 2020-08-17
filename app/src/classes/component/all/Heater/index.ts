import Component from "classes/component/Component";
import type Circuit from "classes/circuit";
import * as utils from 'assets/utils';
import Control from "classes/control";
import p5 from "p5";
import { IAdditionalComponentData, IComponentData } from "models/saveData";
import IHeaterData from "./interface";

/**
 * Heater: convert electrical energy to heat
 * - Use H = i * i * r * t
 * @extends Component
 *
 * @property _joules    Joules of energy
 * @property _efficiency    'Efficiency' of heater
 * @property _maxTemp   Maximum tenmperature in degrees celcius
 * @property _maxJoules Maximum temperature, but in joules (shouldn't be set)
 *
 * @method temp()       Get displayable temperature reading
 * @method percent()    How heated are we?
 * @method getColour()  Get colour of heater
 */
export class Heater extends Component {
  protected _joules: number = 0;
  protected _efficiency: number;
  protected _maxTemp: number;
  protected _maxTempJoules: number;

  public constructor(parentCircuit: Circuit) {
    super(parentCircuit);
    this._resistance = 2.5;
    this._h /= 2;

    this._efficiency = utils.randomInt(10, 60) * 100;
    this._maxTemp = Control.MAX_TEMP;
    this._maxTempJoules = utils.deg2joules(this._maxTemp);
  }

  // Get degrees celcius temperature of heater
  public get degreesCelcius(): number { return utils.joules2deg(this._joules); }
  public set degreesCelcius(t: number) {
    t = utils.clamp(t, 0, this._maxTemp + 1);
    this._joules = utils.deg2joules(t);
  }

  // Max temp: degrees celcius
  public get maxTemp(): number { return this._maxTemp; }
  public set maxTemp(t: number) {
    t = utils.clamp(t, 0, Control.MAX_TEMP + 1);
    if (t !== this._maxTemp) {
      this._maxTemp = t;
      this._maxTempJoules = utils.deg2joules(t);
    }
  }

  public get efficiency(): number { return this._efficiency; }
  public set efficiency(value: number) { this._efficiency = utils.clamp(value, 0, 100); }

  /**
   * Return aesthetic temperature reading
   * @param  {Number} dp  How many decimal points?
   * @return {String} Output string
     */
  public temp(dp: number = 3): string {
    const temp: string = utils.roundTo(this.degreesCelcius, dp).toFixed(dp);
    return (+temp) + "°C";
  }

  /**
   * Temperature / max temperature
   * @return {Number}
   */
  public percent(): number {
    const p: number = (this.degreesCelcius / this._maxTemp) * 100;
    return p;
  }

  /**
   * Get colour of heater
   * @param {Boolean} asHsb   Return HSB (true) or RGB (false)?
   * @return {Number[]} RGB colour array
   */
  public getColour(asHsb: boolean = false): [number, number, number] {
    const bright: number = this.percent();
    const hsb: [number, number, number] = [0, bright, 100];
    return asHsb ? hsb : utils.hsb2rgb(...hsb);
  }

  public eval(): void {
    super.eval(() => {
      let update: boolean = false;
      if (this.isOn()) {
        // Update temperature in joules
        if (this._joules < this._maxTempJoules) {
          this._joules += this.getHeat() * this._efficiency;
          if (this._joules > this._maxTempJoules) this._joules = this._maxTempJoules;
          update = true;
        }
      } else {
        // Decrease temperature
        if (this._joules > 0) {
          this._joules -= Math.random() * this._efficiency;
          if (this._joules < 0) this._joules = 0;
          update = true;
        }
      }

      // If updated, update thermistor exteral temp and display
      if (update) this.control.updateTemp();
    });
  }

  public render(): void {
    super.render((p: p5, colour: p5.Color, running: boolean): void => {
      // Rectange
      p.stroke(colour);
      p.strokeWeight(1.5);
      if (running) {
        p.fill(...this.getColour());
      } else {
        p.noFill();
      }
      p.rect(0, 0, this._w, this._h);

      // Lines
      p.strokeWeight(1);
      p.stroke(0);
      const dx: number = this._w / 5;
      const limX: number = this._w / 2;
      const y: number = this._h / 2;
      for (let x = -this._w / 2; x < limX; x += dx) {
        p.line(x, -y, x, y);
      }

      // Reading of current in green label
      if (running) {
        p.textAlign(p.CENTER, p.CENTER);
        p.strokeWeight(1);
        p.stroke(0, 100, 0);
        p.fill(160, 255, 200);
        p.rect(0, this._h, this._w, this._h / 1.6);

        p.textSize(Component.SMALL_TEXT);
        p.fill(0);
        p.noStroke();
        let temp: string = this._blown ? "- - -" : this.temp();
        p.text(temp, 0, this._h + 1);
        p.textAlign(p.LEFT, p.TOP);
      }
    });
  }

  /**
   * Get data for this component
   * @param {IAdditionalComponentData} customData More data to add
   * @return {IComponentData} Data
   */
  public getData(customData?: IAdditionalComponentData): IComponentData {
    const data: IAdditionalComponentData = {
      eff: this.efficiency,
      maxT: this.maxTemp,
      ...customData
    };
    return super.getData(data);
  }

  /**
   * Given data, load into object
   * @param  data
   * @return this
   */
  public apply(data: IHeaterData): Heater {
    super.apply(data);

    if (typeof data.eff === 'number' && !isNaN(data.eff)) this.efficiency = data.eff;
    if (typeof data.maxT === 'number' && !isNaN(data.maxT)) this.maxTemp = data.maxT;
    return this;
  }
}

export default Heater;