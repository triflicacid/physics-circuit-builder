import Control from './control';
import Component from './component/Component';
import Wire from './wire';
import Bulb from './component/all/Bulb/index';
import Cell from './component/all/Cell/index';
import Switch from './component/all/Switch/index';
export declare enum CircuitType {
    Series = 0,
    Parallel = 1
}
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
export declare class Circuit {
    control: Control;
    circuit: Circuit | null;
    components: Component[];
    wires: Wire[];
    type: CircuitType;
    private _current;
    private _depth;
    private _isBroken;
    private _brokenBy;
    constructor(control: Control, circuit?: Circuit);
    get depth(): number;
    get size(): number;
    get lastComponent(): Component | null;
    get current(): number;
    set current(val: number);
    /**
     * Calculate resistance across this circuit
     * @return {Number} Resistance
     */
    getResistance(): number;
    /**
     * Calculate the voltage of the circuit
     * @return {Number} Voltage
     */
    getVoltage(): number;
    /**
     * I = V / R
     * @return {Number} Current throughout the circuit
     */
    getCurrent(): number;
    /**
     * Evaluate every component
     * @return {Number} Components evaluated
     */
    eval(): number;
    /**
     * Render every component in this.components
     * @return {Number} Components rendered
     */
    render(): number;
    /**
     * Is this circuit broken?
     * @return {Boolean}
     */
    isBroken(): boolean;
    /**
     * Falculate wattage of circuit
     * W = V * I
     * @return {Number} Circuit wattage
     */
    power(): number;
    /**
     * Call .unlock() on all diodes
     * @return {Number} Diodes unlocked
     */
    unlockAllDiodes(): number;
    /**
     * Break or unbreak the circuit
     * @param  {Component} arg Component which broke the circuit, or NULL to unbreak the circuit
     * @return {Boolean} Is circuit broken?
     */
    break(comp: Component | null): boolean;
    /**
     * Is the provided component at blame for breaking this circuit?
     * @param  {Component} c  Component
     * @return {Boolean}
     */
    brokenByMe(c: Component): boolean;
    static readonly Bulb: typeof Bulb;
    static readonly Cell: typeof Cell;
    static readonly Switch: typeof Switch;
}
export default Circuit;
