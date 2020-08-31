import Component from "classes/component/Component";
import type Circuit from "classes/circuit";
import * as utils from 'assets/utils';
import p5 from "p5";
import { MouseButton, NBoolean } from "models/enum";
import { IAdditionalComponentData, IComponentData } from "models/saveData";
import IResistorData from "./interface";
import Config from "assets/config";

/**
 * Component with a resistance
 * @extends Component
 *
 * @property american          Should we use the american symbol?
 *
 * @method onClick()            RIGHT-CLICK: Toggle between American and British symbols
 */
export class Resistor extends Component {
  public static SMALL_HEIGHT = 17; // E.g. box, arrow

  public american: boolean = false;

  public constructor(parentCircuit: Circuit) {
    super(parentCircuit);
    this._resistance = 1;

    this._h /= 3;
    this._isConfigurable = true;
  }

  protected _updateConfigStuff(clear: boolean = true): void {
    if (clear) this.configOptions.length = 0;

    // Resistance
    this.configOptions.push(Config.newNumberInput(false, "Resistance", 1e-4, 1e4, this._resistance, 1, (c: Resistor, value: number): void => {
      c._resistance = +value;
    })(this));

    super._updateConfigStuff(false);
  }

  public render(fn?: (p: p5, colour: p5.Color, running: boolean) => void): void {
    const isOn = this.isOn();

    super.render((p: p5, colour: p5.Color, running: boolean): void => {
      p.strokeWeight(2);
      p.stroke(colour);
      p.noFill();

      if (this.american) {
        const dx = this._w / 10;
        const dy = 8;

        p.beginShape();
        const startX = -this._w / 2;
        const limX = this._w / 2;
        for (
          let i = 0, x = startX, y = 0; x < limX; x += dx, i++, y = i % 2 === 0 ? -dy : dy
        ) {
          p.vertex(x, y);
        }
        p.vertex(this._w / 2, 0);
        p.endShape();
      } else {
        p.rect(0, 0, this._w, Resistor.SMALL_HEIGHT);
      }

      // Resistance in green label box
      if (running && this.control.showInfo) {
        p.textAlign(p.CENTER, p.CENTER);
        p.strokeWeight(1);
        p.stroke(0, 100, 0);
        p.fill(160, 255, 200);
        let padTop, textYOffset;
        if (this.constructor.name === 'Thermistor') {
          padTop = 0.58;
          textYOffset = 0.03;
        } else {
          padTop = 0.75;
          textYOffset = 0.05;
        }
        p.rect(0, this._h / padTop, this._w, this._h / 1.2);

        p.textSize(Component.SMALL_TEXT);
        p.noStroke();
        p.fill(0);
        let text: string = this.resistance.toString();
        if (isOn) {
          if (this._resistance === 0 || this._resistance === Component.ZERO_RESISTANCE) {
            text = "0";
          } else {
            if (this._resistance < 0.0001) text = "< 0.1m";
            else if (this._resistance < 0.1)
              text = utils.roundTo(this._resistance * 1e3, 1) + "m";
            else if (this._resistance > 1e4)
              text = utils.roundTo(this._resistance / 1e3, 1) + "k";
            else text = utils.roundTo(this._resistance, 1).toString();
          }
          text += 'Ω';
        } else {
          text = "- - -";
        }
        p.text(text, 0, this._h / (padTop - textYOffset));
        p.textAlign(p.LEFT, p.TOP);
      }

      if (typeof fn === "function") fn(p, colour, running);
    });
  }

  public onMouseDown(event: MouseEvent): void {
    // If right-mouse click, toggle US<->UK rendering
    if (event.button === MouseButton.Right) {
      this.american = !this.american;
    }
  }

  /**
   * Get data for this component
   * @param {IAdditionalComponentData} customData More data to add
   * @return {IComponentData} Data
   */
  public getData(customData?: IAdditionalComponentData): IComponentData {
    const data: IAdditionalComponentData = {
      resistance: this._resistance,
      us: this.american ? NBoolean.True : NBoolean.False,
      ...customData
    };
    return super.getData(data);
  }

  /**
   * Given data, load into object
   * @param  data
   * @return this
   */
  public apply(data: IResistorData): Resistor {
    super.apply(data);

    if (typeof data.resistance === 'number' && !isNaN(data.resistance)) this._resistance = data.resistance;
    if (data.us === NBoolean.True || data.us === NBoolean.False) this.american = data.us === NBoolean.True;
    return this;
  }
}

export default Resistor;