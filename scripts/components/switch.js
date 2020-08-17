[Circuit.Switch, Circuit.TwoWaySwitch] = (function() {
    /**
     * Switch: togglable wire
     * @extends Component (template.js)
     *
     * @property resistance         Changing this doesn't do anything now
     * @property _state             State of switch
     *
     * @method eval()               Evaluate the component
     * @method render()             Render the cell onto the global p5 sketch
     * @method setMaxCurrent(v)     Set the max current (chainable)
     * @method isOpen()             Is switch open?
     * @method open()               Open the switch
     * @method close()               Close the switch
     * @method toggle()             Toggle state of switch
     */
    class Switch extends Circuit.Component {
        constructor(parentCircuit) {
            super(parentCircuit);
            this._maxCurrent = Infinity;
            this._state = Switch.CLOSED;
            this._h /= 3;
        }

        get resistance() { return Circuit.ZERO_RESISTANCE; }

        /**
         * Evaluate the component
         */
        eval() {
            super.eval(() => {
                // Break if open
                if (this._state === Switch.OPEN && !this._circuit._isBroken) {
                    this._circuit.break(this);
                }

                // Only un-break if we are the ones who broken thr circuit
                else if (this._state === Switch.CLOSED && this._circuit._brokenBy == this) {
                    this._circuit.break(null);
                }
            });
        }

        /**
         * Render the component
         */
        render() {
            super.render((p, colour) => {
                const d = 9;

                // Circle each end
                p.noStroke();
                p.fill(colour);
                p.ellipse(-this._w / 2 + d / 2, 0, d, d);
                p.ellipse(this._w / 2 - d / 2, 0, d, d);

                p.strokeWeight(1.5);
                p.stroke(colour);
                if (!this.control._running || this.isOpen()) {
                    let pos = polToCart(-Math.PI / 4, this._w / 2.2);
                    p.line(-this._w / 2 + d / 2, 0, ...pos);
                } else {
                    // p.line(-this._w / 2 + d, 0, this._w / 2 - d, 0);
                    const off = d / 4;
                    p.line(-this._w / 2 + d / 2, -off, this._w / 2 - d / 2, off);
                }
            });
        }

        /**
         * If the switch open?
         * @return {Boolean} Open?
         */
        isOpen() {
            return this._state === Switch.OPEN;
        }

        /**
         * Open the switch
         */
        open() {
            this._state = Switch.OPEN;
        }

        /**
         * Close the switch
         */
        close() {
            this._state = Switch.CLOSED;
        }

        /**
         * Toggle state of switch
         * @return {Boolean} Is the switch now open?
         */
        toggle() {
            this._state = (this._state === Switch.OPEN) ? Switch.CLOSED : Switch.OPEN;
            let open = this.isOpen();
            Sounds.Play('toggle-' + (this.isOpen() ? 'on' : 'off'));
            this.control.updateLightLevel();
            return open;
        }
    }
    Switch.toStore = ['state'];
    Switch.OPEN = 1;
    Switch.CLOSED = 0;

    /**
     * Like connector, but switches between executing one circuit to the other
     * - OLD NAME: ToggleConnector
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
    class TwoWaySwitch extends Circuit.Connector {
        constructor(parentCircuit) {
            super(parentCircuit);

            this._exec = Math.random() <= 0.5 ? Circuit.Connector.EXEC_ONE : Circuit.Connector.EXEC_TWO;
            this._originalExec = this._exec;

            this._w = Circuit.Component.DEFAULT_WIDTH;
            this._h = this._w;

            delete this._isEnd;
        }

        /**
         * Switch _exec to circuit 1
         */
        one() {
            this._exec = Circuit.Connector.EXEC_ONE;
        }

        /**
         * Switch _exec to circuit 2
         */
        two() {
            this._exec = Circuit.Connector.EXEC_ONE;
        }

        /**
         * Toggle which circuit to execute
         * @param  {Boolean} playSound  Play toggle sound
         * @return {Number}              Which circuit are we executing? 1 or 2?
         */
        toggle(playSound = false) {
            this._exec = (this._exec === Circuit.Connector.EXEC_ONE) ? Circuit.Connector.EXEC_TWO : Circuit.Connector.EXEC_ONE;
            if (playSound) Sounds.Play('toggle-' + (this._exec === this._originalExec ? 'off' : 'on'));
            this.control.updateLightLevel();
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
                    if (this._exec === Circuit.Connector.EXEC_ONE) {
                        // Set current if possible
                        if (this._circuit1 !== undefined) this._circuit1.current = this.current;

                        // Stop other circuit
                        if (this._circuit2 !== undefined) {
                            this._circuit2.break(this);
                        }
                    }

                    // If executing circuit 2...
                    else if (this._exec === Circuit.Connector.EXEC_TWO) {
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
                const d = 9;
                // Input blob
                p.fill(colour);
                p.noStroke();
                let inputCoords = this.getInputCoords();
                inputCoords[0] -= this._x;
                inputCoords[1] -= this._y;
                p.ellipse(...inputCoords, d, d);

                // Output 1 blob
                p.fill(colour);
                p.noStroke();
                let output1Coords = this.getOutputCoords(0);
                output1Coords[0] -= this._x;
                output1Coords[1] -= this._y;
                p.ellipse(...output1Coords, d, d);

                // Output 2 blob
                p.fill(colour);
                p.noStroke();
                let output2Coords = this.getOutputCoords(1);
                output2Coords[0] -= this._x;
                output2Coords[1] -= this._y;
                p.ellipse(...output2Coords, d, d);

                // Lines
                p.stroke(colour);
                let outputCoords = (this._exec === Circuit.Connector.EXEC_ONE) ? output1Coords : output2Coords;
                p.line(...inputCoords, ...outputCoords);

                if (this._debug) {
                    p.noStroke();
                    p.fill(255, 0, 20);

                    // Labels from circuits
                    p.text('1', ...output1Coords);
                    p.text('2', ...output2Coords);
                }
            });
        }

        /**
         * Connect coordinates for inputs
         * - Should be overridden for each component, but here just in case :)
         * @param  {Number} no  Input number
         * @return {Number[]} Coordinates [x, y]
         */
        getInputCoords(no) {
            const move = polToCart(-this._angle, this._w / 2);
            return [
                this._x - move[0],
                this._y + move[1]
            ];
        }

        /**
         * Connect coordinates for outputs
         * - Should be overridden for each component, but here just in case :)
         * @param  {Number} no  Input number
         * @return {Number[]} Coordinates [x, y]
         */
        getOutputCoords(no) {
            const move = (no === 1) ?
                polToCart(this._angle, this._w / 2) :
                polToCart(this._angle + Degrees._90, this._w / 2);
            return [
                this._x + move[0],
                this._y + move[1]
            ];
        }
    }
    TwoWaySwitch.toStore = ['exec', 'originalExec'];

    return [Switch, TwoWaySwitch];
})();
