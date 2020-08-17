import type Circuit from "classes/circuit";
import * as utils from 'assets/utils';
import Component from "classes/component/Component";
import p5 from "p5";
import { Direction } from "models/enum";
import PowerSource from "classes/component/PowerSource";

/**
 * A cell has a voltage; DC power
 * @extends PowerSource (basically just Component)
 *
 * @method render()          Render the cell onto the global p5 sketch
 * @method getInputCoords()  Where should we connect the input to?
 * @method getOutputCoords() Where should we connect the output from?
 * @method getData()         Override method of super.getData()
 */
export class Cell extends PowerSource {
  public constructor(parentCircuit: Circuit) {
    super(parentCircuit);
    this._voltage = 1.5;
  }

  // super.eval()

  public render(): void {
    super.render((p: p5, colour: p5.Color, running: boolean): void => {
      const isOn: boolean = this.isOn();
      const facingRight: boolean = this.direction === Direction.Right;

      // Line
      let offset: number = 4;
      p.stroke(colour);
      p.strokeWeight(2);
      if (facingRight) {
        p.line(offset, this._h / 2, offset, -this._h / 2);
      } else {
        p.line(-offset, -this._h / 2, -offset, this._h / 2);
      }

      // Rectangle
      offset = 5;
      if (facingRight) offset = -offset;
      p.noStroke();
      p.fill(colour);
      if (facingRight) {
        p.rect(-6, 0, -offset, this._h / 2);
      } else {
        p.rect(6, 0, offset, this._h / 2);
      }

      // Plus sign (next to line)
      if (running && isOn) {
        p.noStroke();
        p.fill(255, 0, 0);
        p.textSize(Component.SMALL_TEXT * 1.5);
        if (facingRight) {
          p.text("+", this._w / 5, -this._h / 4);
        } else {
          p.text("+", -this._w / 3, -this._h / 4);
        }
      }

      // Show voltage in green box
      if (running && this.control.showInfo) {
        p.textAlign(p.CENTER, p.CENTER);
        p.strokeWeight(1);
        p.stroke(0, 100, 0);
        p.fill(160, 255, 200);

        let h = this._h / 3;
        p.rect(0, this._h / 2 + h, this._w, h);

        p.textSize(Component.SMALL_TEXT);
        p.noStroke();
        p.fill(0);
        let v: string = this.voltage.toFixed(1);
        v = isOn ? v + "V" : "- - -";
        p.text(v, 0, this._h / 1.9 + h);

        p.textAlign(p.LEFT, p.TOP);
      }
    });
  }

  /**
   * Where should we connect the input to?
   * @return {Number[]}  Coordinates [x, y]
   */
  public getInputCoords(): [number, number] {
    // Only funny buisiness for Cell component
    if (this.constructor.name === 'Cell') {
      const len = this.direction === Direction.Right ? 9 : 5;
      const move = utils.polToCart(this._angle, len);
      return [this._x - move[0], this._y + move[1]];
    } else {
      return super.getInputCoords();
    }
  }

  /**
   * Where should we connect the output from?
   * @return {Number[]}  Coordinates [x, y]
   */
  public getOutputCoords(): [number, number] {
    // Only funny buisiness for Cell component
    if (this.constructor.name === 'Cell') {
      const move = utils.polToCart(this._angle, 6);
      return [this._x + move[0], this._y + move[1]];
    } else {
      return super.getOutputCoords();
    }
  }
}

export default Cell;