import * as utils from '../util/utils.js';
import {
    Control
} from './control.js';
import Circuit from './circuit.js';
import Sounds from '../sounds/index.js';

var nextID = 0;

/**
 * Template to all components
 *
 * @property (readonly) control       Parent Control
 * @property (readonly) p5            p5 instance
 * @property _circuit       Parent Circuit
 * @property _x             x position of the Cell
 * @property _y             y position of the Cell
 * @property _w             Width of the bounding box
 * @property _h             Height of the bounding box
 * @property _debug         Are we in debug mode?
 * @property _highlighted   Are we highlighted? (change colour)
 * @property _selected      Are we selected? (change colour & show info)
 * @property _lvl           "Depth" of the component
 * @property _outputCount   How many outputs are there?
 * @property _outputMax     How many outputs can this be connected to?
 * @property _outputs       Array of components that this is connected to (output)
 * @property _inputCount    How many inputs are there?
 * @property _inputMax      How many inputs can this be connected to?
 * @property _inputs        Array of components that this is connected to (input)
 * @property _angle         Angle of rotation (radians)
 * @property _blown         Has component been blown?
 * @property _lpw           Lumens per Watt. Luminous components only
 * @property _lightRecieving Light (lumens) that this component is recieving
 * @property _externalTemp  External temperature
 *
 * @property resistance         Components' resistance
 * @property (readonly) voltage The voltage across the component
 * @property current            Get current running through the component
 * @property maxCurrent         What is the max current this component can handle?
 *
 * @method toString()           String representation of object
 * @method move(x, y)           Change coordinates of component
 * @method render(fn)           Render wrapper
 * @method rotate(deg)          Rotate by x degrees
 * @method contains(x, y)       Are the provided [x, y] inside this component?
 * @method distSq(component)    Return distance squared to the provided component
 * @method select() / unselect() Toggle state of this._selected
 * @method highlight() / unhighlight() Toggle state of this._highlight
 * @method setMaxVoltage()      Set a maximum voltage
 * @method setMaxCurrent(v)     Set the max current (chainable)
 * @method connectTo(component) Attempt to connect this to a component
 * @method getInputCoords()     Coordinates to connect the input from.
 * @method getOutputCoords()    Coordinates to connect the output to.
 * @method getData()            Get data for this component
 * @method isBlown()            Is this component 'blown'
 * @method blow()               Blow the component
 * @method isOn()               Is this component being 'on'?
 * @method power()           Calculate wattage of component
 * @method luminoscity()          Get lumens (only with components with _lpw property)
 * @method lightRecieving()     How many lumens is this component recieving from the surroundings?
 * @method getHeat(t)           Calculate heat of conduction through component
 * @method heatRecieving()      How many degrees celcius is this component recieving from the surroundings?
 * @method passable()           Is thie component 'passable' (i.e. not blown, shut etc...)
 * @method traceForward(c)      Trace through the circuit until reached component
 * @method traceBackward(c)     Trace through the circuit backwards until reached component
 * @method roundTrip(v)         Find the round trip and calculate stuff from it (v)
 * @method remove()             Remove the component
 */
class Component {
    constructor(parentCircuit) {
        this._circuit = parentCircuit;
        if (!(this._circuit instanceof Circuit))
            throw new TypeError(
                `Component: cannot resolve argument 'parentCircuit' to a Circuit instance`
            );

        // General stuff
        this._id = nextID++;
        this._lvl = 0;
        this._resistance = 0;
        this._current = 0;
        this._maxCurrent = 5;
        this._blown = false;

        // Drawing stuff
        this._x = 0;
        this._y = 0;
        this._w = Component.DEFAULT_WIDTH;
        this._h = this._w;
        this._debug = false;
        this._highlighted = false;
        this._selected = false;
        this._angle = 0;

        // Luminoscity
        this._lpw = undefined; // Luminous things only
        this._lightRecieving = 0;
        /* ^ Value of this.lightRecieving().
        However, this is a costly function, so this value is updated when a change in any luminous components is detected. */
        this._externalTemp = this.control._temperature;
        /* Same as above, but with .heatRecieving() instead */

        // Input connections (reference only)
        this._inputCount = 0;
        this._inputMax = 1;
        this._inputs = [];

        // Output connections
        this._outputCount = 0;
        this._outputMax = 1;
        this._outputs = [];
    }

    /**
     * Return string representation of component
     * @return {String} name + '#' + id
     */
    toString() {
        return this.constructor.name + "#" + this._id;
    }

    get resistance() {
        return this._resistance;
    }
    set resistance(r) {
        if (typeof r !== "number" || isNaN(r))
            throw new TypeError(
                `set resistance: expected integer, got '${r}'`
            );
        if (r <= 0) r = Component.ZERO_RESISTANCE;
        this._resistance = r;
    }

    /**
     * Calculate voltage across component
     * V = IR
     * @return {Number} Voltage across component
     */
    get voltage() {
        return this.current * this.resistance;
    }

    /**
     * Current running through component
     * @return {Number} Current in amperes (A)
     */
    get current() {
        return this._current;
    }

    /**
     * Max current this component can handle
     * @return {[type]} [description]
     */
    get maxCurrent() {
        return this._maxCurrent;
    }
    set maxCurrent(v) {
        if (typeof v !== "number" || isNaN(v))
            throw new TypeError(
                `set maxCurrent: expected integer, got '${v}'`
            );
        if (v <= 0) v = 1;
        this._maxCurrent = v;
    }

    /**
     * This circuits' control
     */
    get control() {
        return this._circuit._control;
    }

    /**
     * The P5 sketch
     */
    get p5() {
        return this._circuit._control._p5;
    }

    /**
     * Move position of component
     * @param {Number} x X coordinate of the Cell
     * @param {Number} y Y coordinate of the Cell
     * @return {Cell}    Return this (chainable
     */
    move(x, y) {
        let pad = this._w / 2;
        this._x = utils.clamp(x, pad, this._circuit._width - pad);
        this._y = utils.clamp(y, pad, this._circuit._height - pad);
        return this;
    }

    /**
     * Evaluate wrapper
     * @param {Function} fn         Contains customised evaluating info
     *          fn(isCircuitBroken, isBlown)
     */
    eval(fn) {
        // Is this blown?
        const isBlown = this.isBlown();

        // Is circuit broken (once broken, always broken)
        if (!this._circuit._isBroken && isBlown) {
            this.blow();
        }

        // // If broken, set current to zero so isOn() evaluates FALSE
        // if (this._circuit._isBroken) {
        //     this._current = 0;
        // }

        if (typeof fn === "function") fn(this._circuit.isBroken(), isBlown);

        // Bubble forward
        for (let component of this._outputs) {
            if (component._output == this._circuit._control._head) break;
            if (typeof component._output.eval === "function") {
                component._output.eval();
            }
        }
    }

    /**
     * Render wrapper
     * @param {Function} fn         Contains personalised rendering info
     *          fn(p5_instance, colour, isCircuitRunning)
     */
    render(fn) {
        const p = this.p5;
        const isBlown = this.isBlown();

        // Sort out connections
        for (let i = 0; i < this._outputs.length; i++) {
            this._outputs[i].render();
        }

        p.push();
        p.translate(this._x, this._y);

        if (
            this.control._mode === Control.LIGHT &&
            Control.isLuminous(this) &&
            this.isOn()
        ) {
            // DRAWING LIGHT SPHERE WAS SORTED OUT BEFOREHAND
        } else if (
            this.control._mode === Control.HEAT &&
            Control.isHeatEmitter(this) &&
            this._joules !== 0
        ) {
            // DRAWING HEAT SPHERE WAS SORTED OUT BEFOREHAND
        } else {
            /* Else, draw as normal */
            // Function - assitional render code
            if (typeof fn === "function") {
                let colour = p.color(51);
                if (this.control._mode !== Control.NORMAL)
                    colour = p.color(150);
                if (isBlown) colour = p.color(255, utils.randomInt(50, 200), 0);
                if (this._highlighted) colour = p.color(200, 115, 80);
                fn(p, colour, this.control._running, isBlown); // Other rendering shenanigans
            }

            if (this._debug) {
                // Bounding box
                p.stroke(255, 0, 255);
                p.noFill();
                p.rect(0, 0, this._w, this._h);

                if (this._selected) {
                    p.noFill();
                    p.strokeWeight(0.5);
                    p.text("#" + this._id, -this._w / 2, -this._h / 2);
                }
            }
        }

        p.pop();
    }

    /**
     * Rotate component by x degrees
     * @param  {Number} deg     Degrees to rotate by
     * @return {Number}     New rotation angle (radians)
     */
    rotate(deg) {
        if (typeof deg !== "number") return this._angle;
        let rad = Degrees(deg);
        this._angle = rad;
        return rad;
    }

    /**
     * Are the provided (x, y) coordinates inside this component?
     * @param  {Number} x X coordinate to test
     * @param  {Number} y Y coordinate to test
     * @return {Boolean}  Does this component contain the given coordinates?
     */
    contains(x, y) {
        let dx = this._w / 2;
        let dy = this._h / 2;
        return (
            x > this._x - dx &&
            x < this._x + dx &&
            y > this._y - dy &&
            y < this._y + dy
        );
    }

    /**
     * Return distance (squared) between this and component
     * @param  {Component} component Component
     * @return {Number}             Distance squared
     */
    distSq(component) {
        // const dx = (this._x - this._w) - (component._x + component._w);
        // const dy = (this._y - this._w) - (component._y + component._h);
        // const d = (dx * dx) + (dy * dy); // Pythag without sqrt as its a slow operation
        // return d;

        const dx = component._x - component._w - (this._x + this._w);
        const dy = component._y - this._y;
        const d = dx * dx + dy * dy; // Pythag without sqrt as its a slow operation
        return d;
    }

    select() {
        this._selected = true;
        this._highlighted = true;
    }
    unselect() {
        this._selected = false;
        this._highlighted = false;
    }

    highlight() {
        this._highlighted = true;
    }
    unhighlight() {
        this._highlighted = false;
    }

    /**
     * Set max voltage of component
     * @param {Number} v Max voltage
     * @return {Component} Returns 'this' chainable)
     */
    setMaxVoltage(v) {
        const current = Math.abs(v) / this.resistance;
        if (typeof current !== "number")
            throw new TypeError(`Expected voltage value to be number`);
        this.maxCurrent = current;
        return this;
    }

    /**
     * Set the max current
     * @param {Number} The new maximum current
     * @return {Bulb}  Return 'this' (chainable)
     */
    setMaxCurrent(v) {
        this.maxCurrent = Math.abs(v);
        return this;
    }

    /**
     * Attempt to connect this to a component
     * this -> component
     * @param  {Component} component Component to connect
     * @param  {Number[][]} wirePath Path of point for the path
     * @param  {Object} data         Additional wire data
     * @return {Component}           Return 'this' (chainable)
     */
    connectTo(component, wirePath = [], data = {}) {
        if (!(component instanceof Component))
            throw new TypeError(
                `Cannot connect component to a non-component`
            );
        if (component === this) {
            throw (
                `Cannot connect component: cannot connect to oneself. ` +
                component.toString() +
                "->" +
                this.toString()
            );
        }

        // Check that connections between these two doesn't already exist
        for (let conn of this._outputs) {
            if (conn instanceof Circuit.Wire && conn._output == component) {
                throw (
                    `Cannot connect component: already connected to component (output).` +
                    component.toString() +
                    "->" +
                    this.toString()
                );
            }
        }
        // for (let conn of this._inputs) {
        //     if (conn instanceof Circuit.Wire && conn._input == component) {
        //         console.warn(`Cannot connect component: already connected to component (input).`, component, '->', this);
        //         return;
        //     }
        // }

        // Create connection is possible
        if (
            this._outputCount < this._outputMax &&
            component._inputCount < component._inputMax
        ) {
            // Loop-like pattern
            if (wirePath === Circuit.LOOP) {
                const xpad = 20;
                const ypad = 100;

                wirePath = [
                    [this._x + this._w + xpad, this._y],
                    [this._x + this._w + xpad, this._y + ypad],
                    [component._x - component._w - xpad, this._y + ypad],
                    [component._x - component._w - xpad, component._y],
                ];
            }

            /**
             * Circuit that we are connecting in
             * @type Circuit
             */
            let circuit = this._circuit;

            /** == If connecting FROM junction == **/
            if (
                this instanceof Circuit.Connector &&
                !(component instanceof Circuit.Connector)
            ) {
                /** == At the end. Elevate component back to original circuit **/
                if (this._isEnd) {
                    circuit = this._circuit;
                } else {
                    /** == Is not the end: beginning. Set-up conn to sub-circuit **/
                    // Get which output this is
                    const outputNo = this._outputCount;

                    if (outputNo === 0) {
                        this.setupConn1(component, wirePath, data);
                    } else if (outputNo === 1) {
                        this.setupConn2(component, wirePath, data);
                    } else {
                        console.warn(
                            `Cannot connect component: junction may only have 2 connections.`,
                            this
                        );
                    }
                    return;
                }
            }

            /** == If connecting TO junction, set up connection from sub-circuit == **/
            // If this' circuit's depth is above 0 and the circuit we are in is component._circuit...
            else if (
                component instanceof Circuit.Connector &&
                !(this instanceof Circuit.Connector) &&
                this._circuit._depth > 0
            ) {
                // Original circuit must be depth - 1, so find that
                const originalDepth = this._circuit._depth - 1;
                let originalCircuit = null;
                for (
                    let i = this.control.components.length - 1; i >= 0; i--
                ) {
                    let component = this.control.components[i];
                    if (
                        component._circuit instanceof Circuit &&
                        component._circuit._depth === originalDepth
                    ) {
                        originalCircuit = component._circuit;
                        break;
                    }
                }

                // COntinue back to normal if originalCircuit not found
                if (originalCircuit !== null) {
                    circuit = originalCircuit;
                    component.end(); // End of line for Connector
                } else {
                    throw new TypeError(
                        `Original circuit could not be found (depth: ${originalDepth})`
                    );
                }
            }

            // Default connection
            let wire = new Circuit.Wire(circuit, this, component, wirePath);

            for (let prop in data) {
                if (data.hasOwnProperty(prop)) {
                    if (wire["_" + prop] !== undefined) wire["_" + prop] = data[prop];
                }
            }

            this._outputCount++;
            this._outputs.push(wire);

            component._circuit = circuit;
            component._inputs.push(wire);
            component._inputCount++;

            circuit.components.push(component);
            circuit.wires.push(wire);
            this.control.wires.push(wire);
        } else {
            console.warn(
                `Cannot connect component: too many connections.`,
                component,
                "->",
                this
            );
        }
        return this;
    }

    /**
     * Connect coordinates for inputs
     * - Should be overridden for each component, but here just in case :)
     * @param  {Number} no  Input number
     * @return {Number[]} Coordinates [x, y]
     */
    getInputCoords(no) {
        const move = utils.polToCart(-this._angle, this._w / 2);
        return [this._x - move[0], this._y + move[1]];
    }

    /**
     * Connect coordinates for outputs
     * - Should be overridden for each component, but here just in case :)
     * @param  {Number} no  Input number
     * @return {Number[]} Coordinates [x, y]
     */
    getOutputCoords(no) {
        const move = utils.polToCart(this._angle, this._w / 2);
        return [this._x + move[0], this._y + move[1]];
    }

    /**
     * Get data for this component
     * @return {object} JSON data
     */
    getData() {
        let data = {
            type: this.constructor.name,
            pos: [this._x, this._y],
            data: {
                maxCurrent: isFinite(this._maxCurrent) ?
                    this._maxCurrent : Number.MAX_SAFE_INTEGER, // Avoid any 'Infinity' values
            },
        };

        // If these aren't the same, they are being masked therefore no need to set
        if (this.resistance === this._resistance)
            data.data.resistance = this.resistance;

        if (this._angle !== 0) data.data.angle = this._angle;

        // Loop through toStore
        const toStore = this.constructor.toStore;
        if (Array.isArray(toStore) && toStore.length !== 0) {
            for (let store of toStore) {
                const val = this["_" + store];
                if (val === undefined)
                    throw new TypeError(
                        `getData(#${this._id}): cannot store undefined value '${store}' (in constructor ${this.constructor.name})`
                    );
                data.data[store] = val;
            }
        }

        // Connections (only worry about outputs)
        if (this._outputs.length > 0) {
            data.conns = [];
            for (let i = 0; i < this._outputs.length; i++) {
                let conn = this._outputs[i];
                if (conn instanceof Circuit.Wire) {
                    data.conns.push(conn.getData());
                }
            }
        }

        if (Object.keys(data.data).length === 0) delete data.data;

        return data;
    }

    /**
     * Is this component blown?
     * - Is the current exceeding the maxCurrent?
     * @return {Boolean} Blown?
     */
    isBlown() {
        return (
            this._blown ||
            Math.abs(this.current) > this.maxCurrent ||
            Math.abs(this.current) > Number.MAX_SAFE_INTEGER
        );
    }

    /**
     * Blow the component
     * @param {String} msg  Msg to show to user
     */
    blow(msg = undefined) {
        if (typeof msg !== "string") {
            msg = `Component type ${this.toString()} blew on ${
                    this.current
                }A, exceeding its limit of ${this.maxCurrent}A`;
        }

        this._circuit.break(this);

        if (!this._blown) {
            this._blown = true;
            Sounds.Play("Blow");
            this.control.updateLightLevel();
        }

        console.log(
            "%c" + msg,
            "font-size: 1.1em; color: magenta; font-weight: bold;"
        );
        // if (typeof Page === 'object' && typeof Page.controls.)
        // window.alert(msg);
    }

    /**
     * Is this component 'on'?
     * @return {Boolean} Is it on?
     */
    isOn() {
        return !this._blown && this._current !== 0;
    }

    /**
     * Calculate wattage (power) of component
     * W = V * I
     * @return {Number} Component's wattage (in W, J/s)
     */
    power() {
        if (this._blown) return 0;
        const v = this.voltage;
        const i = this.current;
        return v * i;
    }

    /**
     * Calculate luminoscity of component
     * - Only works with luminous components (if component has _lpw property)
     * ΦV(lm) = P(W) * η(lm/W)
     * @return {Number} Component's wattage
     */
    luminoscity() {
        if (typeof this._lpw !== "number") return Number.NaN;
        if (this._blown) return 0;
        const P = this.power();
        const η = this._lpw;
        const ΦV = P * η;
        return ΦV;
    }

    /**
     * How much light is this component receivng from the surroundings?
     * @return {Number} Light level (lumens)
     */
    lightRecieving() {
        // If we are luminous...
        let lumens = this.luminoscity();
        if (this._blown) return -1;
        if (!isNaN(lumens)) return lumens + this.control._lightLevel;

        // Assemble array of all luminous components
        let luminous = [];
        this.control.forEach((c) => {
            if (typeof c._lpw === "number") luminous.push(c);
        });

        const backgroundLight = this.control._lightLevel;
        if (luminous.length > 0) {
            // Get all components which are shining on me
            let shining = [backgroundLight];
            for (let comp of luminous) {
                const d = this.distSq(comp) - this._w ** 2;
                const lumens = comp.luminoscity();
                const radius = Control.calcLumenRadius(lumens);
                if (d < radius ** 2) {
                    // Calculate heat at a distance
                    const sqrtD = Math.sqrt(d);
                    const fract = (radius - sqrtD) / radius; // Percentage into sphere
                    const brightness = fract * lumens; // Multiply distance of penetration by lumens
                    shining.push(backgroundLight + brightness);
                }
            }

            // Calculate combined brightness
            shining = shining.filter(n => !isNaN(n));
            const avg = shining.reduce((acc, current) => acc + current);
            return avg;
        } else {
            // No luminous components; return ambient light
            return this.control._lightLevel;
        }
    }

    /**
     * Calculate heat due to conduction through the component, given t (time in seconds)
     * - Called Joule's Equation of Electrical Heatomg
     * @param  {Number} t Time (conduction time)
     * @return {Number}   The heat energy in Joules
     */
    getHeat(t = 1) {
        const i = this.current;
        const r = this.resistance;
        return i * i * r * t;
    }

    /**
     * How many degrees celcius are we reciecing from the surroundings?
     * @return {[type]} [description]
     */
    heatRecieving(log = false) {
        // Get all heat-emmitent components
        const emitters = [];
        this.control.forEach((c) => {
            if (Control.isHeatEmitter(c)) emitters.push(c);
        });

        const backgroundTemp = this.control._temperature;
        if (emitters.length > 0) {
            // Get all components which are in temperature range of me
            let temps = [backgroundTemp];
            for (let comp of emitters) {
                if (comp === this) {
                    temps.push(backgroundTemp + this.celcius());
                    continue;
                }

                const d = this.distSq(comp);
                const deg = comp.celcius();
                const radius = Control.calcTempRadius(deg);
                if (d < radius ** 2) {
                    // Calculate heat at a distance
                    const sqrtD = Math.sqrt(d);
                    const fract = (radius - sqrtD) / radius;
                    const temp = fract * deg;
                    temps.push(backgroundTemp + temp);
                }
            }

            // Calculate maximum temperature
            const max = temps.length === 1 ? temps[0] : Math.max(...temps);
            if (log) console.log(temps, max);
            return max;
        } else {
            // No heat emitters; return background temp
            return this.control._temperature;
        }
    }

    /**
     * Trace forwards to a component
     * @param  {Component} component Component we're trying to find
     * @param  {Number} [depth=0]    Current recursion depth !! INTERNAL USE ONLY !!
     * @return {Component[]}         Array of trace components
     */
    traceForward(component, depth = 0) {
        if (depth !== 0 && this === component) {
            return [];
        }

        if (!this.passable()) {
            return null;
        }

        for (let wire of this._outputs) {
            if (wire instanceof Circuit.Wire) {
                let result = wire._output.traceForward(
                    component,
                    depth + 1
                );

                if (result !== null) {
                    return depth === 0 ? result : [this, ...result];
                }
            }
        }

        return null;
    }

    /**
     * Is this component passable?
     * @return {Boolean} true/false
     */
    passable() {
        if (this._circuit._isBroken && this._circuit._brokenBy === this) {
            // Broke the circuit :(
            return false;
        } else if (this.isBlown()) {
            // Is blown :(
            return false;
        }
        return true;
    }

    /**
     * Trace backwards to a component
     * @param  {Component} component Component we're trying to find
     * @param  {Number} [depth=0]    Current recursion depth !! INTERNAL USE ONLY !!
     * @return {Component[]}         Array of trace components
     */
    traceBackward(component, depth = 0) {
        if (depth !== 0 && this === component) {
            return [component];
        }

        if (!this.passable()) {
            return null;
        }

        let path = [this];
        for (let wire of this._inputs) {
            if (wire instanceof Circuit.Wire) {
                let c = wire._input;
                let result = c.traceBackward(component, depth + 1);
                if (result !== null) {
                    path = path.concat(result);
                    return path;
                }
            }
        }
        return null;
    }

    /**
     * Trace logically to a component
     * @param  {Component} component Component we're trying to find
     * @param  {Boolean} isRestrained Is the trace restrained to only go forward (true), or can we go backwards as well (false)?
     * @param  {Number} [depth=0]    Current recursion depth !! INTERNAL USE ONLY !!
     * @param  {Wire[]} [scannedWires=null] Array of scanned wires !! INTERNAL USE ONLY !!
     * @return {Component[]}         Array of trace components
     */
    trace(component, isRestrained = true, depth = 0, scannedWires = []) {
        if (depth !== 0 && this === component) {
            return [];
        }

        // Is component passable?
        if (!this.passable()) {
            // console.log("Broke on", this);
            return null;
        }

        // Only get shorted path
        let shortest_length = Number.MAX_SAFE_INTEGER;
        let shortest_path;

        // Array of components to scan, and which property to access in Wire object
        let wirePropName = "_output";
        let toScan = isRestrained ?
            this._outputs : [...this._outputs, ...this._inputs];

        for (let i = 0; i < toScan.length; i++) {
            let wire = toScan[i];
            if (!isRestrained && i === this._outputs.length) {
                // If not restrained, scanning both inputs and outputs.
                // After scanned outputs, switch to inputs, and so change wire property to access as well.
                wirePropName = "_input";
            }

            if (wire instanceof Circuit.Wire) {
                // Should we skip?
                {
                    let skip = false;
                    skip = scannedWires.indexOf(wire) !== -1;

                    // If TwoWaySwitch, only scan the _exec circuit
                    if (this instanceof Circuit.TwoWaySwitch) {
                        skip =
                            skip ||
                            (this._exec === Circuit.Connector.EXEC_ONE &&
                                wire[wirePropName]._circuit ===
                                this._circuit2);
                        skip =
                            skip ||
                            (this._exec === Circuit.Connector.EXEC_TWO &&
                                wire[wirePropName]._circuit ===
                                this._circuit1);
                    }

                    if (skip) continue;
                }

                scannedWires.push(wire);
                let result = wire[wirePropName].trace(
                    component,
                    isRestrained,
                    depth + 1,
                    [...scannedWires]
                );

                if (result !== null && result.length < shortest_length) {
                    shortest_length = result.length;
                    shortest_path = result;
                }
            }
        }

        return Array.isArray(shortest_path) ?
            depth === 0 ?
            shortest_path : [this, ...shortest_path] :
            null;
    }


    /**
     * Remove component
     * @return {Component} this
     */
    remove() {
        for (let input of this._inputs) input.remove();
        for (let output of this._outputs) output.remove();
        utils.arrRemove(this, this._circuit.components);
        utils.arrRemove(this, this._circuit._control.components);

        if (this.control._over === this) this.control._over = null;
        if (this.control._selected === this) this.control._selected = null;
        return this;
    }
}

// Text size for volts etc...
Component.SMALL_TEXT = 11.5;

// Default width of component
Component.DEFAULT_WIDTH = 50;

// "0" resistance to stop things breaking
Component.ZERO_RESISTANCE = 1e-10;

// "Low" resistance for e.g. smmeter. Not actually zero, but so small it is considered irrelevant.
Component.LOW_RESISTANCE = 0.001;

// "Infinite" resistance (max safe integer a float can represent and still so maths on)
Component.INFIN_RESISTANCE = Number.MAX_SAFE_INTEGER / 1.2;

export default Component;