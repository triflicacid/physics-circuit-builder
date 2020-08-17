import * as utils from 'assets/utils';
import PowerSource from "classes/component/PowerSource";
import type Circuit from "classes/circuit";
import p5 from "p5";
import { Direction } from "models/enum";
import Component from "classes/component/Component";
import { IAdditionalComponentData, IComponentData } from "models/saveData";
import IBatteryData from "./interface";

/**
 * Collection of cells
 * @extends PowerSource
 *
 * @property _cells         Number of cells
 * @property _cellVoltage   Voltage of each cell
 * @property _cellWidth     Width of every cell
 * @property voltage        Set voltage of every cell
 *
 * @method render()          Render the cell onto the global p5 sketch
 * @method eval()               Evaluate the component
 * @method flip()            Flip direction of battery (each cell)
 */
export class Battery extends PowerSource {
  protected _cells: number = 1;
  protected _cellVoltage: number = 1.5;
  protected _cellWidth: number;

  public constructor(parentCircuit: Circuit) {
    super(parentCircuit);
    this._cellWidth = this._w;
    this._voltage = this._cells * this._cellVoltage;
  }

  public get cells(): number { return this._cells; }
  public set cells(count: number) { this._cells = utils.clamp(count, 1, 10); }

  /**
  * Render an individual "cell"
  * @param  {Number} x             X coordinate to translate to
  * @param  {p5} p                P5 namespace
  * @param  {p5.Color} colour         Colour of components
  */
  private _renderCell(x: number, p: p5, colour: p5.Color): void {
    p.push();
    p.translate(x, 0);

    // Line
    let offset = 4;
    p.stroke(colour);
    p.strokeWeight(2);
    let h = this._h / 2.5;
    if (this.direction === Direction.Right) {
      p.line(offset, -h, offset, h);
    } else {
      p.line(-offset, -h, -offset, h);
    }

    // Rectangle
    offset = 5;
    p.noStroke();
    p.fill(colour);
    if (this.direction === Direction.Right) {
      p.rect(-6, 0, -offset, h);
    } else {
      p.rect(6, 0, offset, h);
    }

    p.pop();
  }

  public render(): void {
    const isOn = this.isOn();

    super.render((p: p5, colour: p5.Color, running: boolean): void => {
      let x = -((this._cells / 2) * this._cellWidth);
      // x += this._cellWidth / 2;

      for (let i = 0; i < this._cells; i++) {
        this._renderCell(x, p, colour);
        x += this._cellWidth + 4;
      }

      // Plus sign (next to line)
      if (running && isOn) {
        p.noStroke();
        p.fill(255, 0, 0);
        p.textSize(Component.SMALL_TEXT * 1.5);
        if (this.direction === Direction.Right) {
          p.text("+", this._w / 2 + 2, -this._h / 4);
        } else {
          p.text("+", -this._w / 2 - 13, -this._h / 4);
        }
      }

      // Box around everything
      p.strokeWeight(1);
      p.stroke(colour);
      p.noFill();
      p.rect(0, 0, this._w, this._h);

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
        const v: number = +this.voltage.toFixed(1);
        p.text(v + "V", 0, this._h / 1.9 + h);

        p.textAlign(p.LEFT, p.TOP);
      }
    });
  }

  public onMouseDown(event: MouseEvent): void {
    this._cellVoltage *= -1;
  }

  public onScroll(event: WheelEvent): void {
    // Increment / Decrement cell count
    const dir = Math.sign(event.deltaY) * -1;
    this.cells += dir;
    this._voltage = this._cells * this._cellVoltage;
  }

  /**
   * Get data for this component
   * @param {IAdditionalComponentData} customData More data to add
   * @return {IComponentData} Data
   */
  public getData(customData?: IAdditionalComponentData): IComponentData {
    const data: IAdditionalComponentData = {
      cells: this._cells,
      voltage: this._cellVoltage * this._cells,
      ...customData
    };
    return super.getData(data);
  }

  /**
   * Given data, load into object
   * @param  data
   * @return this
   */
  public apply(data: IBatteryData): Battery {
    super.apply(data);

    if (typeof data.cells === 'number' && !isNaN(data.cells) && data.cells > 0) this._cells = data.cells;
    if (typeof data.voltage === 'number' && !isNaN(data.voltage)) this._cellVoltage = data.voltage / this._cells;
    this._voltage = this._cells * this._cellVoltage;
    return this;
  }
}

export default Battery;