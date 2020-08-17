import Circuit from "./circuit";
import * as p5 from "p5";
import Control from "./control";

/**
 * Shell for any circuit item
 * 
 * @property highlighted  Are we highlighted?
 * @property debug      Debug mode?
 * @property control    Get circuit's control
 * @property p5         Get control's P5 instance
 * 
 * @method debug()      Set debug value
 */
export class CircuitItem {
  public circuit: Circuit; // Parent circuit
  public debug: boolean = false;
  public highlighted: boolean = false;

  public constructor(parentCircuit: Circuit) {
    this.circuit = parentCircuit;
    if (!(this.circuit instanceof Circuit)) throw new TypeError(`CircuitItem: cannot resolve argument 'parentCircuit' to a Circuit instance`);
  }

  public get p5(): p5 { return this.circuit.control.p5; }
  public get control(): Control { return this.circuit.control; }

  protected static _prototypeChain: string[] = ["CircuitItem"];

  /**
   * Is the provided object in our prototypeChain?
   * @param  obj  Object to test
   * @return      Is instance?
   */
  public static isInstanceOf(obj: object): boolean {
    return CircuitItem._prototypeChain.indexOf(obj.constructor.name) !== -1;
  }
}

export default CircuitItem;