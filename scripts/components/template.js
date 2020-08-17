Circuit.Component = (function() {
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
     * @property _playedBlowSound Have we played the "blow" sound?
     *
     * @property resistance         Components' resistance
     * @property (readonly) voltage The voltage across the component
     * @property current            Get current running through the component
     * @property maxCurrent         What is the max current this component can handle?
     *
     * @method toString()           String representation of object
     * @method move(x, y)           Change coordinates of component
     * @method render(fn)           Render wrapper
     * @method contains(x, y)       Are the provided [x, y] inside this component?
     * @method select() / unselect() Toggle state of this._selected
     * @method highlight() / unhighlight() Toggle state of this._highlight
     * @method setResistance(r)     Set resistance
     * @method setMaxVoltage()      Set a maximum voltage
     * @method setMaxCurrent(v)     Set the max current (chainable)
     * @method connectTo(component) Attempt to connect this to a component
     * @method getInputCoords()     Coordinates to connect the input from.
     * @method getOutputCoords()    Coordinates to connect the output to.
     * @method getData()            Get data for this component
     * @method isBlown()            Is this component 'blown'
     * @method isOn()               Is this component being 'on'?
     * @method getWatts()           Calculate wattage of component
     * @method getHeat(t)           Calculate heat of conduction through component
     * @method passable()           Is thie component 'passable' (i.e. not blown, shut etc...)
     * @method traceForward(c)      Trace through the circuit until reached component
     * @method traceBackward(c)     Trace through the circuit backwards until reached component
     * @method roundTrip(v)         Find the round trip and calculate stuff from it (v)
     */
    class Component {
        constructor(parentCircuit) {
            this._circuit = parentCircuit;
            if (!(this._circuit instanceof Circuit)) throw new TypeError(`Component: cannot resolve argument 'parentCircuit' to a Circuit instance`);

            // General stuff
            this._id = Component.NextID++;
            this._lvl = 0;
            this._resistance = randomFloat(0, 2);
            this._current = 0;
            this._maxCurrent = 5;

            // Drawing stuff
            this._x = 0;
            this._y = 0;
            this._w = 50;
            this._h = this._w;
            this._debug = false;
            this._highlighted = false;
            this._selected = false;
            this._angle = 0;
            this._playedBlowSound = false;

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
            return this.constructor.name + '#' + this._id;
        }

        get resistance() { return this._resistance; }
        set resistance(r) {
            if (typeof r !== 'number' || isNaN(r)) throw new TypeError(`set resistance: expected integer, got '${r}'`);
            if (r <= 0) r = Circuit.ZERO_RESISTANCE;
            this._resistance = r;
        }
        getResistance() { return this.resistance; }

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
        get maxCurrent() { return this._maxCurrent; }
        set maxCurrent(v) {
            if (typeof v !== 'number' || isNaN(v)) throw new TypeError(`set maxCurrent: expected integer, got '${v}'`);
            if (v <= 0) v = 1;
            this._maxCurrent = v;
        }

        /**
         * This circuits' control
         */
        get control() { return this._circuit._control; }

        /**
         * The P5 sketch
         */
        get p5() { return this._circuit._control._p5; }

        /**
         * Move position of component
         * @param {Number} x X coordinate of the Cell
         * @param {Number} y Y coordinate of the Cell
         * @return {Cell}    Return this (chainable
         */
        move(x, y) {
            let pad = this._w / 2;
            this._x = clamp(x, pad, this._circuit._width - pad);
            this._y = clamp(y, pad, this._circuit._height - pad);
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
                this._circuit.break(this);
                console.log(`%cComponent type ${this.constructor.name} blew on ${this.current}A, exceeding its limit of ${this.maxCurrent}A`, 'font-size: 1.1em; color: magenta; font-weight: bold;');

                if (!this._playedBlowSound) {
                    this._playedBlowSound = true;
                    Sounds.Play('Blow');
                }
            }

            if (typeof fn === 'function') fn(this._circuit.isBroken(), isBlown);

            // Bubble forward
            for (let component of this._outputs) {
                if (component._output == this._circuit._control._head) break;
                if (typeof component._output.eval === 'function') {
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

            // Sort out connections
            p.stroke(0);
            p.strokeWeight(1.5);
            for (let conn of this._outputs) {
                conn.render();
            }

            p.rectMode(p.CENTER);
            p.push();
            p.translate(this._x, this._y);
            // p.rotate(this._angle);

            // Function - assitional render code
            if (typeof fn === 'function') {
                let colour = this._highlighted ? p.color(200, 115, 80) : p.color(51);
                fn(p, colour, this.control._running); // Other rendering shenanigans
            }

            if (this._debug) {
                // Center dot
                p.stroke(255, 0, 0);
                p.ellipse(0, 0, 2, 2);

                // Bounding box
                p.stroke(255, 0, 255);

                p.strokeWeight(1);
                p.noFill();
                p.rect(0, 0, this._w, this._h);
            }

            p.pop();
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
            return (x > this._x - dx && x < this._x + dx &&
                y > this._y - dy && y < this._y + dy);
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
         * Set resistance of component
         * @param {Number} r The new resistance
         * @return {Component} Returns 'this' chainable)
         */
        setResistance(r) {
            this.resistance = r;
            return this;
        }

        /**
         * Set max voltage of component
         * @param {Number} v Max voltage
         * @return {Component} Returns 'this' chainable)
         */
        setMaxVoltage(v) {
            const current = Math.abs(v) / this.resistance;
            if (typeof current !== 'number') throw new TypeError(`Expected voltage value to be number`);
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
         * @return {Component}           Return 'this' (chainable)
         */
        connectTo(component, wirePath = []) {
            if (!(component instanceof Component)) throw new TypeError(`Cannot connect component to a non-component`);
            if (component === this) {
                console.warn(`Cannot connect component: cannot connect to oneself.`, component, '->', this);
                return;
            }

            // Check that connections between these two doesn't already exist
            for (let conn of this._outputs) {
                if (conn instanceof Circuit.Wire && conn._output == component) {
                    console.warn(`Cannot connect component: already connected to component (output).`, component, '->', this);
                    return;
                }
            }
            // for (let conn of this._inputs) {
            //     if (conn instanceof Circuit.Wire && conn._input == component) {
            //         console.warn(`Cannot connect component: already connected to component (input).`, component, '->', this);
            //         return;
            //     }
            // }

            // Create connection is possible
            if (this._outputCount < this._outputMax && component._inputCount < component._inputMax) {
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
                if (this instanceof Circuit.Connector && !(component instanceof Circuit.Connector)) {
                    /** == At the end. Elevate component back to original circuit **/
                    if (this._isEnd) {
                        circuit = this._circuit;
                    }

                    /** == Is not the end: beginning. Set-up conn to sub-circuit **/
                    else {
                        // Get which output this is
                        const outputNo = this._outputCount;

                        if (outputNo === 0) {
                            this.setupConn1(component, wirePath);
                        } else if (outputNo === 1) {
                            this.setupConn2(component, wirePath);
                        } else {
                            console.warn(`Cannot connect component: junction may only have 2 connections.`, this);
                        }
                        return;
                    }
                }

                /** == If connecting TO junction, set up connection from sub-circuit == **/
                // If this' circuit's depth is above 0 and the circuit we are in is component._circuit...
                else if (component instanceof Circuit.Connector && !(this instanceof Circuit.Connector) && this._circuit._depth > 0) {
                    // Original circuit must be depth - 1, so find that
                    const originalDepth = this._circuit._depth - 1;
                    let originalCircuit = null;
                    for (let i = this.control.components.length - 1; i >= 0; i--) {
                        let component = this.control.components[i];
                        if (component._circuit instanceof Circuit && component._circuit._depth === originalDepth) {
                            originalCircuit = component._circuit;
                            break;
                        }
                    }

                    // COntinue back to normal if originalCircuit not found
                    if (originalCircuit !== null) {
                        circuit = originalCircuit;
                        component.end(); // End of line for Connector
                    } else {
                        throw new TypeError(`Original circuit could not be found (depth: ${originalDepth})`);
                    }
                }

                // Default connection
                let wire = new Circuit.Wire(circuit, this, component, wirePath);

                this._outputCount++;
                this._outputs.push(wire);

                component._circuit = circuit;
                component._inputs.push(wire);
                component._inputCount++;

                circuit.components.push(component);
                circuit.wires.push(wire);
                this.control.wires.push(wire);
            } else {
                console.warn(`Cannot connect component: too many connections.`, component, '->', this);
            }
            return this;
        }

        /**
         * Connect coordinates for inputs
         * - Should be overridden for each component, but here just in case :)
         * @return {Number[]} Coordinates [x, y]
         */
        getInputCoords() {
            const move = polToCart(-this._angle, this._w / 2);
            return [
                this._x - move[0],
                this._y + move[1]
            ];
        }

        /**
         * Connect coordinates for outputs
         * - Should be overridden for each component, but here just in case :)
         * @return {Number[]} Coordinates [x, y]
         */
        getOutputCoords() {
            const move = polToCart(this._angle, this._w / 2);
            return [
                this._x + move[0],
                this._y + move[1]
            ];
        }

        /**
         * Get data for this component
         * @return {object} JSON data
         */
        getData() {
            let data = {
                type: this.constructor.name.toLowerCase(),
                pos: [this._x, this._y]
            };
            if (this.resistance !== 0) data.resistance = this.resistance;

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

            return data;
        }

        /**
         * Is this component blown?
         * - Is the current exceeding the maxCurrent?
         * @return {Boolean} Blown?
         */
        isBlown() {
            return Math.abs(this.current) > this.maxCurrent ||
                Math.abs(this.current) > Number.MAX_SAFE_INTEGER ||
                this._circuit._brokenBy === this;
        }

        /**
         * Is this component 'on'?
         * @return {Boolean} Is it on?
         */
        isOn() {
            return this._current !== 0;
        }

        /**
         * Falculate wattage of component
         * W = V * I
         * @return {Boolean} Component's wattage
         */
        getWatts() {
            const v = this.voltage;
            const i = this.current;
            return v * i;
        }

        /**
         * Calculate heat due to conduction through the component, given t (time in seconds)
         * @param  {Number} [t=1] Time (conduction time)
         * @return {Number}       The heat energy in Joules
         */
        getHeat(t = 1) {
            const i = this.current;
            const r = this.resistance;
            return i * i * r * t;
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
                    let result = wire._output.traceForward(component, depth + 1);
                    if (result !== null) {
                        return (depth === 0) ? result : [this, ...result];
                    }
                }
            }
            return null;
        }

        /**
         * Is this component passable?
         * @param  {Function} fn    Additional code to run
         * @return {Boolean} true/false
         */
        passable(fn) {
            let base = true;
            if (this._circuit._isBroken && this._circuit._brokenBy === this) {
                // Broke the circuit :(
                base = false;
            } else
            if (this.isBlown()) {
                // Is blown :(
                base = false;
            }

            if (base === true && typeof fn === 'function') {
                // Test against additional code
                const r = fn(this);
                return r;
            }

            return base;
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
         * @param  {Number} [depth=0]    Current recursion depth !! INTERNAL USE ONLY !!
         * @param  {Component[]} [scanned=null] Array of scanned components !! INTERNAL USE ONLY !!
         * @return {Component[]}         Array of trace components
         */
        trace(component, depth = 0, scanned = []) {
            if (depth !== 0 && this === component) {
                return [];
            }

            if (!this.passable()) {
                console.log("Broke on", this);
                return null;
            }

            if (this instanceof Circuit.Connector) {
                for (let wire of this._inputs) {
                    if (wire instanceof Circuit.Wire) {
                        if (scanned.indexOf(wire) !== -1) continue;

                        let result = wire._input.traceBackward(component, depth + 1, scanned);
                        scanned.push(wire);
                        if (result !== null) {
                            return (depth === 0) ? result : [this, ...result];
                        }
                    }
                }
            }

            for (let wire of this._outputs) {
                if (wire instanceof Circuit.Wire) {
                    if (scanned.indexOf(wire) !== -1) continue;

                    let result = wire._output.traceForward(component, depth + 1, scanned);
                    scanned.push(wire);
                    if (result !== null) {
                        return (depth === 0) ? result : [this, ...result];
                    }
                }
            }
            return null;
        }

        /**
         * Return array of components passed through to get back to oneself
         * @param  {String} val  What to return ('trace', 'resistance', 'current', 'voltage', 'debug')
         * @return {Component[]} array of components passed through
         */
        roundTrip(val = 'all') {
            const trace = this.trace(this);
            switch (val.toString().toLowerCase()) {
                case 'resistance': {
                    let tot = 0;
                    trace.forEach(x => tot += x.resistance);
                    return tot;
                }
                case 'voltage': {
                    let tot = 0;
                    trace.forEach(x => tot += x.voltage);
                    return tot;
                }
                case 'current': {
                    let tot = 0;
                    trace.forEach(x => tot += x.current);
                    return tot;
                }
                case 'debug':
                    return trace.map(c => c.toString());
                default:
                    return trace;
            }
        }

        /**
         * Get path to a component (if accessable)
         * @param  {Component} component    Component to access
         * @return {Component[]} access path or null if not accessible
         */
        accessPath(component) {
            const trace = this.roundTrip();
            if (trace === null) return null;
            if (trace.indexOf(component)) return trace;
            return null;
        }
    }

    Component.NextID = 0;

    return Component;
})();
