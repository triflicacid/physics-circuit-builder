import Component from "classes/component/Component";
import Circuit from "classes/circuit";
import p5 from "p5";
import * as utils from 'assets/utils';
import { IAdditionalComponentData, IComponentData } from "models/saveData";

/**
 * Thermometer: measure external temperature to thermometer
 * @extends Component
 *
 * @method howFull()            How full is the thermometer? (0..1 decimal)
 */
export class Thermometer extends Component {
  public static min: number = -20; // Minimum temperature we can read
  public static max: number = 100; // Maximum temperature we can read

  public constructor(parentCircuit: Circuit) {
    super(parentCircuit);
    this._resistance = Component.LOW_RESISTANCE;
  }

  public eval(): void {
    super.eval(() => {
      if (this.control.isRunning && !this.circuit.isBroken() && this._externalTemp > Thermometer.max) {
        super.blow(`Component ${this.toString()} blew as it exceeded ${Thermometer.max}°C (was ${this._externalTemp}°C)`);
      }
    });
  }

  public render(): void {
    super.render((p: p5, colour: p5.Color, running: boolean) => {
      p.textAlign(p.CENTER, p.CENTER);

      // Rectangle
      p.strokeWeight(1.5);
      p.stroke(colour);
      p.noFill();
      p.rect(0, 0, this._w / 2, this._h);

      // Filing
      const pad: number = 3;
      if (running && !this._blown) {
        const w: number = this._w / 4 - pad;
        const a: number = 200;
        p.noStroke();
        p.rectMode(p.CORNER);
        let h;
        if (this._externalTemp < Thermometer.min) {
          p.fill(28, 58, 217, a);
          h = 2;
        } else {
          p.fill(217, 58, 28, a);
          h = utils.mapNumber(this.howFull(), 0, 1, 1, this._h - pad * 2);
        }
        p.rect(-w, this._h / 2 - h - pad, w * 2, h);
        p.rectMode(p.CENTER);
      }

      {
        const limY = this._h / 2;
        const dy = this._h / 10;
        const x = this._w / 4;
        const len = 5;
        p.stroke(colour);
        p.strokeWeight(1.2);
        for (let y = -limY; y < limY; y += dy) {
          p.line(x - len, y, x, y);
        }
      }

      // Reading of lumens in green label
      if (running) {
        p.strokeWeight(1);
        p.stroke(0, 100, 0);
        p.fill(160, 255, 200);
        p.rect(0, this._h / 1.3, this._w, this._h / 3);

        p.textSize(Component.SMALL_TEXT);
        p.noStroke();
        p.fill(0);
        const textCoords: [number, number] = [1, this._h / 1.25];
        if (this._blown) {
          p.text("- - -", ...textCoords);
        } else {
          let temp: number = this._externalTemp;
          if (temp < Thermometer.min) {
            p.text("COLD", ...textCoords);
          } else {
            if (temp !== 0) {
              temp = utils.roundTo(temp, 2);
              if (temp === 0) p.text("< 0.1", ...textCoords);
              else if (temp > 1e4) p.text("> 10,000", ...textCoords);
              else p.text(temp + '°C', ...textCoords);
            } else {
              p.text('0°C', ...textCoords);
            }
          }
        }
      }
      p.textAlign(p.LEFT, p.TOP);
    });
  }

  /**
   * How full is the thermometer?
   * @return {Number} 0..1
   */
  public howFull(): number {
    const fract: number = (this._externalTemp - Thermometer.min) / (Thermometer.max - Thermometer.min);
    return fract;
  }

  /**
   * Connect coordinates for inputs
   * @return {Number[]} Coordinates [x, y]
   */
  public getInputCoords(): [number, number] {
    const move = utils.polToCart(-this._angle, this._w / 4);
    return [this._x - move[0], this._y + move[1]];
  }

  /**
   * Connect coordinates for outputs
   * @return {Number[]} Coordinates [x, y]
   */
  public getOutputCoords(): [number, number] {
    const move = utils.polToCart(this._angle, this._w / 4);
    return [this._x + move[0], this._y + move[1]];
  }

  // super.getData

  // super.apply()
}

export default Thermometer;
