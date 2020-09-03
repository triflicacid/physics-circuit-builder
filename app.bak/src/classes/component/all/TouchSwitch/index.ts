import Switch from "../Switch/index";
import type Circuit from "classes/circuit";
import { State } from "models/enum";
import Page from "page/index";
import Sounds from "assets/sounds";
import p5 from "p5";

/**
 * Like switch, but only closed when mouse is over me
 * @extends Switch
 */
export class TouchSwitch extends Switch {
  public constructor(parentCircuit: Circuit) {
    super(parentCircuit);
    this._h = this._w;
  }

  public render(): void {
    super.render((p: p5, colour: p5.Color, running: boolean, d: number) => {
      // Vertical
      const farLeft: number = -this._w / 2 + d / 2;
      const farRight: number = this._w / 2 - d / 2;
      const offset: number = d;

      p.line(farLeft, offset, farLeft, -offset);
      p.line(farRight, offset, farRight, -offset);

      // Horizontal
      const fract: number = offset / ((this.state === State.Open) ? 2.5 : 4);
      p.line(farLeft, offset, farRight - offset, offset);
      p.line(farLeft, -fract, farRight - offset, -fract);

      p.line(farRight, -offset, farLeft + offset, -offset);
      p.line(farRight, fract, farLeft + offset, fract);
    });
  }

  public onMouseDown(event: MouseEvent): void { }

  public onMouseUp(event: MouseEvent): void { }

  public onMouseEnter(event: MouseEvent): void {
    this._state = State.Closed;
    // if (Page.playSounds) Sounds.Play("toggle-on");
    this.control.updateLightLevel();
  }

  public onMouseLeave(event: MouseEvent): void {
    this._state = State.Open;
    // if (Page.playSounds) Sounds.Play("toggle-off");
    this.control.updateLightLevel();
  }
}

export default TouchSwitch;