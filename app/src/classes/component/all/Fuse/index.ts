import Component from "classes/component/Component";
import type Circuit from "classes/circuit";
import p5 from "p5";
import * as utils from 'assets/utils';
import { MouseButton } from "models/enum";

/**
 * Fuse: Break if current through it is too much
 * @extends Component
 * 
 * @method closeToBreak()  How close to breaking (0..1)
 */
export class Fuse extends Component {
  public constructor(parentCircuit: Circuit) {
    super(parentCircuit);
    this._h /= 3;
    this._resistance = Component.LOW_RESISTANCE;

    this._maxCurrent = 10;
  }

  /**
   * How close to breaking are we (0..1)
   */
  public closeToBreak(): number {
    return Math.abs(this.current / this.maxCurrent);
  }

  public render() {
    super.render((p: p5, colour: p5.Color, running: boolean): void => {
      const isOn = this.isOn();

      p.strokeWeight(2);
      p.stroke(colour);
      if (this._blown && running) {
        p.fill(p.random(100));
      } else {
        p.noFill();
      }
      p.rect(0, 0, this._w, this._h);

      // Broken wire if blown
      if (running && this._blown) {
        p.line(-this._w / 2, 0, -this._w / 4, 0);
        p.line(this._w / 4, 0, this._w / 2, 0);
      } else {
        // If not highlighted, colour line, like its hotter with more current
        if (!this.highlighted) p.stroke(...utils.hsb2rgb(0, 100, this.closeToBreak() * 100));
        p.line(-this._w / 2, 0, this._w / 2, 0);
      }

      // Show max current in green label
      if (running && this.control.showInfo && isOn) {
        p.textAlign(p.CENTER, p.CENTER);
        p.strokeWeight(1);
        p.stroke(0, 100, 0);
        p.fill(160, 255, 200);
        p.rect(0, this._h + 4, this._w, this._h / 1.2);

        p.textSize(Component.SMALL_TEXT);
        p.noStroke();
        p.fill(0);
        let text: number = utils.roundTo(this.closeToBreak(), 1);
        p.text(text + "%", 0, this._h + 5);

        p.textAlign(p.LEFT, p.TOP);
      }
    });
  }

  public onMouseDown(event: MouseEvent) {
    if (event.button === MouseButton.Right) {
      this.blow(this.toString() + ' was cut (manually blown)');
    }
  }
}

export default Fuse;