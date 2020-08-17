import * as utils from 'assets/utils';
import Component from 'classes/component/Component';
import type Circuit from 'classes/circuit';
import { Direction } from 'models/enum';
import Sounds from 'assets/sounds';
import p5 from 'p5';
import { IAdditionalComponentData, IComponentData } from 'models/saveData';
import IDiodeData from './interface';
import Page from 'page/index';

/**
 * Diode: only allow current to flow one way
 * @extends Component
 *
 * @property _broken            Have we broken the circuit?
 * @property _dir               Direction
 *
 * @method isOn()               Override
 * @method lock()               Check to 'lock' the diode
 * @method unlock()             Check to 'unlock' the diode
 * @method passable()           Override
 * @method flip()               Flip direction of diode
 */
export class Diode extends Component {
  protected static minResistance = Component.LOW_RESISTANCE;
  protected static maxResistance = Component.INFIN_RESISTANCE;

  protected _broken: boolean = false;
  protected _dir: Direction = Direction.Right;

  public constructor(parentCircuit: Circuit) {
    super(parentCircuit);
    this._maxCurrent = 5;
    this._resistance = Diode.minResistance;
  }

  public get direction(): Direction { return this._dir; }

  /**
   * Is this component 'on'?
   * @override
   */
  public isOn(): boolean {
    return !this._broken && super.isOn();
  }

  /**
   * Check to "lock" the diode
   * @return {Boolean} Was the diode locked?
   */
  public lock(): boolean {
    // Check for bad flow
    let badFlow: boolean = false;
    if (this._dir === Direction.Right && this.current < 0) badFlow = true;
    else if (this._dir === Direction.Left && this.current > 0) badFlow = true;

    if (!this._broken && badFlow) {
      this._broken = true;
      this._resistance = Diode.maxResistance;
      if (!this.circuit.isBroken()) {
        this.circuit.break(this);
      }
      return true;
    } else {
      return false;
    }
  }

  /**
   * Check to "unlock" the diode (called when a battery/cell is flipped)
   * @return {Boolean} Was the diode unlocked?
   */
  public unlock(): boolean {
    // If the flow is now good...
    if (
      (this._dir === Direction.Right && this.current >= 0) ||
      (this._dir === Direction.Left && this.current <= 0)
    ) {
      this._broken = false;
      this._resistance = Diode.minResistance;
      if (this.circuit.brokenByMe(this)) this.circuit.break(null); // Unbreak?
      return true;
    }
    return false;
  }

  /**
   * Is this component passable?
   * @override
   * @return {Boolean} true/false
   */
  public passable(): boolean {
    return !this._broken && super.passable();
  }

  /**
   * Flip direction of diode
   * @return {Direction}     New direction
   */
  public flip(playSound: boolean = true): Direction {
    this._dir = this._dir === Direction.Left ? Direction.Right : Direction.Left;
    if (playSound && Page.playSounds) Sounds.Play("toggle-" + (this._dir === Direction.Right ? "on" : "off"));
    this.unlock();
    return this._dir;
  }

  public eval(): void {
    super.eval(() => {
      // Should diode be locked?
      this.lock();
    });
  }

  public render(): void {
    super.render((p: p5, colour: p5.Color, running: boolean): void => {
      const isFacingRight = this._dir === Direction.Right;

      // Circle
      p.strokeWeight(1);
      p.stroke(colour);
      if (this._blown) {
        p.fill(utils.randomInt(0, 100));
      } else {
        p.noFill();
      }
      p.ellipse(0, 0, this._w, this._w);

      // Triangle
      let y = this._w / 3;
      let w = this._w / 4;

      p.fill(this._broken && running ? p.color(255, 70, 80) : colour);
      p.noStroke();
      p.beginShape();
      if (isFacingRight) {
        p.vertex(-w, y);
        p.vertex(-w, -y);
        p.vertex(w, 0);
      } else {
        p.vertex(w, -y);
        p.vertex(w, y);
        p.vertex(-w, 0);
      }
      p.endShape(p.CLOSE);

      // Line
      p.stroke(colour);
      let x = w;
      y = this._w / 3.5;
      if (isFacingRight) {
        p.line(x, -y, x, y);
      } else {
        p.line(-x, -y, -x, y);
      }

      // if (running && this.control._showInfo && isOn) {
      //     p.textAlign(p.CENTER, p.CENTER);
      //     p.strokeWeight(1);
      //     p.stroke(0, 100, 0);
      //     p.fill(160, 255, 200);

      //     let h = this._h / 3;
      //     p.rect(0, this._h / 2 + h, this._w, h);

      //     p.textSize(Component.SMALL_TEXT);
      //     p.noStroke();
      //     p.fill(0);
      //     let text = this._dir === Diode.RIGHT ? "> 0A" : "< 0A";
      //     p.text(text, 0, this._h / 1.9 + h);

      //     p.textAlign(p.LEFT, p.LEFT);
      // }
    });
  }

  public onMouseDown(event: MouseEvent): void {
    this.flip(true);
  }

  /**
   * Get data for this component
   * @param {IAdditionalComponentData} customData More data to add
   * @return {IComponentData} Data
   */
  public getData(customData?: IAdditionalComponentData): IComponentData {
    const data: IAdditionalComponentData = {
      dir: this._dir,
      ...customData
    };
    return super.getData(data);
  }

  /**
   * Given data, load into object
   * @param  data
   * @return this
   */
  public apply(data: IDiodeData): Diode {
    super.apply(data);

    if (data.dir === Direction.Left || this._dir === Direction.Right) this._dir = data.dir;
    return this;
  }
}

export default Diode;