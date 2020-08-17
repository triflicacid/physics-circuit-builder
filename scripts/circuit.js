/**
 * Object for managing a circuit - components, wires etc...
 *
 * @property _control           Parent control object
 * @property _circuit           Parent circuit object
 * @property _depth             Depth of circuit
 * @property components         Array of components
 * @property wires              Array of all Wire objects (aka connections)
 * @property (readonly) size     How many components are there?
 * @property (readonly) lastComponent  The last component (or latest added)
 * @property (readonly) type    Type of circuit (parallel or series)
 * @property current            Current through this circuit
 * @property _isBroken          Is circuit broken (e.g. open switch...)
 * @property _brokenBy          Component causing the circuit to break
 *
 * @method render()         Renders all components in this.components array
 * @method forEach(fn: component, index)     Loop through all components
 * @method getData()             Return circuit as a data structure
 * @method getVoltage           Returns sum of all Cell's voltages. USE IN TOP-LEVEL CIRCUIT ONLY
 * @method getResistance()      Calculate total resistance of circuit and its components
 * @method getCurrent()         Calculate current through the circuit
 * @method getWatts()           Calculate wattage of circuit
 * @method unlockAllDiodes()    Check and call .unlock() on all child diodes
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
        this.current = 0;
        this._depth = (this._circuit instanceof Circuit) ? this._circuit.depth + 1 : 0;
        this._isBroken = false;
        this._brokenBy = null;

        this._type = Circuit.SERIES;
    }

    /*      READONLY PROPERTIES */
    get size() { return this.components.length; }
    get lastComponent() { return this.components[this.components.length - 1]; }
    get type() { return this._type; }

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
     * Find sum of every Cell's voltage
     * [!] For use in top-level circuit ONLY
     * @return {Number} Voltage
     */
    getVoltage() {
        if (this._depth !== 0) throw new Error(`Cannot get voltage of level ${this._depth} circuit`);

        let v = 0;
        for (let component of this.components)
            if (component instanceof Circuit.Cell || component instanceof Circuit.Battery) v += component.voltage;
        return v;
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
     * Loop through all components
     * @param {Function} fn
     *  fn -> (Component component, Number index)
     */
    forEach(fn) {
        this.components.forEach(fn);
    }

    /**
     * Get this as a data representation
     * @return {object} Data output
     */
    getData() {
        let data = {
            width: this._p5.width,
            height: this._p5.height,
            components: []
        };

        for (let component of this.components) {
            if (typeof component.getData === 'function') {
                let cdata = component.getData();
                data.components.push(cdata);
            }
        }

        return data;
    }

    /**
     * Falculate wattage of circuit
     * W = V * I
     * @return {Boolean} Circuit wattage
     */
    getWatts() {
        const v = this.getVoltage();
        const i = this.getCurrent();
        return v * i;
    }

    /**
     * Call .unlock() on all diodes
     */
    unlockAllDiodes() {
        // Check to unlock every diode
        let doEval = false;
        for (let component of this.components) {
            if (component instanceof Circuit.Diode) {
                if (component.unlock()) doEval = true;
            } else if (component instanceof Circuit) {
                component.unlockAllDiodes();
            }
        }

        if (doEval) {
            this._control.eval();
        }
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

    // Text size for volts etc...
    Circuit.SMALL_TEXT = 10;

    // Connection path type 'LOOP'
    Circuit.LOOP = 'loop';

    // Angles (radians)
    Circuit.DEG1 = 0.0174533;
    Circuit.DEG5 = 0.0872665;
    Circuit.DEG10 = 0.174533;
    Circuit.DEG45 = 0.7853981633974483; //Math.PI / 4;
    Circuit.DEG90 = 1.5707963267948966; //Math.PI / 2;
    Circuit.DEG180 = 3.141592653589793; //Math.PI;
    Circuit.DEG270 = 4.71238898038469; //Circuit.DEG180 + Circuit.DEG90;
})();
