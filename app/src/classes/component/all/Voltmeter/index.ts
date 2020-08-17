import Component from "classes/component/Component";
import type Circuit from "classes/circuit";
import p5 from "p5";
import * as utils from "assets/utils";
import { IAdditionalComponentData, IComponentData } from "models/saveData";
/**
 * Voltmeter: measure voltage accross a component and display it
 * @extends Component
 * Should be placed in PARALLEL
 */
export class Voltmeter extends Component {
  public constructor(parentCircuit: Circuit) {
    super(parentCircuit);
    this._resistance = Component.INFIN_RESISTANCE;
  }

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

      // 'V'
      p.textAlign(p.CENTER, p.CENTER);
      p.textStyle(p.BOLD);
      p.noStroke();
      p.fill(colour);
      p.textSize(25);
      p.text('V', 0, 0);
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
          let voltage: number = this.voltage;

          if (voltage < 0.1) {
            p.text('< 0.1', ...textCoords);
          } else if (voltage > 1e4) {
            p.text('> 10,000', ...textCoords);
          } else {
            voltage = utils.roundTo(voltage, 2)
            p.text(utils.commifyNumber(voltage), ...textCoords);
          }
        } else {
          p.text('- - -', ...textCoords);
        }
      }
      p.textAlign(p.LEFT, p.TOP);
    });
  }
}

export default Voltmeter;