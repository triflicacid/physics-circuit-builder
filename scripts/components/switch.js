Circuit.Switch = (function() {
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
                if (this.isOpen()) {
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
            return open;
        }
    }

    Switch.OPEN = 1;
    Switch.CLOSED = 0;

    return Switch;
})();
