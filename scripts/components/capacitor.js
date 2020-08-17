Circuit.Capacitor = (function() {
    /**
     * Capacitor: builds up and stores charge, which it releases when circuit is broken
     * - Regard this.control._head as only power source
     * @extends Component (template.js)
     *
     * @property _offset            Offset from sides of lines
     * @property _capacitance       Like a constant. Measured in Farads (F). We store in microfarads
     * @property _targetVoltage     Target voltage of capacitor
     * @property _voltage           Voltage across the capacitor
     * @property resistance         Changing this doesn't do anything now
     * @property (readonly) maxCharge   The maximum charge of the capacitor
     * @property (readonly) T       Time constant of capacitor
     * @property _chargeTime        How many frames have passed since started charging?
     *
     * @method setVoltage(v)        Set target voltage of capacitor
     * @method isFull()             Is the capacitor "full"?
     * @method percentage()         How full is the capacitor (percentage)
     * @method accessOneself()      Can the capacitor access itself?
     * @method accessPower()        Can the capacitor access the power source?
     * @method getPathResistance()  Get ress=istance of path, discharging or charging
     * @method chargeTime()         Get time in seconds for the capacitor to fully charge
     * @method getFarads()          Return capacitance in Farads
     * @method charge(v, t)         Charge capacitor by a voltage
     * @method getState()         Are we charging or discharging?
     */
    class Capacitor extends Circuit.Component {
        constructor(parentCircuit) {
            super(parentCircuit);
            this._offset = 12;
            this._maxCurrent = Number.MAX_SAFE_INTEGER;
            this._capacitance = 2200; // micro farads (uF)
            this._potentialDifference = 0; // PD between prongs
            this._targetVoltage = 5;
            this._voltage = 0;
            this._chargeTime = 0;
        }

        get resistance() { return Circuit.LOW_RESISTANCE; }

        get targetVoltage() { return this._targetVoltage; }
        set targetVoltage(v) { this.setVoltage(v); }

        /**
         * Maximum charge of this capacitor
         * @type Number
         */
        get maxCharge() {
            // Q = C * V
            const q = this.getFarads() * this._targetVoltage;
            return q;
        }

        /**
         * Get the time constant of this capacitor
         * - T = R * C
         * @type Number
         */
        get T() {
            const r = this.getPathResistance();
            return (typeof r === 'number') ?
                r * this.getFarads() :
                Number.NaN;
        }

        /**
         * Set maximum voltage of capacitor
         * @param  {Number} v   new maximum voltage
         * @return {Capacitor} this
         */
        setVoltage(v) {
            if (typeof v !== 'number') return;
            v = Math.abs(v);
            this._targetVoltage = v;
            return this;
        }

        /**
         * Is the capacitor said to be "fully" charges
         * - A capacitor is never fully charges; instead, it is considered so after 99.3% (or 5T)
         * @return {Boolean} Is it "fully charged"
         */
        isFull() {
            return this.percentage() >= 99.3;
        }

        /**
         * How full is the capacitor (percentage)
         * @param  {Number} [v=this._voltage]       Voltage to test. Default is this voltage
         * @return {Number} percentage
         */
        percentage(v = this._voltage) {
            return (v / this._targetVoltage) * 100;
        }

        /**
         * Can this capacitor access itself?
         * @return {Component[]} Trace path or null
         */
        accessOneself() {
            return this.accessPath(this);
        }

        /**
         * Can this capacitor access the power source?
         * @return {Component[]} Trace path or null
         */
        accessPower() {
            return this.accessPath(this.control._head);
        }

        /**
         * Get resistance of path
         * @return {Number} resistance or NULL if no path exists
         */
        getPathResistance() {
            if (!this.isOn()) return null;

            // Get path
            let path = this.accessPower();
            if (path === null) path = this.accessOneself();

            let r = 0;
            for (let c of path) {
                if (c instanceof Circuit.Component) {
                    r += c.resistance;
                }
            }
            return r;
        }

        /**
         * Time, in seconds, for the capacitor to fully charge
         * t = 5 * R * C
         * @return {Number} Seconds
         */
        chargeTime() {
            const r = this.getPathResistance();
            return (typeof r === 'number') ?
                5 * r * this.getFarads() :
                -1;
        }

        /**
         * Return capacitance in farads
         * @return {Number} Capacitance (F)
         */
        getFarads() {
            return this._capacitance * 1e-6; // uF -> F
        }

        /**
         * Find voltage of capacitor after t seconds
         * @param  {Number} t   Time voltage is applied
         * @return {Number} Voltage of capacitor
         */
        voltageAfter(t) {
            // Vc = Vs * (1 - e^(-t / T))
            // Find time constant
            const T = this.T;
            if (isNaN(T)) return Number.NaN;

            // Math.exp(x) -> Math.E ** x
            const v = this._targetVoltage * (1 - Math.exp(-t / T));
            return v;
        }

        /**
         * Evaluate the component
         */
        eval() {
            super.eval(() => {
                if (this.getState() === Capacitor.CHARGING) {
                    this._chargeTime++;
                    const secs = this.control.frames2secs(this._chargeTime);
                    this._voltage = this.voltageAfter(secs);
                }
            });
        }

        /**
         * Render the component
         */
        render() {
            super.render((p, colour, running) => {
                // const isOn = this.isOn();

                p.noStroke();
                p.fill(colour);
                const height = this._h / 1.5;
                const width = this._offset / 2;

                // Left line
                let x = -this._offset;
                p.rect(x, 0, width, height);

                // Right line
                x = this._offset;
                p.rect(x, 0, width, height);

                if (running && this.control._showInfo) {
                    p.textAlign(p.CENTER, p.CENTER);

                    // Progress bar thing between plates
                    p.rectMode(p.CORNER);

                    p.strokeWeight(1);
                    p.stroke(colour);
                    p.noFill();
                    p.rect(-this._offset / 2 - 1, height / 2, this._offset + 2, -height);

                    p.fill(160, 200, 255);
                    p.noStroke();
                    let barHeight = mapNumber(this.percentage(), 0, 100, 0, height);
                    p.rect(-this._offset / 2, height / 2, this._offset, -barHeight);

                    p.rectMode(p.CENTER);

                    // Reading of current in green label
                    p.strokeWeight(1);
                    p.stroke(0, 100, 0);
                    p.fill(160, 255, 200);
                    p.rect(0, this._h / 1.6, this._w, this._h / 3);

                    p.textSize(Circuit.SMALL_TEXT);
                    p.noStroke();
                    p.fill(0);
                    const DP = 2;
                    let text = roundTo(this._voltage, DP);
                    text = text.toFixed(DP);
                    text += 'V';
                    p.text(text, 0, this._h / 1.55);
                    p.textAlign(p.LEFT, p.LEFT);
                }
            });
        }

        /**
         * Connect coordinates for inputs
         * - Should be overridden for each component, but here just in case :)
         * @return {Number[]} Coordinates [x, y]
         */
        getInputCoords() {
            const move = polToCart(-this._angle, this._offset);
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
            const move = polToCart(this._angle, this._offset);
            return [
                this._x + move[0],
                this._y + move[1]
            ];
        }

        /**
         * Are we charging or discharging?
         * @return {Number} state (e.g. Capacitor.FULL)
         */
        getState() {
            if (this._circuit.isBroken()) return Capacitor.NULL;
            if (this.isFull()) return Capacitor.FULL;
            return (this.accessPower() === null) ? Capacitor.DISCHARGING : Capacitor.CHARGING;
        }
    }

    Capacitor.NULL = 0x0;
    Capacitor.FULL = 0xff;
    Capacitor.CHARGING = 0x1;
    Capacitor.DISCHARGING = -0x1;

    return Capacitor;
})();