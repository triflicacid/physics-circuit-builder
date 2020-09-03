import Component from "classes/component/Component";
import type Circuit from "classes/circuit";
import p5 from "p5";
import * as utils from "assets/utils";
import { IAdditionalComponentData, IComponentData } from "models/saveData";
import IAmmeterData from "./interface";

/**
 * Ammeter: measure current and diaplay it
 * @extends Component
 *
 * @property _units             Units of ammeter (index of Ammeter.UNITS)
 *
 * @method changeUnits()        Change units
 * @method onScroll(e)          What to do when scrolled on?
 */
export class Ammeter extends Component {
  protected _units: AmmeterUnitsIndex = AmmeterUnitsIndex.AMPS; // Index of units in AmmeterUnits

  public constructor(parentCircuit: Circuit) {
    super(parentCircuit);
    this._resistance = Component.LOW_RESISTANCE;
  }

  public get units(): string { return AmmeterUnits[this._units]; }

  public render(): void {
    super.render((p: p5, colour: p5.Color, running: boolean): void => {
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
      p.textSize(25);
      p.text(this.units, 0, 0);
      p.textStyle(p.NORMAL);

      // Reading of current in green label
      if (running) {
        p.strokeWeight(1);
        p.stroke(0, 100, 0);
        p.fill(160, 255, 200);
        p.rect(0, this._h / 1.3, this._w, this._h / 3);

        p.textSize(Component.SMALL_TEXT);
        p.fill(0);
        p.noStroke();
        const textCoords: [number, number] = [0, this._h / 1.25];
        if (isOn) {
          let current: number = this.current;

          if (this._units === AmmeterUnitsIndex.MICRO_AMPS) current *= 1e6;
          else if (this._units === AmmeterUnitsIndex.MILLI_AMPS) current *= 1e3;
          else if (this._units === AmmeterUnitsIndex.KILO_AMPS) current *= 1e-3;

          if (current !== 0) {
            current = utils.roundTo(current, 1);
            if (current === 0) p.text('< 0.1', ...textCoords);
            else if (current > 1e4) p.text('> 10,000', ...textCoords);
            else p.text(utils.commifyNumber(current), ...textCoords);
          } else {
            p.text(utils.commifyNumber(current), ...textCoords);
          }
        } else {
          p.text('- - -', ...textCoords);
        }
      }
      p.textAlign(p.LEFT, p.TOP);
    });
  }

  /**
   * Sitch between units
   * @param  {Number} x How much to change _units by
   * @return {Number} New unit index (Ammeter.UNITS)
   */
  public changeUnits(x: number = 1): AmmeterUnitsIndex {
    this._units += x;
    if (this._units === AmmeterUnits.length) this._units = 0;
    else if (this._units < 0) this._units = AmmeterUnits.length - 1;
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
  public apply(data: IAmmeterData): Ammeter {
    super.apply(data);

    if (typeof data.units === 'number' && AmmeterUnitsIndex[data.units] !== undefined) this._units = data.units;
    return this;
  }
}

export enum AmmeterUnitsIndex {
  MICRO_AMPS,
  MILLI_AMPS,
  AMPS,
  KILO_AMPS,
}

export const AmmeterUnits: string[] = ["μA", "mA", "A", "kA"];

export default Ammeter;