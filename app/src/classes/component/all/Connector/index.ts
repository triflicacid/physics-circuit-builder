import Component from "classes/component/Component";
import Circuit from "classes/circuit";
import * as utils from 'assets/utils';
import { CircuitExec } from "models/enum";
import { ComponentError, ConnectionError } from "classes/errors";
import { IConnectionData } from "models/saveData";
import Wire from "classes/wire";
import p5 from "p5";

/**
 * Handles a split in a wire
 * @extends Component
 *
 * @property _circuit1  Circuit for 1st connection
 * @property _circuit2  Circuit for 2nd connection
 * @property _isEnd     Is this at the end of a sub-circuit?
 * @property _exec      Which circuit(s) to execute
 *
 * @method setupConn1(component)    Set-up connection for circuit1
 * @method setupConn2(component)    Set-up connection for circuit2
 * @method end()                    Make an end-connector
 */
export class Connector extends Component {
  protected _exec: CircuitExec = CircuitExec.All;
  protected _isEnd: boolean = false;
  protected _circuit1: Circuit | null = null;
  protected _circuit2: Circuit | null = null;

  public constructor(parentCircuit: Circuit) {
    super(parentCircuit);

    this._w = 9;
    this._h = this._w;

    // These will change is end() is called
    this._inputMax = 1;
    this._outputMax = 2;
  }

  public get isEnd(): boolean { return this._isEnd; }

  /**
   * Is this component a connector?
   */
  public isConnector(): boolean {
    return true;
  }

  // Calculate the resistance of the sub-circuits
  public get resistance(): number {
    if (this._isEnd) return 0;

    if (this.constructor.name === 'TwoWaySwitch') {
      // Get resistance of active circuit
      if (this._exec === CircuitExec.One)
        return this._circuit1 == null ? 0 : this._circuit1.getResistance();

      if (this._exec === CircuitExec.Two)
        return this._circuit2 == null ? 0 : this._circuit2.getResistance();

      throw new ComponentError(`TwoWaySwitch: must be executing either One or Two, got '${this._exec}'`);
    } else {
      // Only return resistance of one if the other circuit is (a) broken or (b) null
      if (this._circuit1 == null || this._circuit1.isBroken())
        return this._circuit2 == null ? 0 : this._circuit2.getResistance();

      if (this._circuit2 == null || this._circuit2.isBroken())
        return this._circuit1 == null ? 0 : this._circuit1.getResistance();

      // Find resistance in parallel
      const resistances: number[] = [this._circuit1.getResistance(), this._circuit2.getResistance()];
      const resistance: number = utils.resistanceInParallel(...resistances);
      return resistance;
    }
  }

  /**
   * Set-up connection to sub-circuit N
   * @param  {Number}    N            1 or 2 (circuit1 or circuit2)
   * @param  {Component} component    Component connecting to (i.e. the first component in circuit1)
   * @param  {Number[][]} wirePath    Path of point for the path
   * @return {Wire}                   The wire created (conn)
   */
  private _setupConn(N: 1 | 2, component: Component, wireData?: IConnectionData): Wire {
    let CIRCUIT: Circuit | null = (<any>this)["_circuit" + N];

    if (!(component instanceof Component)) throw new ConnectionError(`Connector.setupConn${N}: cannot set-up connection with non-component: ` + component);
    if (CIRCUIT != null) throw new TypeError(`circuit${N} is already defined.`);

    const circuit: Circuit = new Circuit(this.control, this.circuit);
    (<any>this)["_circuit" + N] = circuit;
    circuit.components.push(component);
    component.circuit = circuit;

    const wire: Wire = new Wire(this.circuit, this, component, wireData);

    // Increase outputs (not required)
    this._outputCount++;
    this._outputs.push(wire);

    // Increase inputs (required)
    component.pushConnection('input', wire);

    // Sort out wires
    circuit.wires.push(wire);
    circuit.control.wires.push(wire);

    return wire;
  }

  /**
   * Set-up connection to sub-circuit 1
   * @param  {Component} component    Component connecting to (i.e. the first component in circuit1)
   * @param  {Object} wireData        Additional setup data for wire
   * @return {Wire}                   The wire created (conn)
   */
  public setupConn1(component: Component, wireData?: IConnectionData): Wire {
    return this._setupConn(1, component, wireData);
  }

  /**
   * Set-up connection to sub-circuit 2
   * @param  {Component} component    Component connecting to (i.e. the first component in circuit1)
   * @param  {Object} wireData        Additional setup data for wire
   * @return {Wire}                   The wire created (conn)
   */
  setupConn2(component: Component, wireData?: IConnectionData): Wire {
    return this._setupConn(2, component, wireData);
  }

  // Split current between subcircuits
  public eval(): void {
    if (this._isEnd) {
      // If at end, don't bother
      super.eval();
    } else {
      super.eval(() => {
        if (this._circuit2 === null || this._circuit2.isBroken()) {
          if (this._circuit1 == null) {
            // throw new ComponentError("A connector must have at least one output");
            return;
          } else {
            this._circuit1.current = this.circuit.getCurrent();
          }
        } else if (this._circuit1 === null || this._circuit1.isBroken()) {
          if (this._circuit2 == null) {
            // throw new ComponentError("A connector must have at least one output");
            return;
          } else {
            this._circuit2.current = this.circuit.getCurrent();
          }
        } else {
          const r1: number = this._circuit1.getResistance();
          const r2: number = this._circuit2.getResistance();
          const v: number = this.voltage;

          const c1: number = v / r1;
          const c2: number = v / r2;

          this._circuit1.current = c1;
          this._circuit2.current = c2;
        }
      });
    }
  }

  public render(): void {
    super.render((p: p5, colour: p5.Color): void => {
      p.noStroke();
      p.fill(colour);
      p.ellipse(0, 0, this._w, this._h);
    });
  }

  /**
   * Make this connector into an end-connector
   */
  public end(): void {
    this._isEnd = true;
    this._inputMax = 2;
    this._outputMax = 1;
  }

  /**
   * Connect coordinates for inputs
   * @return {Number[]} Coordinates [x, y]
   */
  public getInputCoords(no?: number): [number, number] {
    return [this._x, this._y];
  }

  /**
   * Connect coordinates for outputs
   * @return {Number[]} Coordinates [x, y]
   */
  public getOutputCoords(no?: number): [number, number] {
    return [this._x, this._y];
  }
}

export default Connector;