import * as utils from 'assets/utils';
import Resistor from "../Resistor/index";
import type Circuit from "classes/circuit";
import p5 from "p5";

/**
 * Component with a resistance with ability to alter this resistance
 * @extends Resistor
 * 
 * @property _delta             +- resistance onScroll
 *
 * @method onScroll(e)          What to do when scrolled on?
 */
export class VariableResistor extends Resistor {
  public static min = 0;
  public static max = 1e3;

  public constructor(parentCircuit: Circuit) {
    super(parentCircuit);
  }

  public render(): void {
    super.render((p: p5, colour: p5.Color, running: boolean) => {
      p.strokeWeight(1.3);
      p.stroke(colour);
      const extX: number = 5;
      const extY: number = 2;

      const h: number = Resistor.SMALL_HEIGHT;
      const end: [number, number] = [this._w / 2 + extX, -h / 2 - extY];
      p.line(-this._w / 2 - extX, h / 2 + extY, ...end);

      // Arrow head
      p.push();
      p.translate(...end);
      p.rotate(Math.PI / 3);
      p.noStroke();
      p.fill(colour);
      p.beginShape();

      const off: number = 5;
      p.vertex(-off, 0);
      p.vertex(off, 0);
      p.vertex(0, -off);

      p.endShape();
      p.pop();
    });
  }

  public onScroll(event: WheelEvent): void {
    let amount: number = 0.1; // Amount resistance changes by depends on current value
    if (this.resistance > 1e5) amount = 1e3;
    else if (this.resistance > 1e4) amount = 100;
    else if (this.resistance > 1e3) amount = 1;

    const delta = Math.sign(event.deltaY) * -amount;
    let newR = utils.clamp(this._resistance + delta, VariableResistor.min, VariableResistor.max);
    this.resistance = newR;

    this.control.updateLightLevel();
  }

  // super.getData

  // super.apply
}

export default VariableResistor;