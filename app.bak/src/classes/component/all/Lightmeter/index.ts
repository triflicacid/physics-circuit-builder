import Component from "classes/component/Component";
import Circuit from "classes/circuit";
import p5 from "p5";
import * as utils from 'assets/utils';
import { IAdditionalComponentData, IComponentData } from "models/saveData";
import ILightmeterData from "./interface";

/**
 * Lightmeter: measure light hitting the meter
 * @extends Component
 *
 * @property _units             Index of units
 *
 * @method changeUnits()        Change units
 * @method onScroll(e)          What to do when scrolled on?
 */
export class Lightmeter extends Component {
  protected _units: LightmeterUnitsIndex = LightmeterUnitsIndex.Normal;

  public constructor(parentCircuit: Circuit) {
    super(parentCircuit);
    this._resistance = Component.LOW_RESISTANCE;
  }

  public get units(): string { return LightmeterUnits[this._units]; }

  /**
   * Render the component
   */
  public render() {
    super.render((p: p5, colour: p5.Color, running: boolean) => {
      const isOn = this.isOn();

      // Circle
      p.strokeWeight(1);
      p.stroke(colour);
      if (this._blown) {
        p.fill(utils.randomInt(100));
      } else {
        p.noFill();
      }
      p.ellipse(0, 0, this._w, this._w);

      // Units
      p.textAlign(p.CENTER, p.CENTER);
      p.textStyle(p.BOLD);
      p.noStroke();
      p.fill(colour);
      p.textSize(22);
      p.text(this.units, 0, 0);
      p.textStyle(p.NORMAL);

      // Reading of lumens in green label
      if (running) {
        p.strokeWeight(1);
        p.stroke(0, 100, 0);
        p.fill(160, 255, 200);
        p.rect(0, this._h / 1.3, this._w, this._h / 3);

        p.textSize(Component.SMALL_TEXT);
        p.noStroke();
        p.fill(0);
        const textCoords: [number, number] = [0, this._h / 1.25];
        if (isOn) {
          let lumens = this._lightRecieving;
          if (this._units === LightmeterUnitsIndex.Micro) lumens *= 1e6;
          else if (this._units === LightmeterUnitsIndex.Milli) lumens *= 1e3;
          else if (this._units === LightmeterUnitsIndex.Kilo) lumens *= 1e-3; // klm

          if (lumens !== 0) {
            lumens = utils.roundTo(lumens, 1);
            if (lumens === 0) p.text("< 0.1", ...textCoords);
            else if (lumens > 1e4) p.text("> 10,000", ...textCoords);
            else p.text(lumens, ...textCoords);
          } else {
            p.text(lumens, ...textCoords);
          }
        } else {
          p.text("- - -", ...textCoords);
        }
      }
      p.textAlign(p.LEFT, p.TOP);
    });
  }

  /**
   * Switch between units
   * @param  {Number} x How much to change _units by
   * @return {Number} New unit index (Ammeter.UNITS)
   */
  public changeUnits(x: number = 1): LightmeterUnitsIndex {
    this._units += x;
    if (this._units === LightmeterUnits.length) this._units = 0;
    else if (this._units < 0) this._units = LightmeterUnits.length - 1;
    return this._units;
  }

  public onMouseDown(event: MouseEvent): void {
    this.changeUnits(1);
  }

  public onScroll(event: WheelEvent): void {
    const delta: number = Math.sign(event.deltaY) * -1;
    this.changeUnits(delta);
  }

  /**
   * Get data for this component
   * @param {IAdditionalComponentData} customData More data to add
   * @return {IComponentData} Data
   */
  public getData(customData?: IAdditionalComponentData): IComponentData {
    const data: IAdditionalComponentData = {
      units: this._units,
      ...customData
    };
    return super.getData(data);
  }

  /**
   * Given data, load into object
   * @param  data Additional data
   * @return      this
   */
  public apply(data: ILightmeterData): Lightmeter {
    super.apply(data);

    if (typeof data.units === 'number' && LightmeterUnitsIndex[data.units] !== undefined) this._units = data.units;
    return this;
  }
}

export enum LightmeterUnitsIndex {
  Micro,
  Milli,
  Normal,
  Kilo,
}

export const LightmeterUnits: string[] = ["μlm", "mlm", "lm", "klm"];

export default Lightmeter;
