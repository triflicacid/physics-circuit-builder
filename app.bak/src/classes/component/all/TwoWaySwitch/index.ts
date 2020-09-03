import Connector from "../Connector/index";
import type Circuit from "classes/circuit";
import { CircuitExec } from "models/enum";
import Component from "classes/component/Component";
import Page from "page/index";
import Sounds from "assets/sounds";
import p5 from "p5";
import * as utils from 'assets/utils';
import { IAdditionalComponentData, IComponentData } from "models/saveData";
import ITwoWaySwitchData from "./interface";

/**
 * Like connector, but switches between executing one circuit to the other
 * @extends Connector
 *
 * @property _originalExec      The original value of _exec
 *
 * @method toggle()     Flip execution
 */
export class TwoWaySwitch extends Connector {
  protected _originalExec: CircuitExec;

  public constructor(parentCircuit: Circuit) {
    super(parentCircuit);

    // Randomise _exec
    this._exec = Math.random() < 0.5 ? CircuitExec.One : CircuitExec.Two;
    this._originalExec = this._exec;

    // Restore normal component dimensions
    this._w = Component.DEFAULT_WIDTH;
    this._h = this._w;
  }

  public get executing(): CircuitExec { return this._exec; }

  /**
   * Toggle which circuit to execute
   * @param  {Boolean} playSound  Play toggle sound
   * @return {CircuitExec} New cirucit we are executing
   */
  public toggle(playSound: boolean = false): CircuitExec {
    this._exec = this._exec === CircuitExec.One ? CircuitExec.Two : CircuitExec.One;
    if (playSound && Page.playSounds) Sounds.Play("toggle-" + (this._exec === this._originalExec ? "off" : "on"));

    // Check if anything extra should be on
    this.control.updateLightLevel();
    this.control.updateTemp();

    return this._exec;
  }

  public eval(): void {
    Component.prototype.eval.call(this, () => {
      if (!this._isEnd) {
        // Unbreak if necessary
        if (this._circuit1 != null && this._circuit1.brokenByMe(this)) this._circuit1.break(null);
        if (this._circuit2 != null && this._circuit2.brokenByMe(this)) this._circuit2.break(null);

        // If executing circuit 1...
        if (this._exec === CircuitExec.One) {
          // Set current if possible
          if (this._circuit1 != null) this._circuit1.current = this.current;

          // Stop other circuit
          if (this._circuit2 != null) this._circuit2.break(this);
        }

        // If executing circuit 2...
        else if (this._exec === CircuitExec.Two) {
          // Set current if possible
          if (this._circuit2 != null) this._circuit2.current = this.current;

          // Stop other circuit
          if (this._circuit1 != null) this._circuit1.break(this);
        }
      }
    });
  }

  public render(): void {
    Component.prototype.render.call(this, (p: p5, colour: p5.Color): void => {
      const d: number = 9;

      // Input blob
      p.fill(colour);
      p.noStroke();
      let inputCoords: [number, number] = this.getInputCoords();
      inputCoords[0] -= this._x;
      inputCoords[1] -= this._y;
      p.ellipse(inputCoords[0], inputCoords[1], d, d);

      // Output 1 blob
      p.fill(colour);
      p.noStroke();
      let output1Coords = this.getOutputCoords(0);
      output1Coords[0] -= this._x;
      output1Coords[1] -= this._y;
      p.ellipse(output1Coords[0], output1Coords[1], d, d);

      // Output 2 blob
      p.fill(colour);
      p.noStroke();
      let output2Coords = this.getOutputCoords(1);
      output2Coords[0] -= this._x;
      output2Coords[1] -= this._y;
      p.ellipse(output2Coords[0], output2Coords[1], d, d);

      // Lines
      p.stroke(colour);
      let outputCoords = this._exec === CircuitExec.One ? output1Coords : output2Coords;
      p.line(inputCoords[0], inputCoords[1], outputCoords[0], outputCoords[1]);

      if (this.debug) {
        p.noStroke();
        p.fill(255, 0, 20);

        // Labels from circuits
        p.text("1", ...output1Coords);
        p.text("2", ...output2Coords);
      }
    });
  }

  /**
   * Connect coordinates for inputs
   * @param  {Number} no  Input number
   * @return {Number[]} Coordinates [x, y]
   */
  public getInputCoords(no?: number): [number, number] {
    const move = utils.polToCart(-this._angle, this._w / 2);
    return [this._x - move[0], this._y + move[1]];
  }

  /**
   * Connect coordinates for outputs
   * - Should be overridden for each component, but here just in case :)
   * @param  {Number} no  Input number
   * @return {Number[]} Coordinates [x, y]
   */
  public getOutputCoords(no: number): [number, number] {
    const move = no === 1 ?
      utils.polToCart(this._angle, this._w / 2) :
      utils.polToCart(this._angle + utils.Degrees[90], this._w / 2);
    return [this._x + move[0], this._y + move[1]];
  }

  public onMouseDown(event: MouseEvent): void {
    this.toggle(true);
  }

  /**
   * Get data for this component
   * @param {IAdditionalComponentData} customData More data to add
   * @return {IComponentData} Data
   */
  public getData(customData?: IAdditionalComponentData): IComponentData {
    const data: IAdditionalComponentData = {
      exec: this._exec,
      origExec: this._originalExec,
      ...customData
    };
    return super.getData(data);
  }

  /**
   * Given data, load into object
   * @param  data
   * @return this
   */
  public apply(data: ITwoWaySwitchData): TwoWaySwitch {
    super.apply(data);

    if (data.exec === CircuitExec.One || data.exec === CircuitExec.Two) {
      this._exec = data.exec;
      if (data.origExec === CircuitExec.One || data.origExec === CircuitExec.Two) this._originalExec = data.origExec;
    }
    return this;
  }
}

export default TwoWaySwitch;