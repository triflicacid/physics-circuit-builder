[Circuit.LogicalNot] = (function() {
    /**
     * Logival not gate: maps a low/high value on to a high/low value
     * @extends Component
     *
     * @property _before        State before eval()
     * @property _after         State after eval()
     *
     * @method getState()   Get state. HIGH / LOW
     * @method render()
     */
    class LogicalNot extends Circuit.Component {
        constructor(parentCircuit) {
            super(parentCircuit);
            this._maxCurrent = Infinity;

            this._before = '-';
            this._after = '-';
        }

        get resistance() { return Circuit.ZERO_RESISTANCE; }

        /**
         * Get supply voltage to logic
         * @return {Number} voltage
         */
        supplyVoltage() {
            return this._circuit.getVoltage();
        }

        /**
         * Get state. HIGH/LOW
         * @return {Number} Circuit.HIGH or Circuit.LOW
         */
        getState() {
            const v = this.supplyVoltage();
            return Circuit.logic.getState(v);
        }

        eval() {
            super.eval(() => {
                // Get current state
                const v = this.supplyVoltage();
                this._before = Circuit.logic.getState(v, true);

                let newV = null;
                if (Circuit.logic.isLow(v)) {
                    newV = mapNumber(v, ...Circuit.logic.LOW_RANGE, ...Circuit.logic.HIGH_RANGE);
                } else if (Circuit.logic.isHigh(v)) {
                    newV = mapNumber(v, ...Circuit.logic.HIGH_RANGE, ...Circuit.logic.LOW_RANGE);
                }
                this._after = Circuit.logic.getState(newV, true);

                if (typeof newV === 'number') {
                    // Calculate new current
                    const r = this._circuit.getResistance();
                    const i = newV / r;
                    this._circuit.current = i;
                }
            });
        }

        render() {
            const isOn = this.isOn();

            super.render((p, colour, running) => {
                p.noStroke();
                p.fill(colour);

                // Triangle
                const d = 11;
                p.beginShape();
                p.vertex(-this._w / 2, this._h / 2);
                p.vertex(-this._w / 2, -this._h / 2);
                p.vertex(this._w / 2 - (d - 3), 0);
                p.endShape(p.CLOSE);

                // Circle
                p.ellipse(this._w / 2 - d / 2, 0, d, d);

                // Reading of current in green label
                if (running) {
                    p.textAlign(p.CENTER, p.CENTER);
                    p.strokeWeight(1);
                    p.stroke(0, 100, 0);
                    p.fill(160, 255, 200);
                    p.rect(0, this._h / 1.3, this._w, this._h / 3);

                    p.textSize(Circuit.SMALL_TEXT);
                    p.noStroke();
                    p.fill(0);

                    p.text(`${this._before} → ${this._after}`, 0, this._h / 1.25);
                }
                p.textAlign(p.LEFT, p.LEFT);
            });
        }
    }

    return [LogicalNot];
})();
