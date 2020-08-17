import Component from "classes/component/Component";
import type Circuit from "classes/circuit";
import * as utils from 'assets/utils';
import p5 from "p5";
import { IAdditionalComponentData, IComponentData } from "models/saveData";
import IMotorData from "./interface";

/**
 * Motor - spins according to current
 * @extends Component
 *
 * @property _rotAngle          Angle of rotation of motor
 * @property _K                 Rotation constant. At max speed, this is radians it can rotate per cycle.
 *
 * @method delta()              Return the delta to add to _rotAngle
 * @method angle()              Get displayable current angle of motor
 */
export class Motor extends Component {
  public static minK: number = 0.1;
  public static maxK: number = 5;

  protected _rotAngle: number = 0;
  protected _K: number;

  public constructor(parentCircuit: Circuit) {
    super(parentCircuit);
    this._resistance = 4;
    this._maxCurrent = 5;
    this._K = utils.roundTo(utils.randomFloat(Motor.minK, Motor.maxK), 2);
  }

  public get K(): number { return this._K; }
  public set K(k: number) { this._K = utils.clamp(k, Motor.minK, Motor.maxK); }

  /**
   * Calculate speed (delta rotAngle) of motor
   * @return {Number} to add to this._rotAngle (radians)
   */
  public delta(): number {
    return (this.current / this.maxCurrent) * this._K;
  }

  /**
   * Return displayable angle of rotation
   * @return {String} Displayable angle (degrees)
   */
  public angle(): string {
    let num: number = utils.roundTo(utils.rad2deg(this._rotAngle), 1);
    let angle: string = num.toString();
    if (Number.isInteger(num)) angle = num + ".0";
    angle = angle.padStart(5, "0") + "°";
    return angle;
  }

  public eval(): void {
    super.eval(() => {
      const delta: number = this.delta();
      this._rotAngle += delta;
      if (this._rotAngle > utils.Degrees[360]) this._rotAngle = 0;
      else if (this._rotAngle < 0) this._rotAngle = utils.Degrees[360];
    });
  }

  public render(): void {
    super.render((p: p5, colour: p5.Color, running: boolean): void => {
      const isOn = this.isOn();

      // Circle
      p.strokeWeight(1);
      p.stroke(colour);
      if (this._blown) {
        p.fill(p.random(100));
      } else {
        p.noFill();
      }
      p.ellipse(0, 0, this._w, this._w);

      // 'M'
      p.textAlign(p.CENTER, p.CENTER);
      p.textStyle(p.BOLD);
      p.noStroke();
      p.fill(colour);
      p.textSize(25);

      p.push();
      p.rotate(this._rotAngle);
      p.text("M", 0, 1);
      p.pop();

      p.textStyle(p.NORMAL);

      // Reading of rotAngle in green label
      if (running && this.control.showInfo) {
        p.strokeWeight(1);
        p.stroke(0, 100, 0);
        p.fill(160, 255, 200);
        p.rect(0, this._h / 1.3, this._w, this._h / 3);

        p.textSize(Component.SMALL_TEXT);
        p.noStroke();
        p.fill(0);
        let text: string = isOn ? this.angle() : "- - -";
        p.text(text, 0, this._h / 1.25);
      }
      p.textAlign(p.LEFT, p.TOP);

      if (this.debug && !this._blown) {
        let len = this._w / 2;
        p.stroke(55, 0, 255);
        p.noFill();

        // 0 degrees (straight right)
        p.line(0, 0, len, 0);

        // Rotation angle
        p.line(0, 0, ...utils.polToCart(this._rotAngle, len));

        let d = this._w / 1.7;
        p.arc(0, 0, d, d, 0, this._rotAngle);
      }
    });
  }

  public onScroll(event: WheelEvent): void {
    const delta: number = Math.sign(event.deltaY) * -Motor.minK;
    this.K += delta;
  }

  /**
   * Get data for this component
   * @param {IAdditionalComponentData} customData More data to add
   * @return {IComponentData} Data
   */
  public getData(customData?: IAdditionalComponentData): IComponentData {
    const data: IAdditionalComponentData = {
      K: this._K,
      ...customData
    };
    return super.getData(data);
  }

  /**
   * Given data, load into object
   * @param  data
   * @return this
   */
  public apply(data: IMotorData): Motor {
    super.apply(data);
    if (typeof data.K === 'number' && !isNaN(data.K)) this._K = data.K;
    return this;
  }
}

export default Motor;