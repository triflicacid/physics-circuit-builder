[
    Circuit.Resistor,
    Circuit.VariableResistor,
    Circuit.PhotoResistor,
    Circuit.Thermistor,
] = (function() {
    /**
     * Component with a resistance
     * @extends Component (template.js)
     *
     * @property _american          Should we use the american symbol?
     *
     * @method render(fn)           Render the cell onto the global p5 sketch
     *  - NB as this can be extended, ability to pass extra fn code to execute
     *  @method toggle()            Toggle between American and British symbols
     */
    class Resistor extends Circuit.Component {
        constructor(parentCircuit) {
            super(parentCircuit);
            this._resistance = 1;
            this._maxCurrent = Number.MAX_SAFE_INTEGER;
            this._american = false;
            this._h /= 3;
        }

        get resistance() {
            return this._resistance;
        }
        set resistance(r) {
            this._resistance = r;
        }

        /**
         * Render component
         * @param {Function} fn     Additional render code
         */
        render(fn) {
            const isOn = this.isOn();

            super.render((p, colour, running) => {
                p.strokeWeight(2);
                p.stroke(colour);
                p.noFill();

                if (this._american) {
                    const dx = this._w / 10;
                    const dy = 8;

                    p.beginShape();
                    const startX = -this._w / 2;
                    const limX = this._w / 2;
                    for (
                        let i = 0, x = startX, y = 0; x < limX; x += dx, i++, y = i % 2 === 0 ? -dy : dy
                    ) {
                        p.vertex(x, y);
                    }
                    p.vertex(this._w / 2, 0);
                    p.endShape();
                } else {
                    p.rect(0, 0, this._w, Resistor.SMALL_HEIGHT);
                }

                // Resistance in green label box
                if (running && this.control._showInfo) {
                    p.textAlign(p.CENTER, p.CENTER);
                    p.strokeWeight(1);
                    p.stroke(0, 100, 0);
                    p.fill(160, 255, 200);
                    let padTop, textYOffset;
                    if (this instanceof Thermistor) {
                        padTop = 0.58;
                        textYOffset = 0.03;
                    } else {
                        padTop = 0.75;
                        textYOffset = 0.05;
                    }
                    p.rect(0, this._h / padTop, this._w, this._h / 1.2);

                    p.textSize(Circuit.SMALL_TEXT);
                    p.noStroke();
                    p.fill(0);
                    let res = this.resistance;
                    if (isOn) {
                        if (res === 0 || res === Circuit.ZERO_RESISTANCE) {
                            res = "0";
                        } else {
                            if (res < 0.0001) res = "< 0.1m";
                            else if (res < 0.1)
                                res = roundTo(res * 1e3, 1) + "m";
                            else if (res > 1e4)
                                res = roundTo(res / 1e3, 1) + "k";
                            else res = roundTo(res, 1);
                        }
                        res += Circuit.OHM;
                    } else {
                        res = "- - -";
                    }
                    p.text(res, 0, this._h / (padTop - textYOffset));
                    p.textAlign(p.LEFT, p.LEFT);
                }

                if (typeof fn === "function") fn(p, colour, running);
            });
        }

        /**
         * Toggle between American and British symbols
         */
        toggle() {
            this._american = !this._american;
        }
    }
    Resistor.toStore = ["american"];
    Resistor.config = [{ field: "american", name: "US", type: "boolean" }];
    Resistor.SMALL_HEIGHT = 17; // E.g. box, arrow

    /**
     * Component with a resistance with ability to alter this resistance
     * @extends Resistor
     *
     * @property _min               Minimum resistance
     * @property _max               Maximum resistance
     *
     * @method render()             Render the cell onto the global p5 sketch
     * @method min(n) / max(n)      Set max/min resistance
     * @method value()              Return resistance (formatted)
     * @method onScroll(e)          What to do when scrolled on?
     */
    class VariableResistor extends Resistor {
        constructor(parentCircuit) {
            super(parentCircuit);
            this._min = 0;
            this._max = 1e3; //1e6;
        }

        render() {
            super.render((p, colour, running) => {
                p.strokeWeight(1.3);
                p.stroke(colour);
                const extX = 5;
                const extY = 2;

                const h = Resistor.SMALL_HEIGHT;
                const end = [this._w / 2 + extX, -h / 2 - extY];
                p.line(-this._w / 2 - extX, h / 2 + extY, ...end);

                // Arrow head
                p.push();
                p.translate(...end);
                p.rotate(Math.PI / 3);
                p.noStroke();
                p.fill(colour);
                p.beginShape();

                const off = 5;
                p.vertex(-off, 0);
                p.vertex(off, 0);
                p.vertex(0, -off);

                p.endShape();
                p.pop(p.CLOSE);
            });
        }

        /**
         * Set minimum resistance
         * @param  {Number} n       Min resistance
         */
        min(n) {
            if (n >= this._max)
                throw new TypeError(
                    `Cannot set min resistance above max resistance`
                );
            this._min = n;
        }

        /**
         * Set minimum resistance
         * @param  {Number} n       Min resistance
         */
        max(n) {
            if (n <= this._min)
                throw new TypeError(
                    `Cannot set max resistance below min resistance`
                );
            this._max = n;
        }

        /**
         * Get formatted resistance value
         * @return {Number} Formatted resistance
         */
        value() {
            let r = this.resistance;
            r = r.toFixed(1);
            r = +r;
            return r;
        }

        /**
         * What to do on scroll (mouseWheel)
         * @param  {Event} event    Mouse wheel event
         */
        onScroll(event) {
            let amount = 0.1;
            if (this.resistance > 1e5) amount = 1e3;
            else if (this.resistance > 1e4) amount = 100;
            else if (this.resistance > 1e3) amount = 1;

            const delta = Math.sign(event.deltaY) * -amount;
            let newR = clamp(this._resistance + delta, this._min, this._max);
            this.resistance = newR;

            this.control.updateLightLevel();
        }
    }
    VariableResistor.toStore = [...Resistor.toStore, "min", "max"];
    VariableResistor.config = [
        ...Resistor.config,
        { field: "resistance", name: "Resistance", min: 0.1, max: 1e6, type: 'number' },
    ];

    /**
     * Resistance changes with light
     * @extends Resistor
     *
     * @property resistance         Calculate resistance, given light_recieving
     *
     * @method eval()
     * @method render()             Render the cell onto the global p5 sketch
     */
    class PhotoResistor extends Resistor {
        constructor(parentCircuit) {
            super(parentCircuit);
        }

        /**
         * Calculate and return resistance of component
         * - More light == less resistance
         * @return {Number} Resistance
         */
        get resistance() {
            const lumens = clamp(this._lightRecieving, 0, 1000);
            const r = mapNumber(lumens, 0, 1000, 1, Circuit.ZERO_RESISTANCE);
            return r;
        }

        render() {
            super.render((p, colour) => {
                // Arrows
                const len = 10;
                const arr_off = 3;
                const rot_main = Degrees._270 - Degrees._45 + Degrees._10;
                const rot_angle =
                    this._angle + Degrees._270 - Degrees._45 + Degrees._10;
                const pad = 2.5;

                // Topmost
                p.push();
                let angle = this._angle + rot_main - Degrees._10;
                let coords = polToCart(angle, this._w / 2);
                p.translate(...coords);
                p.rotate(rot_angle);
                p.stroke(colour);
                p.line(pad, 0, pad + len, 0);
                p.beginShape();
                p.fill(colour);
                p.vertex(pad, arr_off);
                p.vertex(pad, -arr_off);
                p.vertex(pad - arr_off, 0);
                p.endShape(p.CLOSE);
                p.pop();

                // Bottommost
                p.push();
                angle = this._angle + rot_main + Degrees._10 + Degrees._5;
                coords = polToCart(angle, this._w / 2);
                p.translate(...coords);
                p.rotate(rot_angle);
                p.stroke(colour);
                p.line(pad, 0, len + pad, 0);
                p.beginShape();
                p.fill(colour);
                p.vertex(pad, arr_off);
                p.vertex(pad, -arr_off);
                p.vertex(pad - arr_off, 0);
                p.endShape(p.CLOSE);
                p.pop();
            });
        }
    }

    /**
     * Resistance changes with heat
     * @extends Resistor
     *
     * @property _externalTemp      Heat we are exposed to from the surroundings
     * @property _mode              Thermistor mode
     * @property _min               Minimum temperature
     * @property _max               Maximum temperature
     * @property resistance         Calculate resistance, given this._heatRecieving
     *
     * @method mode(m)              Set mode of thermistor
     * @method eval()
     * @method render()             Render the cell onto the global p5 sketch
     */
    class Thermistor extends Resistor {
        constructor(parentCircuit) {
            super(parentCircuit);
            this.mode(Thermistor.NTC); // What is in GCSE (BBC Bitesize)
        }

        /**
         * Return string representation of object (name)
         * @override
         * @return {String} description
         */
        toString() {
            const modeStr = this._mode === Thermistor.NTC ? "NTC" : "PTC";
            return modeStr + "-" + super.toString();
        }

        /**
         * Calculate and return resistance of component
         * @return {Number} Resistance
         */
        get resistance() {
            const temp = clamp(
                this._externalTemp,
                Control.MIN_TEMP,
                Control.MAX_TEMP
            );

            // Default; PTC. smaller temp -> smaller resistance
            let min = Circuit.ZERO_RESISTANCE;
            let max = 1;

            // If NTC; smaller temp -> larger resistance
            if (this._mode === Thermistor.NTC)[min, max] = [max, min];

            const r = mapNumber(
                temp,
                Control.MIN_TEMP,
                Control.MAX_TEMP,
                min,
                max
            );
            return r;
        }

        /**
         * Set mode of thermistor
         * @param {Number} mode     Either Thermistor.NTC or Thermistor.PTC
         */
        mode(mode) {
            if (mode === Thermistor.NTC) {
                this._mode = Thermistor.NTC;
                this._min = -55;
                this._max = 200;
            } else if (mode === Thermistor.PTC) {
                this._mode = Thermistor.PTC;
                this._min = 0;
                this._max = 120;
            } else {
                throw new TypeError(
                    `Thermistor.mode: invalid enum argument '${mode}'`
                );
            }
        }

        render() {
            super.render((p, colour) => {
                p.strokeWeight(1.3);
                p.stroke(colour);

                const ext = 8;

                // Bottom tail
                const len = 10;
                const y = this._h / 2 + ext;
                const x = -this._w / 2;
                p.line(x, y, x + len, y);

                // Diagonal
                const dx = this._w / 1.25;
                p.line(x + len, y, x + dx, -this._h / 2 - ext);

                // Text
                const text = (this._mode === Thermistor.NTC ? "-" : "+") + "t°";
                p.noStroke();
                p.fill(colour);
                p.textSize(Circuit.SMALL_TEXT * 1.0);
                p.textAlign(p.CENTER, p.CENTER);
                p.text(text, 0, y);
                p.textAlign(p.LEFT, p.LEFT);
            });
        }

        /**
         * Toggle between NTC and PTC
         */
        toggle() {
            if (this._mode === Thermistor.PTC) {
                this._mode = Thermistor.NTC;
                Sounds.Play("toggle-off");
            } else {
                this._mode = Thermistor.PTC;
                Sounds.Play("toggle-on");
            }
        }
    }
    // NTC: negative. Resistance increases while temperature decreases. Smaller temp, bigger resistance.
    Thermistor.NTC = -1;

    // PTC: positive. Resistance increases with temperature. Smaller temp, smaller resistance.
    Thermistor.PTC = +1;

    Thermistor.toStore = ["mode"];
    Thermistor.config = [
        ...Resistor.config,
        {
            field: "mode",
            name: "Mode",
            type: "option",
            optionType: "number",
            options: [{
                    value: Thermistor.NTC,
                    name: "NTC",
                },
                {
                    value: Thermistor.PTC,
                    name: "PTC",
                },
            ],
        },
    ];

    return [Resistor, VariableResistor, PhotoResistor, Thermistor];
})();
