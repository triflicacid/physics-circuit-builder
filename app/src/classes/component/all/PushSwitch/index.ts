import Switch from "../Switch/index";
import type Circuit from "classes/circuit";
import { State } from "models/enum";
import Page from "page/index";
import Sounds from "assets/sounds";
import p5 from "p5";

/**
 * Like a switch, but only closed shen mouse button is pressed
 * @extends Switch
 */
export class PushSwitch extends Switch {
  public constructor(parentCircuit: Circuit) {
    super(parentCircuit);
  }

  public render(): void {
    super.render((p: p5, colour: p5.Color, running: boolean, d: number) => {
      const len: number = 10;
      const h: number = (running && this.state === State.Open) ? -(d * 1.2) : -(d / 2);

      // Horizontal line
      p.line(-this._w / 2 + d / 2, h, this._w / 2 - d / 2, h);

      // Vertical line
      p.line(0, h, 0, h - len);

      // Bobble
      d /= 2;
      p.noStroke();
      p.fill(colour);
      p.circle(0, h - len - (d / 2), d);
    });
  }

  // super.onMouseDown();

  public onMouseUp(event: MouseEvent): void {
    this._state = this._state === State.Open ? State.Closed : State.Open;
    if (Page.playSounds) Sounds.Play("toggle-" + (this._state === State.Open ? "on" : "off"));
    this.control.updateLightLevel();
  }
}

export default PushSwitch;