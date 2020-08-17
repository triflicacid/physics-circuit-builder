/**
 * Object for managing a circuit - components, wires etc...
 *
 * @property _control           Parent control object
 * @property _circuit           Parent circuit object
 * @property _depth             Depth of circuit
 * @property _type              Type of circuit (Series / Parallel)
 * @property components         Array of components
 * @property wires              Array of all Wire objects (aka connections)
 * @property (readonly) size     How many components are there?
 * @property (readonly) lastComponent  The last component (or latest added)
 * @property (readonly) type    Type of circuit (parallel or series)
 * @property current            Current through this circuit
 * @property _isBroken          Is circuit broken (e.g. open switch...)
 * @property _brokenBy          Component causing the circuit to break
 *
 * @staticProperty logic        Logical stuff
 *
 * @method render()         Renders all components in this.components array
 * @method forEach(fn: component, index)     Loop through all components
 * @method getVoltage           Returns sum of all Cell's voltages. USE IN TOP-LEVEL CIRCUIT ONLY
 * @method getResistance()      Calculate total resistance of circuit and its components
 * @method getCurrent()         Calculate current through the circuit
 * @method power()           Calculate wattage of circuit
 * @method unlockAllDiodes()    Check and call .unlock() on all child diodes
 * @method break(c)             Un-break or Break the circuit
 */
class Circuit {
    /**
     * @param {Control} control       Control object
     * @param {Circuit} circuit       Parent circuit
     */
    constructor(control, circuit = null) {
        this._control = control;
        if (!(this._control instanceof Control)) throw new TypeError(`Circuit: argument 'control' is not of type 'Control'`);

        this._circuit = circuit;
        if (this._circuit !== null && !(this._circuit instanceof Circuit)) throw new TypeError(`Circuit: argument 'circuit' is not of type 'Circuit'`);

        this.components = [];
        this.wires = [];
        this._current = 0;
        this._depth = (this._circuit instanceof Circuit) ? this._circuit._depth + 1 : 0;
        this._isBroken = false;
        this._brokenBy = null;

        this._type = Circuit.SERIES;
    }

    /*      READONLY PROPERTIES */
    get size() { return this.components.length; }
    get lastComponent() { return this.components[this.components.length - 1]; }
    get type() { return this._type; }

    get current() { return this._current; }
    set current(c) {
        // Set current of all children
        for (let component of this.components) {
            if (Control.isComponent(component)) {
                component._current = component._circuit.isBroken() ? 0 : c;
            }
        }
    }

    /**
     * Calculate resistance across this circuit
     * @return {Number} Resistance
     */
    getResistance() {
        let r = this.components.map(c => c.getResistance());
        r = (this.type === Circuit.PARALLEL) ?
            resistanceInParallel(...r) :
            resistanceInSeries(...r);
        return r;
    }

    /**
     * I = V / R
     * @return {Number} Current throughout the circuit
     */
    getCurrent() {
        if (this._isBroken) return 0;

        const v = this.getVoltage();
        const r = this.getResistance();
        const i = v / r;
        return i;
    }

    /**
     * Calculate the voltage of the circuit
     * @return {Number} Voltage
     */
    getVoltage() {
        if (this.isBroken()) return 0;

        if (this._depth === 0) {
            // Top-most circuit... Find cells
            let v = 0;
            for (let component of this.components)
                if (component instanceof Circuit.Cell || component instanceof Circuit.Battery) v += component.voltage;
            return v;
        } else {
            let r = 0;
            for (let component of this.components) {
                r += component.resistance;
            }
            let fract = this.getResistance() / this._control._circuit.getResistance();
            let totalV = this._control._circuit.getVoltage();
            return fract * totalV;
        }
    }

    /**
     * Evaluate every component
     */
    eval() {
        for (let i = 0; i < 1; i++) {
            this.components.forEach(c => {
                if (typeof c.eval === 'function') c.eval();
            });
        }
    }

    /**
     * Render every component in this.components
     */
    render() {
        this.components.forEach(c => {
            if (typeof c.render === 'function') c.render();
        });
    }

    /**
     * Is this circuit broken?
     * @return {Boolean}
     */
    isBroken() {
        return this._isBroken || (this._circuit && this._circuit.isBroken());
    }

    /**
     * Loop through all components
     * @param {Function} fn
     *  fn -> (Component component, Number index)
     */
    forEach(fn) {
        this.components.forEach(fn);
    }

    /**
     * Falculate wattage of circuit
     * W = V * I
     * @return {Boolean} Circuit wattage
     */
    power() {
        const v = this.getVoltage();
        const i = this.getCurrent();
        return v * i;
    }

    /**
     * Call .unlock() on all diodes
     */
    unlockAllDiodes() {
        this._control.eval(); // Evaluate initially to update current

        // Check to unlock every diode
        for (let component of this.components) {
            if (component instanceof Circuit.Diode) {
                component.unlock(); // "Unlock" diode (if successful, the resistance of the diode will change, allowing current to pass)
            } else if (component instanceof Circuit) {
                component.unlockAllDiodes();
            }
        }
    }

    /**
     * Break or unbreak the circuit
     * @param  {Component} arg Component which broke the circuit, or NULL to unbreak the circuit
     * @return {Boolean} Is circuit broken?
     */
    break (comp) {
        if (Control.isComponent(comp) && !this._isBroken) {
            this._isBroken = true;
            this._brokenBy = comp;
        } else {
            this._isBroken = false;
            this._brokenBy = null;
        }
        this._control.updateLightLevel();

        return this._isBroken;
    }
}

// Static CIRCUIT properties
(function() {
    // Type of circuit
    Circuit.SERIES = 'series';
    Circuit.PARALLEL = 'parallel';

    // Symbols
    Circuit.OHM = 'Ω';
    Circuit.INFIN = '∞';
    Circuit.MICRO = 'µ';

    // Text size for volts etc...
    Circuit.SMALL_TEXT = 11.5;

    // Connection path type 'LOOP'
    Circuit.LOOP = 'loop';

    // "0" resistance to stop things breaking
    Circuit.ZERO_RESISTANCE = 1e-10;

    // "Low" resistance for e.g. smmeter. Not actually zero, but so small it is considered irrelevant.
    Circuit.LOW_RESISTANCE = 0.001;

    // "Infinite" resistance (max safe integer a float can represent and still so maths on)
    Circuit.INFIN_RESISTANCE = Number.MAX_SAFE_INTEGER / 2;


    /**
     * Logical stuff
     * @propertyOf Circuit
     * - all methods and properties are static
     *
     * @method isLow(v)     Check if a voltage is Logica LOW
     * @method isHigh(v)    Check if a voltage is Logica HIGH
     * @method getState(v)  Return string state of a voltage
     */
    class Logic {
        /**
         * Is a given voltage LOW?
         * @param  {Number} voltage
         * @return {Boolean}
         */
        static isLow(v) {
            // return v <= 0.8;
            return v <= Logic.LOW_RANGE[1] && v >= Logic.LOW_RANGE[0];
        }

        /**
         * Is a given voltage HIGH?
         * @param  {Number} voltage
         * @return {Boolean}
         */
        static isHigh(v) {
            // return v <= 5 && v >= 2;
            return v <= Logic.HIGH_RANGE[1] && v >= Logic.HIGH_RANGE[0];
        }

        /**
         * Return string state for a voltage
         * @param  {Number} v   Voltage
         * @param  {Boolean} as10   Return as numbers instead
         * @return {any} state
         */
        static getState(v, as10 = false) {
            if (v < 0) return '<';
            if (Logic.isLow(v)) return as10 ? 0 : 'Low';
            if (Logic.isHigh(v)) return as10 ? 1 : 'High';
            if (v > Logic.HIGH) return '>';
            return '-';
        }
    }

    Logic.LOW = 0.8;
    Logic.HIGH = 5;

    Logic.LOW_RANGE = [0, 0.8];
    Logic.HIGH_RANGE = [2, 5];

    Circuit.logic = Logic;
})();
