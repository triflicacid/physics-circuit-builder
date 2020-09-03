import Component from "classes/component/Component";
import type Circuit from "classes/circuit";
import { CapacitorState } from "models/enum";
import p5 from "p5";
import * as utils from 'assets/utils';
import { IAdditionalComponentData, IComponentData } from "models/saveData";
import ICapacitorData from "./interface";

/**
 * Capacitor: builds up and stores charge, which it releases when circuit is broken
 * - Regard this.control._head as only power source
 * @extends component
 *
 * @property _capacitance       Like a constant. Measured in Farads (F). We store in microfarads
 * @property _targetVoltage     Target voltage of capacitor
 * @property _voltage           Voltage across the capacitor
 * @property resistance         Changing this doesn't do anything now
 * @property (readonly) maxCharge   The maximum charge of the capacitor
 * @property (readonly) T       Time constant of capacitor
 * @property _chargeTime        How many frames have passed since started charging?
 * @property _asSeconds         SHould we charge as seconds, or as frames?
 * @property state              Capacitor state
 *
 * @method isFull()             Is the capacitor "full"?
 * @method percentage()         How full is the capacitor (percentage)
 * @method accessOneself()      Can the capacitor access itself?
 * @method accessPower()        Can the capacitor access the power source?
 * @method getPathResistance()  Get ress=istance of path, discharging or charging
 * @method chargeTime()         Get time in seconds for the capacitor to fully charge
 * @method charge(v, t)         Charge capacitor by a voltage
 * @method voltageAfter(t)      Voltage after x time
 */
export class Capacitor extends Component {
  public static sideOffset: number = 12; // Offset between connectors and side of capacitor

  protected _capacitance: number = 2200;
  protected _targetVoltage: number = 5;
  protected _chargeTime: number = 0;
  protected _asSeconds: boolean = true; // [DEFAULT]

  public constructor(parentCircuit: Circuit) {
    super(parentCircuit);
    this._voltage = 0;
  }

  public get farads(): number { return this._capacitance * 1e-6; } // Capacitance in farads

  public get capacitance(): number { return this._capacitance; }
  public set capacitance(c: number) { if (isFinite(c) && !isNaN(c)) this._capacitance = Math.abs(c); }

  // Maximum charge of this capacitor. Q = CV
  public get maxCharge() { return this.farads * this._targetVoltage; }

  // Get the time constant of this capacitor. T = RC
  public get T() {
    const r = this.getPathResistance();
    return typeof r === "number" ? r * this.farads : Number.NaN;
  }

  // Target voltage - "maximum" of the capacitor
  public get targetVoltage(): number { return this._targetVoltage; }
  public set targetVoltage(v: number) { if (isFinite(v) && !isNaN(v)) { this._targetVoltage = Math.abs(v); } }

  public get state(): CapacitorState {
    // Check access to power source
    const accessPower: Component[] | null = this.accessPower();
    if (accessPower === null) {
      // Cannot access power, empty...
      if (isNaN(this._voltage) || this._voltage <= 0) return CapacitorState.Null;

      // Cannot access power, not empty, can access oneself...
      if (this.accessOneself() != null) return CapacitorState.Discharging;

      // Cannot access power, not empty, cannot access oneself...
      return CapacitorState.Null;
    } else {
      // Can access power, full...
      if (this.isFull()) return CapacitorState.Full;

      // Can access power, not full...
      return CapacitorState.Charging;
    }
  }

  /**
   * Is the capacitor said to be "fully" charges
   * - A capacitor is never fully charges; instead, it is considered so after 99.3% (or 5T)
   * @return {Boolean} Is it "fully charged"
   */
  public isFull(): boolean {
    return this.percentage() >= 99.3;
  }

  /**
   * How full is the capacitor (percentage)
   * @param  {Number} [v=this._voltage]       Voltage to test. Default is this voltage
   * @return {Number} percentage
   */
  public percentage(v?: number): number {
    if (v == undefined) v = this._voltage;
    return (v / this._targetVoltage) * 100;
  }

  /**
   * Can this capacitor access itself?
   * @return {Component[]} Trace path or null
   */
  public accessOneself(): Component[] | null {
    // Not restrained by ordinary flow
    return this.trace(this, true, false);
  }

  /**
   * Can this capacitor access the power source?
   * @return {Component[]} Trace path or null
   */
  public accessPower(): Component[] | null {
    if (this.control.head == null) return null;

    let trace: Component[] | null = this.trace(this.control.head, true, false);
    if (trace == null) return null;

    // We can get to head... but can we get back? (restrained)
    trace = this.control.head.trace(this, true, true);
    return trace;
  }

  /**
   * Get resistance of path
   * @return {Number} resistance or NaN if no path exists
   */
  public getPathResistance(): number {
    // Get path
    let path: Component[] | null = this.accessPower();
    if (path === null) path = this.accessOneself();
    if (path === null) return NaN;

    let r: number = 0;
    for (let c of path) r += c.resistance;
    return r;
  }

  /**
   * Time, in seconds, for the capacitor to fully charge
   * t = 5 * R * C
   * @return {Number} Seconds
   */
  public chargeTime(): number {
    const r: number = this.getPathResistance();
    return isNaN(r) ? -1 : 5 * r * this.farads;
  }

  /**
   * Find voltage of capacitor after t seconds
   * @param  {Number} t   Time voltage is applied
   * @param  {Boolean} charging Are we charging or discharging?
   * @return {Number} Voltage of capacitor
   */
  public voltageAfter(t: number, charging: boolean = true): number {
    // Vc = Vs * (1 - e^(-t / T))
    // Find time constant
    const T: number = this.T;
    if (isNaN(T)) return 0;

    // Math.exp(x) -> Math.E ** x
    let v: number = charging ?
      (this._targetVoltage * (1 - Math.exp(-t / T))) :
      (this._voltage * (1 - Math.exp(-t / T)));

    if (isNaN(v)) return 0;
    if (!isFinite(v)) return Component.INFIN_RESISTANCE;
    return (v < 0) ? 0 : v;
  }

  public eval(): void {
    super.eval(() => {
      const state: CapacitorState = this.state;
      //if (state != CapacitorState.Null) console.log(CapacitorState[state]);
      switch (state) {
        // Charging... increase voltage
        case CapacitorState.Charging: {
          this._chargeTime++;
          // console.log("Charging: " + this._chargeTime);
          const amount = this._asSeconds ?
            this.control.frames2secs(this._chargeTime) :
            this._chargeTime;
          this._voltage = this.voltageAfter(amount, true);
          break;
        }
        // Dischargin... decrease voltage
        case CapacitorState.Discharging: {
          this._chargeTime--;
          // console.log("Discharging: " + this._chargeTime);
          const amount = this._asSeconds ?
            this.control.frames2secs(this._chargeTime) :
            this._chargeTime;
          this._voltage = this.voltageAfter(amount, false);

          // Set current of all components in this' path
          const array: Component[] | null = this.trace(this, true, false);
          if (array != null) {
            for (let component of array) {
              // I = V / R
              component.current = this._voltage / component.resistance;
            }
          }

          // Update light levels - our voltage may have changed some bulbs :)
          this.control.updateLightLevel();

          break;
        }
      }
    });
  }

  public render(): void {
    super.render((p: p5, colour: p5.Color, running: boolean) => {
      p.noStroke();
      p.fill(colour);
      const height: number = this._h / 1.5;
      const width: number = Capacitor.sideOffset / 2;

      // Left line
      let x = -Capacitor.sideOffset;
      p.rect(x, 0, width, height);

      // Right line
      x = Capacitor.sideOffset;
      p.rect(x, 0, width, height);

      if (running && this.control.showInfo) {
        p.textAlign(p.CENTER, p.CENTER);

        // Progress bar thing between plates
        p.rectMode(p.CORNER);

        p.strokeWeight(1);
        p.stroke(colour);
        p.noFill();
        p.rect(-Capacitor.sideOffset / 2 - 1, height / 2, Capacitor.sideOffset + 2, -height);

        p.fill(160, 200, 255);
        p.noStroke();
        let barHeight = utils.mapNumber(this.percentage(), 0, 100, 0, height);
        p.rect(-Capacitor.sideOffset / 2, height / 2, Capacitor.sideOffset, -barHeight);

        p.rectMode(p.CENTER);

        // Reading of current in green label
        p.strokeWeight(1);
        p.stroke(0, 100, 0);
        p.fill(160, 255, 200);
        p.rect(0, this._h / 1.6, this._w, this._h / 3);

        p.textSize(Component.SMALL_TEXT);
        p.noStroke();
        p.fill(0);
        const DP: number = 2;
        const voltage: number = isNaN(this._voltage) ? 0 : this._voltage;
        let text: string = utils.roundTo(voltage, DP).toString();
        text = (text === '0' ? utils.numberFormat(voltage, DP, false) : (+text).toFixed(DP)) + "V";
        p.text(text, 0, this._h / 1.55);
        p.textAlign(p.LEFT, p.TOP);
      }
    });
  }

  /**
   * Connect coordinates for inputs
   * @return {Number[]} Coordinates [x, y]
   */
  public getInputCoords(): [number, number] {
    const move = utils.polToCart(-this._angle, Capacitor.sideOffset);
    return [this._x - move[0], this._y + move[1]];
  }

  /**
   * Connect coordinates for outputs
   * @return {Number[]} Coordinates [x, y]
   */
  public getOutputCoords(): [number, number] {
    const move = utils.polToCart(this._angle, Capacitor.sideOffset);
    return [this._x + move[0], this._y + move[1]];
  }

  /**
   * Get data for this component
   * @param {IAdditionalComponentData} customData More data to add
   * @return {IComponentData} Data
   */
  public getData(customData?: IAdditionalComponentData): IComponentData {
    const data: IAdditionalComponentData = {
      capacitance: this._capacitance,
      target: this._targetVoltage,
      ...customData
    };
    return super.getData(data);
  }

  /**
   * Given data, load into object
   * @param  data
   * @return this
   */
  public apply(data: ICapacitorData): Capacitor {
    super.apply(data);

    if (typeof data.capacitance === 'number') this.capacitance = data.capacitance; // NaN is checked in setter :)
    if (typeof data.target === 'number') this.targetVoltage = data.target; // NaN is checked in setter :)
    return this;
  }
}

export default Capacitor;