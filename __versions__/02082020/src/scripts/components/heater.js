Circuit.Heater = (function() {
    /**
     * Heater: convert electrical energy to heat
     * - Use H = i * i * r * t
     * @extends Component (template.js)
     *
     * @property _joules    Joules of energy
     * @property _efficiency    'Efficiency' of heater
     * @property _maxTemp   Maximum tenmperature in degrees celcius
     * @property _maxJoules Maximum temperature, but in joules (shouldn't be set)
     *
     * @method celcius(?v)  Get / Set temperature of heater in degrees celcius
     * @method maxTemp(?v)  Get / Set maximum temperature
     * @method temp()       Get displayable temperature reading
     * @method percent()    How heated are we?
     * @method getColour()  Get colour of heater
     */
    class Heater extends Circuit.Component {
        constructor(parentCircuit) {
            super(parentCircuit);
            this._maxCurrent = Number.MAX_SAFE_INTEGER;
            this._resistance = 2.5;
            this._h /= 2;
            this._joules = 0;
            this._efficiency = randomInt(10, 60) * 100;
            this._maxJoules = undefined;
            this.maxTemp(20);
        }

        /**
         * Get or Set degrees celcius of heater
         * @param  {Number} val     If present, what to set temperature to
         * @return {Number}         Degrees celcius
         */
        celcius(val = undefined) {
            if (typeof val === "number") {
                this._joules = clamp(deg2joules(val), 0, this._maxTemp);
                return val;
            } else {
                return joules2deg(this._joules);
            }
        }

        /**
         * Get or Set maximum tenmperature in degrees celcius of heater
         * @param  {Number} val     If present, what to set max temperature to
         * @return {Number}         Maximum tempa in degrees celcius
         */
        maxTemp(val = undefined) {
            if (typeof val === "number") {
                this._maxTemp = clamp(val, 0, Control.MAX_TEMP);
                this._maxJoules = deg2joules(this._maxTemp);
                return val;
            } else {
                return this._maxTemp;
            }
        }

        /**
         * Return aesthetic temperature reading
         * @param  {Number} dp  How many decimal points?
         * @return {String} Output string
         */
        temp(dp = 3) {
            let temp = this.celcius();
            temp = roundTo(temp, dp).toFixed(dp);
            return temp + "°C";
        }

        /**
         * Temperature / max temperature
         * @return {Number}
         */
        percent() {
            const p = (this.celcius() / this._maxTemp) * 100;
            return p;
        }

        /**
         * Get colour of heater
         * @param {Boolean} asHsb   Return HSB (true) or RGB (false)?
         * @return {Number[]} RGB colour array
         */
        getColour(asHsb = false) {
            const bright = this.percent();
            const hsb = [0, bright, 100];
            return asHsb ? hsb : hsb2rgb(...hsb);
        }

        /**
         * Evaluate component
         */
        eval() {
            if (this._maxJoules === undefined) {
                this._maxJoules = deg2joules(this._maxTemp);
            }

            super.eval(() => {
                let update = false;
                if (this.isOn()) {
                    if (this._joules < this._maxJoules) {
                        this._joules += this.getHeat() * this._efficiency;
                        if (this._joules > this._maxJoules)
                            this._joules = this._maxJoules;
                        update = true;
                    }
                } else {
                    if (this._joules > 0) {
                        this._joules -= Math.random() * this._efficiency;
                        if (this._joules < 0) this._joules = 0;
                        update = true;
                    }
                }

                // If updated, update thermistor exteral temp and display
                if (update) {
                    this.control.updateTemp();
                }
            });
        }

        /**
         * Render the component
         */
        render() {
            super.render((p, colour, running) => {
                // Rectange
                p.stroke(colour);
                p.strokeWeight(1.5);
                if (running) {
                    p.fill(...this.getColour());
                } else {
                    p.noFill();
                }
                p.rect(0, 0, this._w, this._h);

                // Lines
                p.strokeWeight(1);
                p.stroke(0);
                const dx = this._w / 5;
                const limX = this._w / 2;
                const y = this._h / 2;
                for (let x = -this._w / 2; x < limX; x += dx) {
                    p.line(x, -y, x, y);
                }

                // Reading of current in green label
                if (running) {
                    p.textAlign(p.CENTER, p.CENTER);
                    p.strokeWeight(1);
                    p.stroke(0, 100, 0);
                    p.fill(160, 255, 200);
                    p.rect(0, this._h, this._w, this._h / 1.6);

                    p.textSize(Circuit.SMALL_TEXT);
                    p.fill(0);
                    p.noStroke();
                    let temp = this._blown ? "- - -" : this.temp();
                    p.text(temp, 0, this._h + 1);
                    p.textAlign(p.LEFT, p.LEFT);
                }
            });
        }
    }

    Heater.toStore = ["efficiency", "maxTemp"];
    Heater.config = [{
            field: "efficiency",
            name: "Efficiency",
            type: "number",
            min: 1,
            max: 100,
        },
        {
            field: "maxTemp",
            name: "Max Temp",
            type: "number",
            min: 1,
            max: 100,
        },
    ];

    return Heater;
})();
