Circuit.Bulb = (function() {
    /**
     * Bulb: light
     * @extends Component (template.js)
     *
     * @property {Boolean} _oldSymbol        Should we render the old bulb symbol?
     * @property {Number} _lpw               Lumens per Watt
     * @property {Number} _wattage           Power at which bulb is 100% brightness
     *
     * @method brightness()         Get brightness of bulb (0..1)
     * @method wattage(?n)          Get or Set wattage of bulb
     * @method render()             Render the cell onto the global p5 sketch
     * @method getColour()          Get colour (fill) of bulb
     * @method getInputCoords()     Where should we connect the input to?
     * @method getOutputCoords()    Where should we connect the output from?
     * @method toggle()             Toggle between the old and the new symbols
     * @method getData()
     */
    class Bulb extends Circuit.Component {
        constructor(parentCircuit) {
            super(parentCircuit);
            this._resistance = 2;
            this._inputMax = 1;
            this._oldSymbol = false;
            this._lpw = 15; // between 12.5 - 17.5, (https://www.rapidtables.com/calc/light/how-watt-to-lumen.html)
            this._wattage = 10;
        }

        /**
         * Get brightness of bulb
         * @return {Number} Brightness as fraction [0..1]
         */
        brightness() {
            // return this.isOn() ? Math.abs(this.current) / this.maxCurrent : 0;
            return this.isOn() ? Math.abs(this.power()) / this.wattage() : 0;
        }

        /**
         * Get or set wattage of the bulb (optimum power)
         * @param  {Number} watts   If present: set wattage of bulb. Else, get.
         * @return {Number} Wattage
         */
        wattage(watts = undefined) {
            if (typeof watts === "number") {
                this._wattage = watts;
            }
            return this._wattage;
        }

        /**
         * Evaluate the Bulb on to the global canvas
         */
        eval() {
            super.eval(() => {
                if (
                    this.control._running &&
                    !this._circuit._isBroken &&
                    Math.abs(this.power()) > this.wattage()
                ) {
                    super.blow(
                        `Component ${this.toString()} blew as its power input (${this.power()} W) exceeded its limit of ±${this.wattage()}W`
                    );
                }
            });
        }

        /**
         * Render the Bulb on to the global canvas
         */
        render() {
            super.render((p, colour, running) => {
                const isOn = this.isOn();

                // Circle
                if (running) {
                    if (this._blown) {
                        // Flicker
                        p.fill(p.random(100));
                    } else if (!isOn) {
                        p.noFill();
                    } else {
                        p.fill(...this.getColour());
                    }
                } else {
                    p.noFill();
                }

                p.stroke(colour);
                p.strokeWeight(1);
                p.ellipse(0, 0, this._w, this._w);

                // Only do innards if not blown
                if (!this._blown) {
                    if (this._oldSymbol) {
                        // Line extensions from each end
                        p.strokeWeight(1.5);
                        let len = this._w / 4;
                        p.line(-this._w / 2, 0, -this._w / 2 + len, 0);
                        p.line(this._w / 2 - len, 0, this._w / 2, 0);

                        const w = this._w - len * 2;
                        const h = this._h / 1.7;
                        p.arc(-this._w / 2 + len + w / 2, 0, w, h, p.PI, 0);
                        p.strokeWeight(1);
                    } else {
                        // Cross thing
                        let d = this._w / 1.45;

                        p.push();
                        p.translate(...polToCart(Math.PI / 4, -this._w / 2));
                        p.line(0, 0, d, d);
                        p.pop();

                        p.push();
                        p.translate(...polToCart(-Math.PI / 4, -this._w / 2));
                        p.line(0, 0, d, -d);
                        p.pop();
                    }
                }

                // Show brightness in green box
                if (running && this.control._showInfo && !this._blown) {
                    p.textAlign(p.CENTER, p.CENTER);
                    p.strokeWeight(1);
                    p.stroke(0, 100, 0);
                    p.fill(160, 255, 200);
                    p.rect(0, this._h / 1.3, this._w, this._h / 3);

                    p.textSize(Circuit.SMALL_TEXT);
                    p.noStroke();
                    p.fill(0);
                    let text = isOn ?
                        roundTo(this.brightness() * 100, 1).toFixed(1) + "%" :
                        "- - -";
                    p.text(text, 0, this._h / 1.25);

                    p.textAlign(p.LEFT, p.LEFT);
                }
            });
        }

        /**
         * Get RGB fill colour of bulb
         * @return {Number[]} RGB array
         */
        getColour() {
            const x = roundTo(this.brightness() * 100, 2);
            let rgb = hsb2rgb(60, 100, x);
            rgb = rgb.map((n) => roundTo(n, 1));
            return rgb;
            // const a = roundTo(this.brightness() * 255, 2);
            // const rgb = [...this._baseColour, a];
            // return rgb;
        }

        /**
         * Where should we connect the input to?
         * @return {Number[]}  Coordinates [x, y]
         */
        getInputCoords() {
            const move = polToCart(this._angle, -this._w / 2);
            return [this._x + move[0], this._y + move[1]];
        }

        /**
         * Where should we connect the output from?
         * @return {Number[]}  Coordinates [x, y]
         */
        getOutputCoords() {
            const move = polToCart(this._angle, this._w / 2);
            return [this._x + move[0], this._y + move[1]];
        }

        /**
         * Toggle between the old and new circuit symbols
         */
        toggle() {
            this._oldSymbol = !this._oldSymbol;
        }
    }

    // What info to store in JSON file (NB all field here are PRIVATE so prefixed with _. They must be gettable and settable)
    Bulb.toStore = ["oldSymbol", "wattage", "lpw"];

    // Fields that are editable by user
    Bulb.config = [
        { field: "oldSymbol", name: "Old Symbol?", type: "boolean" },
        {
            field: "wattage",
            name: "Wattage",
            type: "number",
            min: 1,
            max: 1000,
        },
        // { field: 'lpw', name: 'LpW', type: 'number', min: 1, max: 100 },
    ];

    return Bulb;
})();
