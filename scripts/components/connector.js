[Circuit.Connector, Circuit.ToggleConnector] = (function() {
    /**
     * Handles a split in a wire
     * @extends Component (template.js)
     *
     * @property _circuit   Original circuit
     * @property _circuit1  Circuit for 1st connection
     * @property _circuit2  Circuit for 2nd connection
     * @property _isEnd     Is this at the end of a sub-circuit?
     * @property _exec      Whichi circuit(s) to execute
     *
     * @method getResistance()          Calculate resistance of two sub-circuits
     * @method setupConn1(component)    Set-up connection for circuit1
     * @method setupConn2(component)    Set-up connection for circuit2
     * @method eval()                   Split current between sub-circuits according to resistance
     * @method render()
     * @method end()                    Make an end-connector
     */
    class Connector extends Circuit.Component {
        constructor(parentCircuit) {
            super(parentCircuit);

            this._w = 9;
            this._h = this._w;
            this._inputMax = 1;
            this._outputMax = 2;

            this._circuit1 = undefined;
            this._circuit2 = undefined;
            this._isEnd = false;
            this._maxCurrent = Infinity;
            this._exec = Connector.EXEC_ALL;
        }

        get resistance() { return this.getResistance(); }
        get circuit1() { return this._circuit1; }
        get circuit2() { return this._circuit2; }

        /**
         * Calculate resistance of sub-circuits
         * @override
         * @return {Number} resistance
         */
        getResistance() {
            if (this._isEnd) return 0;

            if (this instanceof ToggleConnector) {
                // Get resistance of active circuit
                if (this._exec === Connector.EXEC_ONE) return (this._circuit1 instanceof Circuit) ? this._circuit1.getResistance() : 0;
                if (this._exec === Connector.EXEC_TWO) return (this._circuit2 instanceof Circuit) ? this._circuit2.getResistance() : 0;
            } else {
                // Return resistance of one if the other is (a) unexistant or (b) broken
                if (this.circuit1 === undefined || this.circuit1._isBroken) return (this._circuit2 instanceof Circuit) ? this._circuit2.getResistance() : 0;
                if (this.circuit2 === undefined || this.circuit2._isBroken) return (this._circuit1 instanceof Circuit) ? this._circuit1.getResistance() : 0;
            }

            // Get resistances of all sub-circuits
            const resistances = [
                this.circuit1.getResistance(),
                this.circuit2.getResistance()
            ];

            // Calculate resistances in parallel
            const res = resistanceInParallel(...resistances);
            return res;
        }

        /**
         * Set-up connection to sub-circuit 1
         * @param  {Component} component    Component connecting to (i.e. the first component in circuit1)
         * @param  {Number[][]} wirePath    Path of point for the path
         * @return {Circuit} The new sub-circuit
         */
        setupConn1(component, wirePath = []) {
            return this._setupConn(1, component, wirePath);
        }

        /**
         * Set-up connection to sub-circuit 2
         * @param  {Component} component    Component connecting to (i.e. the first component in circuit1)
         * @param  {Number[][]} wirePath    Path of point for the path
         * @return {Circuit} The new sub-circuit
         */
        setupConn2(component, wirePath = []) {
            return this._setupConn(2, component, wirePath);
        }

        /**
         * Set-up connection to sub-circuit N
         * @param  {Number}    N            1 or 2 (circuit1 or circuit2)
         * @param  {Component} component    Component connecting to (i.e. the first component in circuit1)
         * @param  {Number[][]} wirePath    Path of point for the path
         * @return {Circuit} The new sub-circuit
         */
        _setupConn(N, component, wirePath = []) {
            if (N !== 1 && N !== 2) throw new TypeError(`_setupConn: N: expected '1' or '2', got '${N}'`);
            let CIRCUIT = this['circuit' + N];

            if (!Control.isComponent(component)) throw new TypeError(`Connector.setupConn${N}: cannot set-up connection with non-component`, component);
            if (CIRCUIT !== undefined) throw new TypeError(`circuit${N} is already defined.`);

            const circuit = new Circuit(this.control, this._circuit);
            this['_circuit' + N] = circuit;
            circuit.components.push(component);
            component._circuit = circuit;

            const wire = new Circuit.Wire(this._circuit, this, component, wirePath);

            // Increase outputs (not required)
            this._outputCount++;
            this._outputs.push(wire);

            // Increase inputs (required)
            component._inputs.push(wire);
            component._inputCount++;

            // Sort out wires
            circuit.wires.push(wire);
            circuit._control.wires.push(wire);

            return this['circuit' + N];
        }

        /**
         * Split current between sub-circuits according to resistance in each
         */
        eval() {
            if (this._isEnd) {
                super.eval();
            } else {
                super.eval(() => {
                    if (this.circuit2 === undefined || this.circuit2._isBroken) {
                        this._circuit1.current = this._circuit.getCurrent();
                    } else if (this.circuit1 === undefined || this.circuit1._isBroken) {
                        this._circuit2.current = this._circuit.getCurrent();
                    } else {
                        const r1 = this.circuit1.getResistance();
                        const r2 = this.circuit2.getResistance();
                        const v = this.voltage;

                        const c1 = v / r1;
                        const c2 = v / r2;

                        this._circuit1.current = c1;
                        this._circuit2.current = c2;
                    }
                });
            }
        }

        /**
         * Renders component connector
         */
        render() {
            super.render((p, colour, running) => {
                p.noStroke();
                p.fill(colour);
                // p.rect(0, 0, this._w, this._h);
                p.ellipse(0, 0, this._w, this._h);
            });
        }

        /**
         * Make this connector into an end-connector
         */
        end() {
            this._isEnd = true;
            this._inputMax = 2;
            this._outputMax = 1;
        }

        /**
         * Connect coordinates for inputs
         * @return {Number[]} Coordinates [x, y]
         */
        getInputCoords() {
            return [this._x, this._y];
        }

        /**
         * Connect coordinates for outputs
         * @return {Number[]} Coordinates [x, y]
         */
        getOutputCoords() {
            return [this._x, this._y];
        }
    }
    Connector.EXEC_ALL = 0;
    Connector.EXEC_ONE = 1;
    Connector.EXEC_TWO = 2;

    /**
     * Like connector, but switches between executing one circuit to the other
     * @extends Connector
     *
     * @property _originalExec      The original value of _exec
     *
     * @method one()        Only execute circuit 1
     * @method two()        Only execute circuit 2
     * @method toggle()     Flip execution
     * @method eval()
     * @method render()
     */
    class ToggleConnector extends Connector {
        constructor(parentCircuit) {
            super(parentCircuit);

            this._exec = Math.random() <= 0.5 ? Connector.EXEC_ONE : Connector.EXEC_TWO;
            this._originalExec = this._exec;
        }

        /**
         * Switch _exec to circuit 1
         */
        one() {
            this._exec = Connector.EXEC_ONE;
        }

        /**
         * Switch _exec to circuit 2
         */
        two() {
            this._exec = Connector.EXEC_ONE;
        }

        /**
         * Toggle which circuit to execute
         * @param  {Boolean} [playSound=false]  Play toggle sound
         * @return {Number}                     Which circuit are we executing? 1 or 2?
         */
        toggle(playSound = false) {
            this._exec = (this._exec === Connector.EXEC_ONE) ? Connector.EXEC_TWO : Connector.EXEC_ONE;
            if (playSound) Sounds.Play('toggle-' + (this._exec === this._originalExec ? 'off' : 'on'));
            return this._exec;
        }

        /**
         * Evaluate the component
         */
        eval() {
            Circuit.Component.prototype.eval.call(this, () => {
                if (!this._isEnd) {
                    // Unbreak if necessary
                    if (this._circuit1 !== undefined && this._circuit1._brokenBy === this) this._circuit1.break(null);
                    if (this._circuit2 !== undefined && this._circuit2._brokenBy === this) this._circuit2.break(null);

                    // If executing circuit 1...
                    if (this._exec === Connector.EXEC_ONE) {
                        // Set current if possible
                        if (this._circuit1 !== undefined) this._circuit1.current = this.current;

                        // Stop other circuit
                        if (this._circuit2 !== undefined) {
                            this._circuit2.break(this);
                        }
                    }

                    // If executing circuit 2...
                    else if (this._exec === Connector.EXEC_TWO) {
                        // Set current if possible
                        if (this._circuit2 !== undefined) this._circuit2.current = this.current;

                        // Stop other circuit
                        if (this._circuit1 !== undefined) {
                            this._circuit1.break(this);
                        }
                    }
                }
            });
        }

        /**
         * Renders component connector
         */
        render() {
            const isOn = this.isOn();

            Circuit.Component.prototype.render.call(this, (p, colour, running) => {
                p.noStroke();
                p.fill(colour);
                p.ellipse(0, 0, this._w, this._h);

                if (running && isOn) {
                    p.fill(255, 0, 0);
                    p.textSize(Circuit.SMALL_TEXT);
                    p.text(this._exec, -3, -this._h / 2 - 3);
                }
            });
        }

        // passable() {
        //     return super.passable((target) => {
        //         // Is this component in a blocked-off circuit?
        //         if (target._circuit == this._circuit1 && this._exec !== Connector.EXEC_ONE) return false;
        //         if (target._circuit == this._circuit2 && this._exec !== Connector.EXEC_TWO) return false;
        //         return true;
        //     });
        // }
    }

    return [Connector, ToggleConnector];
})();
