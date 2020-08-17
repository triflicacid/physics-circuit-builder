import Resistor from "../Resistor/index";
import type Circuit from "classes/circuit";
import * as utils from 'assets/utils';
import Component from "classes/component/Component";
import p5 from "p5";

/**
 * Resistance changes with light
 * @extends Resistor
 */
export class PhotoResistor extends Resistor {
  public constructor(parentCircuit: Circuit) {
    super(parentCircuit);
  }

  public eval(): void {
    super.eval((): void => {
      // More light => less resistance
      const lumens: number = utils.clamp(this._lightRecieving, 0, 1000);
      const r: number = utils.mapNumber(lumens, 0, 1000, 1, Component.ZERO_RESISTANCE);
      this._resistance = r;
    });
  }

  public render(): void {
    super.render((p: p5, colour: p5.Color): void => {
      // Arrows
      const len: number = 10;
      const arr_off: number = 3;
      const rot_main: number = utils.Degrees[270] - utils.Degrees[45] + utils.Degrees[10];
      const rot_angle: number = this._angle + utils.Degrees[270] - utils.Degrees[45] + utils.Degrees[10];
      const pad: number = 2.5;

      // Topmost
      p.push();
      let angle: number = this._angle + rot_main - utils.Degrees[10];
      let coords: [number, number] = utils.polToCart(angle, this._w / 2);
      p.translate(...coords);
      p.rotate(rot_angle);
      p.stroke(colour);
      p.line(pad, 0, pad + len, 0);
      p.beginShape();
      p.fill(colour);
      p.vertex(pad, arr_off);
      p.vertex(pad, -arr_off);
      p.vertex(pad - arr_off, 0);
      p.endShape(p.CLOSE);
      p.pop();

      // Bottommost
      p.push();
      angle = this._angle + rot_main + utils.Degrees[10] + utils.Degrees[5];
      coords = utils.polToCart(angle, this._w / 2);
      p.translate(...coords);
      p.rotate(rot_angle);
      p.stroke(colour);
      p.line(pad, 0, len + pad, 0);
      p.beginShape();
      p.fill(colour);
      p.vertex(pad, arr_off);
      p.vertex(pad, -arr_off);
      p.vertex(pad - arr_off, 0);
      p.endShape(p.CLOSE);
      p.pop();
    });
  }
}

export default PhotoResistor;