Circuit.Component = (function() {
    /**
     * Template to all components
     *
     * @property (readonly) control       Parent Control
     * @property (readonly) p5            p5 instance
     * @property _circuit       Parent Circuit
     * @property _renderSetup   Has the render stuff been set up?
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
     *
     * @property resistance     Components' resistance
     * @property (readonly) voltage The voltage across the component
     * @property (readonly) current Get current running through the component
     * @property maxCurrent         What is the max current this component can handle?
     *
     * @method setupRender(x, y)    Initiate position of the Cell and prepare for .render()
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
     * @method getWatts()           Calculate wattage of component
     * @method getHeat(t)           Calculate heat of conduction through component
     */
    class Component {
        constructor(parentCircuit) {
            this._circuit = parentCircuit;
            if (!(this._circuit instanceof Circuit)) throw new TypeError(`Component: cannot resolve argument 'parentCircuit' to a Circuit instance`);

            this._renderSetup = false;
            this._x = 0;
            this._y = 0;
            this._w = 50;
            this._h = this._w;
            this._debug = false;
            this._highlighted = false;
            this._selected = false;
            this._lvl = 0;
            this._resistance = 2;
            this._voltage = 0;
            this._maxCurrent = 5;
            this._angle = 0;

            // Input connections (reference only)
            this._inputCount = 0;
            this._inputMax = 1;
            this._inputs = [];

            // Output connections
            this._outputCount = 0;
            this._outputMax = 1;
            this._outputs = [];
        }

        get resistance() { return this._resistance; }
        set resistance(r) {
            if (typeof r !== 'number' || isNaN(r)) throw new TypeError(`set resistance: expected integer, got '${r}'`);
            if (r <= 0) r = 0.0001;
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

        get current() {
            return this.control._running ? this._circuit.current : 0;
        }

        get maxCurrent() { return this._maxCurrent; }
        set maxCurrent(v) {
            if (typeof v !== 'number' || isNaN(v)) throw new TypeError(`set maxCurrent: expected integer, got '${v}'`);
            if (v <= 0) v = 1;
            this._maxCurrent = v;
        }

        get control() { return this._circuit._control; }
        get p5() { return this._circuit._control._p5; }

        /**
         * Set up the rendering of the cell
         * @param  {Number} x X coordinate of the Cell
         * @param  {Number} y Y coordinate of the Cell
         * @return {Cell}    Return this (chainable)
         */
        setupRender(x, y) {
            this._renderSetup = true;
            this.move(x, y);
            return this;
        }

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
                this._circuit._isBroken = true;
                this._circuit._brokenBy = this;
                console.warn(`Component type ${this.constructor.name} blew on ${this.current}A, exceeding its limit of ${this.maxCurrent}A`);
            }

            if (typeof fn === 'function') fn(this._circuit._isBroken, isBlown);

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
         *          fn(p5_instance, colour, isCircuitRunning, isCircuitBroken)
         */
        render(fn) {
            if (!this._renderSetup) throw new TypeError(`Cannot invoking render before setupRender`);
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
            p.rotate(this._angle);

            // Function - assitional render code
            if (typeof fn === 'function') {
                let colour = this._highlighted ? p.color(220, 100, 100) : p.color(0);
                fn(p, colour, this.control._running, this._circuit._isBroken); // Other rendering shenanigans
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
            for (let conn of this._inputs) {
                if (conn instanceof Circuit.Wire && conn._input == component) {
                    console.warn(`Cannot connect component: already connected to component (input).`, component, '->', this);
                    return;
                }
            }

            // Create connection is possible
            if (this._outputCount < this._outputMax && component._inputCount < component._inputMax) {
                // Loop-like pattern
                if (wirePath === Circuit.LOOP) {
                    const xpad = 20;
                    const ypad = 100;

                    wirePath = [
                        [this._x + this._w + xpad, this._y],
                        [this._x + this._w + xpad, this._y + ypad],
                        [component._x - component._w - xpad, component._y + ypad],
                        [component._x - component._w - xpad, component._y],
                    ];
                }

                let wire = new Circuit.Wire(this._circuit, this, component, wirePath);

                this._outputCount++;
                this._outputs.push(wire);

                component._circuit = this._circuit;
                component._inputs.push(wire);
                component._inputCount++;

                this._circuit.components.push(component);
                this._circuit.wires.push(wire);
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
                    if (conn instanceof Wire) {
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
            return Math.abs(this.current) > this.maxCurrent;
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
    }

    return Component;
})();
