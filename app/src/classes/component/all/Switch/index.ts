import * as utils from 'assets/utils';
import type Circuit from "classes/circuit";
import Component from 'classes/component/Component';
import Page from 'page/index';
import Sounds from 'assets/sounds';
import p5 from 'p5';
import { State } from 'models/enum';
import { IAdditionalComponentData, IComponentData } from 'models/saveData';
import ISwitchData from './interface';

/**
 * Switch: togglable wire
 * @extends Component (template.js)
 *
 * @property _state             State of switch
 *
 * @method eval()               Evaluate the component
 * @method render()             Render the cell onto the global p5 sketch
 * @method open()               Open the switch
 * @method close()              Close the switch
 * @method onRightClick()       Toggle state of switch
 */
export class Switch extends Component {
  protected _state: State = State.Open;

  public constructor(parentCircuit: Circuit) {
    super(parentCircuit);
    this._h /= 3;
    this._resistance = Component.ZERO_RESISTANCE;
  }

  public get state(): State { return this._state; }

  /**
   * Evaluate the component
   */
  public eval(): void {
    super.eval((circuitBroken: boolean) => {
      // Break if open
      if (this._state === State.Open && !circuitBroken) {
        this.circuit.break(this);
      }

      // Only un-break if we are the ones who broken thr circuit
      else if (this._state === State.Closed && this.circuit.brokenByMe(this)) {
        this.circuit.break(null);
      }
    });
  }

  /**
   * Render the component
   */
  public render(fn?: (p: p5, colour: p5.Color, running: boolean, d: number) => void): void {
    super.render((p: p5, colour: p5.Color, running: boolean): void => {
      const d: number = 9;

      // Circle each end
      p.noStroke();
      p.fill(colour);
      p.ellipse(-this._w / 2 + d / 2, 0, d, d);
      p.ellipse(this._w / 2 - d / 2, 0, d, d);

      p.strokeWeight(1.5);
      p.stroke(colour);

      if (fn === undefined) {
        // If undefined; draw normal switch
        if (!running || this.state === State.Open) {
          // Show as closed if circuit is not running
          let pos: [number, number] = utils.polToCart(-Math.PI / 4, this._w / 2.2);
          p.line(-this._w / 2 + d / 2, 0, ...pos);
        } else {
          // p.line(-this._w / 2 + d, 0, this._w / 2 - d, 0);
          const off: number = d / 4;
          p.line(-this._w / 2 + d / 2, -off, this._w / 2 - d / 2, off);
        }
      } else {
        // Else, call fn
        fn(p, colour, running, d);
      }
    });
  }

  /**
   * Open the switch
   */
  public open(): void {
    this._state = State.Open;
  }

  /**
   * Close the switch
   */
  public close(): void {
    this._state = State.Closed;
  }

  /**
   * Toggle state of switch
   */
  public onMouseDown(event: MouseEvent): void {
    this._state = this._state === State.Open ? State.Closed : State.Open;
    if (Page.playSounds) Sounds.Play("toggle-" + (this._state === State.Open ? "on" : "off"));
    this.control.updateLightLevel();
  }

  /**
   * Get data for this component
   * @param {IAdditionalComponentData} customData More data to add
   * @return {IComponentData} Data
   */
  public getData(customData?: IAdditionalComponentData): IComponentData {
    const data: IAdditionalComponentData = {
      state: this._state,
      ...customData
    };
    return super.getData(data);
  }

  /**
   * Given data, load into object
   * @param  {IBulbData} data
   * @return {PowerSource} this
   */
  public apply(data: ISwitchData): Switch {
    super.apply(data);

    if (data.state === State.Open || data.state === State.Closed) {
      this._state = data.state;
    } else {
      // throw new SaveError('@ Switch.apply', 'state: State');
    }
    return this;
  }
}

export default Switch;