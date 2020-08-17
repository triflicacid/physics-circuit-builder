[
    Circuit.Ammeter,
    Circuit.Voltmeter,
    Circuit.Wattmeter,
    Circuit.Lightmeter,
    Circuit.Thermometer,
] = (function () {
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

        get resistance() {
            return Circuit.LOW_RESISTANCE;
        }

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
                if (this._blown) {
                    p.fill(randomInt(100));
                } else {
                    p.noFill();
                }
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
                    p.fill(0);
                    p.noStroke();
                    let current = this.current;
                    if (isOn) {
                        if (this._units === 0) current *= 1e6;
                        // µA
                        else if (this._units === 1) current *= 1e3;
                        // mA
                        else if (this._units === 3) current *= 1e-3; // kA

                        if (current !== 0) {
                            current = roundTo(current, 1);
                            if (current === 0) current = "< 0.1";
                            else if (current > 1e4) current = "> 10,000";
                        }
                    } else {
                        current = "- - -";
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
        }
    }

    Ammeter.toStore = ["units"];
    Ammeter.UNITS = [Circuit.MICRO + "A", "mA", "A", "kA"];

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

        get resistance() {
            return Circuit.INFIN_RESISTANCE;
        }

        /**
         * Render the component
         */
        render() {
            const isOn = this.isOn();

            super.render((p, colour, running) => {
                // Circle
                p.strokeWeight(1);
                p.stroke(colour);
                if (this._blown) {
                    p.fill(randomInt(100));
                } else {
                    p.noFill();
                }
                p.ellipse(0, 0, this._w, this._w);

                // 'V'
                p.textAlign(p.CENTER, p.CENTER);
                p.textStyle(p.BOLD);
                p.noStroke();
                p.fill(colour);
                p.textSize(25);
                p.text("V", 0, 2);
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
                    voltage = isOn
                        ? (voltage === 0 ? "< 0.1" : voltage) + "V"
                        : "- - -";
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

        get resistance() {
            return Circuit.LOW_RESISTANCE;
        }

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
                p.text("Watt", 0, 2);
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
                    let power = roundTo(this._circuit.power(), 1);
                    power = isOn
                        ? (power === 0 ? "< 0.1" : power) + "W"
                        : "- - -";
                    p.text(power, 0, this._h / 1.25);
                }
                p.textAlign(p.LEFT, p.LEFT);
            });
        }
    }

    /**
     * Lightmeter: measure light hitting the meter
     * @extends Component (template.js)
     *
     * @property resistance         Changing this doesn't do anything now
     * @property _units             Units of ammeter (index of Lightmeter.UNITS)
     *
     * @method changeUnits()        Change units
     * @method onScroll(e)          What to do when scrolled on?
     */
    class Lightmeter extends Circuit.Component {
        constructor(parentCircuit) {
            super(parentCircuit);
            this._maxCurrent = Number.MAX_SAFE_INTEGER;
            this._units = 2; // 'Lm'
        }

        get resistance() {
            return Circuit.LOW_RESISTANCE;
        }

        /**
         * Render the component
         */
        render() {
            super.render((p, colour, running) => {
                const unit = Lightmeter.UNITS[this._units];
                const isOn = this.isOn();

                // Circle
                p.strokeWeight(1);
                p.stroke(colour);
                if (this._blown) {
                    p.fill(randomInt(100));
                } else {
                    p.noFill();
                }
                p.ellipse(0, 0, this._w, this._w);

                // Units
                p.textAlign(p.CENTER, p.CENTER);
                p.textStyle(p.BOLD);
                p.noStroke();
                p.fill(colour);
                p.textSize(22);
                p.text(unit, 0, 0);
                p.textStyle(p.NORMAL);

                // Reading of lumens in green label
                if (running) {
                    p.strokeWeight(1);
                    p.stroke(0, 100, 0);
                    p.fill(160, 255, 200);
                    p.rect(0, this._h / 1.3, this._w, this._h / 3);

                    p.textSize(Circuit.SMALL_TEXT);
                    p.noStroke();
                    p.fill(0);
                    let lumens = this._lightRecieving;
                    if (isOn) {
                        if (this._units === 0) lumens *= 1e6;
                        // µlm
                        else if (this._units === 1) lumens *= 1e3;
                        // mlm
                        else if (this._units === 3) lumens *= 1e-3; // klm

                        if (lumens !== 0) {
                            lumens = roundTo(lumens, 1);
                            if (lumens === 0) lumens = "< 0.1";
                            else if (lumens > 1e4) lumens = "> 10,000";
                        }
                    } else {
                        lumens = "- - -";
                    }
                    p.text(lumens, 0, this._h / 1.25);
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
            if (this._units === Lightmeter.UNITS.length) this._units = 0;
            return this._units;
        }

        /**
         * What to do on scroll (mouseWheel)
         * @param  {Event} event    Mouse wheel event
         */
        onScroll(event) {
            const delta = Math.sign(event.deltaY) * -1;
            this._units += delta;

            if (this._units === Lightmeter.UNITS.length) this._units = 0;
            else if (this._units === -1)
                this._units = Lightmeter.UNITS.length - 1;
        }
    }

    Lightmeter.toStore = ["units"];
    Lightmeter.UNITS = [Circuit.MICRO + "lm", "mlm", "lm", "klm"];

    /**
     * Thermometer: measure external temperature to thermometer
     * @extends Component (template.js)
     *
     * @property resistance         Changing this doesn't do anything now
     * @property _min               Minimum temperature we can handle
     * @property _max               Maximum temperature we can handle
     *
     * @method howFull()            How full is the thermometer? (0..1 decimal)
     */
    class Thermometer extends Circuit.Component {
        constructor(parentCircuit) {
            super(parentCircuit);
            this._maxCurrent = Number.MAX_SAFE_INTEGER;
            this._min = -25;
            this._max = 100;
        }

        get resistance() {
            return Circuit.LOW_RESISTANCE;
        }

        /**
         * Evaluate
         */
        eval() {
            super.eval(() => {
                if (
                    this.control._running &&
                    !this._circuit._isBroken &&
                    this._externalTemp > this._max
                ) {
                    super.blow(
                        `Component ${this.toString()} blew as it exceeded ${
                            this._max
                        }°C (was ${this._externalTemp}°C)`
                    );
                }
            });
        }

        /**
         * Render the component
         */
        render() {
            super.render((p, colour, running) => {
                const isOn = this.isOn();
                p.textAlign(p.CENTER, p.CENTER);

                // Rectangle
                p.strokeWeight(1.5);
                p.stroke(colour);
                p.noFill();
                p.rect(0, 0, this._w / 2, this._h);

                // Filing
                const pad = 3;
                if (running && !this._blown) {
                    const w = this._w / 4 - pad;
                    const a = 200;
                    p.noStroke();
                    p.rectMode(p.CORNER);
                    let h;
                    if (this._externalTemp < this._min) {
                        p.fill(28, 58, 217, a);
                        h = 2;
                    } else {
                        p.fill(217, 58, 28, a);
                        h = mapNumber(
                            this.howFull(),
                            0,
                            1,
                            1,
                            this._h - pad * 2
                        );
                    }
                    p.rect(-w, this._h / 2 - h - pad, w * 2, h);
                    p.rectMode(p.CENTER);
                }

                {
                    const limY = this._h / 2;
                    const dy = this._h / 10;
                    const x = this._w / 4;
                    const len = 5;
                    p.stroke(colour);
                    p.strokeWeight(1.2);
                    for (let y = -limY; y < limY; y += dy) {
                        p.line(x - len, y, x, y);
                    }
                }

                // Reading of lumens in green label
                if (running) {
                    p.strokeWeight(1);
                    p.stroke(0, 100, 0);
                    p.fill(160, 255, 200);
                    p.rect(0, this._h / 1.3, this._w, this._h / 3);

                    p.textSize(Circuit.SMALL_TEXT);
                    p.noStroke();
                    p.fill(0);
                    let temp = this._externalTemp;
                    if (this._blown) {
                        temp = "- - -";
                    } else {
                        if (temp < this._min) {
                            temp = "COLD";
                        } else {
                            if (this._units === 0) temp *= 1e6;
                            // µ
                            else if (this._units === 1) temp *= 1e3;
                            // m
                            else if (this._units === 3) temp *= 1e-3; // k

                            if (temp !== 0) {
                                temp = roundTo(temp, 2);
                                if (temp === 0) temp = "< 0.1";
                                else if (temp > 1e4) temp = "> 10,000";
                            }

                            temp += "°C";
                        }
                    }
                    p.text(temp, 1, this._h / 1.25);
                }
                p.textAlign(p.LEFT, p.LEFT);
            });
        }

        /**
         * How full is the thermometer?
         * @return {Number} 0..1
         */
        howFull() {
            const fract =
                (this._externalTemp - this._min) / (this._max - this._min);
            return fract;
        }

        /**
         * Connect coordinates for inputs
         * - Should be overridden for each component, but here just in case :)
         * @param  {Number} no  Input number
         * @return {Number[]} Coordinates [x, y]
         */
        getInputCoords(no) {
            const move = polToCart(-this._angle, this._w / 4);
            return [this._x - move[0], this._y + move[1]];
        }

        /**
         * Connect coordinates for outputs
         * - Should be overridden for each component, but here just in case :)
         * @param  {Number} no  Input number
         * @return {Number[]} Coordinates [x, y]
         */
        getOutputCoords(no) {
            const move = polToCart(this._angle, this._w / 4);
            return [this._x + move[0], this._y + move[1]];
        }
    }

    Thermometer.toStore = ["min", "max"];

    return [Ammeter, Voltmeter, Wattmeter, Lightmeter, Thermometer];
})();
