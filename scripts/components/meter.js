[Circuit.Ammeter, Circuit.Voltmeter, Circuit.Wattmeter, Circuit.Logicmeter] = (function() {
    /**
     * Ammeter: measure current and diaplay it
     * @extends Component (template.js)
     *
     * @property resistance         Changing this doesn't do anything now
     * @property _units             Units of ammeter (index of Ammeter.UNITS)
     *
     * @method changeUnits()        Change units
     * @method onScroll(e)          What to do when scrolled on?
     */
    class Ammeter extends Circuit.Component {
        constructor(parentCircuit) {
            super(parentCircuit);
            this._maxCurrent = Number.MAX_SAFE_INTEGER;
            this._units = 2; // 'A'
        }

        get resistance() { return Circuit.LOW_RESISTANCE; }

        /**
         * Render the component
         */
        render() {
            super.render((p, colour, running) => {
                const unit = Ammeter.UNITS[this._units];
                const isOn = this.isOn();

                // Circle
                p.strokeWeight(1);
                p.stroke(colour);
                p.fill(this.isBlown() ? p.random(100) : 255);
                p.ellipse(0, 0, this._w, this._w);

                // Units
                p.textAlign(p.CENTER, p.CENTER);
                p.textStyle(p.BOLD);
                p.noStroke();
                p.fill(colour);
                p.textSize(25);
                p.text(unit, 0, 0);
                p.textStyle(p.NORMAL);

                // Reading of current in green label
                if (running) {
                    p.strokeWeight(1);
                    p.stroke(0, 100, 0);
                    p.fill(160, 255, 200);
                    p.rect(0, this._h / 1.3, this._w, this._h / 3);

                    p.textSize(Circuit.SMALL_TEXT);
                    p.noStroke();
                    p.fill(0);
                    let current = this.current;
                    if (isOn) {
                        if (this._units === 0) current *= 1e6; // µA
                        else if (this._units === 1) current *= 1e3; // mA
                        else if (this._units === 3) current *= 1e-3; // kA
                        current = roundTo(current, 1);
                        if (current === 0) current = '< 0.1';
                        else if (current > 1e4) current = '> 10,000';
                    } else {
                        current = '- - -';
                    }
                    p.text(current, 0, this._h / 1.25);
                }
                p.textAlign(p.LEFT, p.LEFT);
            });
        }

        /**
         * Sitch between units
         * @return {Number} New unit index (Ammeter.UNITS)
         */
        changeUnits() {
            this._units++;
            if (this._units === Ammeter.UNITS.length) this._units = 0;
            return this._units;
        }

        /**
         * What to do on scroll (mouseWheel)
         * @param  {Event} event    Mouse wheel event
         */
        onScroll(event) {
            const delta = -Math.sign(event.deltaY);

            this._units += delta;

            if (this._units === Ammeter.UNITS.length) this._units = 0;
            else if (this._units === -1) this._units = Ammeter.UNITS.length - 1;

            if (this.control._componentShowingInfo === this && this.control._showInfo) {
                this.control.showDebugInfo(this);
            }
        }
    }

    Ammeter.UNITS = [Circuit.MICRO + 'A', 'mA', 'A', 'kA'];


    /**
     * Voltmeter: measure voltage accross a component and display it
     * @extends Component (template.js)
     *
     * @property resistance         Changing this doesn't do anything now
     */
    class Voltmeter extends Circuit.Component {
        constructor(parentCircuit) {
            super(parentCircuit);
            this._maxCurrent = Infinity;
        }

        get resistance() { return Circuit.INFIN_RESISTANCE; }

        /**
         * Render the component
         */
        render() {
            const isOn = this.isOn();

            super.render((p, colour, running) => {
                // Circle
                p.strokeWeight(1);
                p.stroke(colour);
                p.fill(this.isBlown() ? p.random(100) : 255);
                p.ellipse(0, 0, this._w, this._w);

                // 'V'
                p.textAlign(p.CENTER, p.CENTER);
                p.textStyle(p.BOLD);
                p.noStroke();
                p.fill(colour);
                p.textSize(25);
                p.text('V', 0, 2);
                p.textStyle(p.NORMAL);

                // Reading of current in green label
                if (running) {
                    p.strokeWeight(1);
                    p.stroke(0, 100, 0);
                    p.fill(160, 255, 200);
                    p.rect(0, this._h / 1.3, this._w, this._h / 3);

                    p.textSize(Circuit.SMALL_TEXT);
                    p.noStroke();
                    p.fill(0);
                    let voltage = roundTo(this.voltage, 1);
                    voltage = isOn ?
                        ((voltage === 0) ? '< 0.1' : voltage) + 'V' :
                        '- - -';
                    p.text(voltage, 0, this._h / 1.25);
                }
                p.textAlign(p.LEFT, p.LEFT);
            });
        }
    }


    /**
     * Voltmeter: measure voltage accross a component and display it
     * @extends Component (template.js)
     *
     * @property resistance         Changing this doesn't do anything now
     */
    class Wattmeter extends Circuit.Component {
        constructor(parentCircuit) {
            super(parentCircuit);
            this._maxCurrent = Infinity;
        }

        get resistance() { return Circuit.LOW_RESISTANCE; }

        /**
         * Render the component
         */
        render() {
            const isOn = this.isOn();

            super.render((p, colour, running) => {
                // Circle
                p.strokeWeight(1);
                p.stroke(colour);
                p.fill(255);
                p.ellipse(0, 0, this._w, this._w);

                // 'Sign
                p.textAlign(p.CENTER, p.CENTER);
                p.textStyle(p.BOLD);
                p.noStroke();
                p.fill(colour);
                p.textSize(18);
                p.text('Watt', 0, 2);
                p.textStyle(p.NORMAL);

                // Reading of current in green label
                if (running) {
                    p.strokeWeight(1);
                    p.stroke(0, 100, 0);
                    p.fill(160, 255, 200);
                    p.rect(0, this._h / 1.3, this._w, this._h / 3);

                    p.textSize(Circuit.SMALL_TEXT);
                    p.noStroke();
                    p.fill(0);
                    let power = roundTo(this._circuit.getWatts(), 1);
                    power = isOn ?
                        ((power === 0) ? '< 0.1' : power) + 'W' :
                        '- - -';
                    p.text(power, 0, this._h / 1.25);
                }
                p.textAlign(p.LEFT, p.LEFT);
            });
        }
    }

    /**
     * Logicmeter: Is the voltage HIGH or LOW ?
     * @extends Component (template.js)
     *
     * @property resistance         Changing this doesn't do anything now
     */
    class Logicmeter extends Circuit.Component {
        constructor(parentCircuit) {
            super(parentCircuit);
            this._maxCurrent = Infinity;
        }

        get resistance() { return Circuit.INFIN_RESISTANCE; }

        /**
         * Render the component
         */
        render() {
            const isOn = this.isOn();
            const state = Circuit.logic.getState(roundTo(this.voltage * 2, 1)); // Multiply by two as in parallel - so voltage is halved

            super.render((p, colour, running) => {
                // Circle
                p.strokeWeight(1);
                p.stroke(colour);
                p.fill(255);
                p.ellipse(0, 0, this._w, this._w);

                // Logical 1 or 0
                p.textAlign(p.CENTER, p.CENTER);
                p.textStyle(p.BOLD);
                p.noStroke();
                p.textSize(26);
                let symbol;
                if (state === 'Low') {
                    symbol = 0;
                    p.fill(170, 50, 50);
                } else if (state === 'High') {
                    symbol = 1;
                    p.fill(50, 170, 50);
                } else {
                    symbol = '-';
                    p.fill(255, 170, 0);
                }
                p.text(symbol, 0, 2);
                p.textStyle(p.NORMAL);

                // Reading of current in green label
                if (running && this.control._showInfo) {
                    p.strokeWeight(1);
                    p.stroke(0, 100, 0);
                    p.fill(160, 255, 200);
                    p.rect(0, this._h / 1.3, this._w, this._h / 3);

                    p.textSize(Circuit.SMALL_TEXT);
                    p.noStroke();
                    p.fill(0);

                    p.text(state, 0, this._h / 1.25);
                }
                p.textAlign(p.LEFT, p.LEFT);
            });
        }
    }

    return [Ammeter, Voltmeter, Wattmeter, Logicmeter];
})();
