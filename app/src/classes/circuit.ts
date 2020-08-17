import * as utils from 'assets/utils';
import Control from './control';
import Component from './component/Component';
import Wire from './wire';
import * as Components from './component/all/index';

/**
 * Object for managing a circuit - components, wires etc...
 *
 * @property control           Parent control object
 * @property circuit           Parent circuit object
 * @property _depth             Depth of circuit
 * @property components         Array of components
 * @property wires              Array of all Wire objects (aka connections)
 * @property (readonly) size     How many components are there?
 * @property (readonly) lastComponent  The last component (or latest added)
 * @property current            Current through this circuit
 * @property _isBroken          Is circuit broken (e.g. open switch...)
 * @property _brokenBy          Component causing the circuit to break
 *
 * @method getVoltage           Returns sum of all Cell's voltages. USE IN TOP-LEVEL CIRCUIT ONLY
 * @method getResistance()      Calculate total resistance of circuit and its components
 * @method getCurrent()         Calculate current through the circuit
 * @method render()         Renders all components in this.components array
 * @method power()           Calculate wattage of circuit
 * @method unlockAllDiodes()    Check and call .unlock() on all child diodes
 * @method break(c)             Un-break or Break the circuit
 * @method brokenByMe(c)        Were we broken by component 'c'
 */
export class Circuit {
  public control: Control; // Parent Control object
  public circuit: Circuit | null; // Parent circuit! (may be null)
  public components: Component[] = []; // Array of components in circuit
  public wires: Wire[] = []; // Array of wires in circuit

  private _current: number = 0; // Actual current
  private _depth: number; // Depth of circuit
  private _isBroken: boolean = false; // Is the circuit broken?
  private _brokenBy: Component | null = null; // Component the circuit was broken by

  constructor(control: Control, circuit?: Circuit) {
    this.control = control;
    if (!(this.control instanceof Control)) throw new TypeError(`Circuit: argument 'control' is not of type 'Control'`);

    if (circuit !== undefined) {
      if (!(circuit instanceof Circuit)) throw new TypeError(`Circuit: argument 'circuit' is not of type 'Circuit'`);
      this.circuit = circuit;
    } else {
      this.circuit = null;
    }

    this._depth = (this.circuit instanceof Circuit) ? this.circuit.depth + 1 : 0;
  }

  public get depth(): number { return this._depth; }
  public get size(): number { return this.components.length; }
  public get lastComponent(): Component | null { return this.size === 0 ? null : utils.arrLast<Component>(this.components); }

  public get current(): number { return this._current; }
  public set current(val: number) {
    // Set current of all children
    for (let component of this.components) {
      // component.current = component.circuit.isBroken() ? 0 : val;
      component.setCurrent(component.circuit.isBroken() ? 0 : val);
    }
  }

  /**
   * Calculate resistance across this circuit
   * @return {Number} Resistance
   */
  public getResistance(): number {
    const r: number[] = [];
    for (let component of this.components) {
      // Add resistance of component if !== 0
      let res: number = component.resistance;
      if (res !== 0) {
        r.push(res);
        // console.log(component.toString(), ':', res);
      }

      // Check each output...
      for (let wire of component.outputs) {
        // If output component is in the same circuit (wire will be used)...
        if (wire.output instanceof Component && wire.output.circuit === component.circuit) {
          // Add resistance of wire if !== 0
          res = wire.resistance;
          if (res !== 0) {
            r.push(res);
            // console.log(wire.toString(), ':', res);
          }
        }
      }
    }

    // Always series; Connector component handles parallel.
    return r.length === 0 ? 0 : utils.resistanceInSeries(...r);
  }

  /**
   * Calculate the voltage of the circuit
   * @return {Number} Voltage
   */
  public getVoltage(): number {
    if (this.isBroken() || this.control == null || this.control.circuit == null) return 0;

    if (this._depth === 0) {
      // Top-most circuit... Find cells
      let v: number = 0;
      for (let component of this.components)
        if (component.isPowerSource()) v += component.voltage;
      return v;
    } else {
      let r: number = 0;
      for (let component of this.components) {
        r += component.resistance;
      }
      let fract = this.getResistance() / this.control.circuit.getResistance();
      let totalV = this.control.circuit.getVoltage();
      return fract * totalV;
    }
  }

  /**
   * I = V / R
   * @return {Number} Current throughout the circuit
   */
  public getCurrent(): number {
    if (this._isBroken) return 0;

    const v: number = this.getVoltage();
    const r: number = this.getResistance();
    const i: number = v / r;
    return i;
  }

  /**
   * Render every component in this.components
   * @return {Number} Components rendered
   */
  public render(): number {
    let n: number = 0;
    this.components.forEach(c => {
      if (typeof c.render === 'function') {
        c.render();
        n++;
      }
    });
    return n;
  }

  /**
   * Is this circuit broken?
   * @return {Boolean}
   */
  isBroken(): boolean {
    return this._isBroken || (this.circuit instanceof Circuit && this.circuit.isBroken());
  }

  /** 
   * Falculate wattage of circuit
   * W = V * I
   * @return {Number} Circuit wattage
   */
  public power(): number {
    const v: number = this.getVoltage();
    const i: number = this.getCurrent();
    return v * i;
  }

  /**
   * Call .unlock() on all diodes
   * @return {Number} Diodes unlocked
   */
  public unlockAllDiodes(): number {
    this.control.eval(); // Evaluate initially to update current
    let n: number = 0;

    // Check to unlock every diode
    for (let component of this.components) {
      if (component instanceof Components.Diode) {
        component.unlock(); // "Unlock" diode (if successful, the resistance of the diode will change, allowing current to pass)
        n++;
      }
    }
    return n;
  }

  /**
   * Break or unbreak the circuit
   * @param  {Component} arg Component which broke the circuit, or NULL to unbreak the circuit
   * @return {Boolean} Is circuit broken?
   */
  public break(comp: Component | null): boolean {
    if (comp instanceof Component && !this._isBroken) {
      this._isBroken = true;
      this._brokenBy = comp;
      this.current = 0;
    } else if (comp == null) {
      this._isBroken = false;
      this._brokenBy = null;
    }
    this.control.updateLightLevel();

    return this._isBroken;
  }

  /**
   * Is the provided component at blame for breaking this circuit?
   * @param  {Component} c  Component
   * @return {Boolean}
   */
  public brokenByMe(c: Component): boolean {
    return this._isBroken && this._brokenBy === c;
  }


  public static components: { [name: string]: typeof Component } = {
    Template: Component
  };
}

import * as AllComponents from './component/all/index';
import { ComponentError } from './errors';
Circuit.components = AllComponents;




export default Circuit;

