[
    Circuit.Cell,
    Circuit.Battery,
    Circuit.ACPowerSupply,
    Circuit.DCPowerSupply,
] = (function() {
    /**
     * A cell has a voltage
     * DC power
     * @extends Component (template.js)
     *
     * @property voltage         Voltage of the battery
     * @property _dir            Direction of cell (position of plus sign)
     *
     * @method setVoltage(v)     Chainable setter for this.voltage
     * @method render()          Render the cell onto the global p5 sketch
     * @method eval()               Evaluate the component
     * @method getInputCoords()  Where should we connect the input to?
     * @method getOutputCoords() Where should we connect the output from?
     * @method getData()         Override method of super.getData()
     * @method flip()            Flip direction of cell
     */
    class Cell extends Circuit.Component {
        constructor(parentCircuit) {
            super(parentCircuit);

            this._voltage = Cell.defaultVoltage;
            this._maxConnected = 1;
            this._dir = Cell.LEFT;
        }

        get resistance() {
            return 0;
        }

        /**
         * Calculate output current of cell
         * I = V / R
         * @return {Number} Current output
         */
        get current() {
            const current = this._circuit.current;
            // console.log("Get", current);
            let sign = Math.sign(current);
            return Math.abs(current) > this.maxCurrent ?
                sign * this.maxCurrent :
                current;
        }

        /*      PUBLIC PROPERTIES   */
        get voltage() {
            return this._dir === Cell.RIGHT ? -this._voltage : this._voltage;
        }
        set voltage(v) {
            if (typeof v !== "number")
                throw new TypeError(
                    `Cell.voltage: expected voltage to be number`
                );
            if (v <= 0) v = 1;
            this._voltage = this._dir === Cell.RIGHT ? -v : v;
        }

        /**
         * Set the voltage
         * @param {Number} v The new voltage
         * @return {Cell}    Return this (chainable)
         */
        setVoltage(v) {
            this.voltage = v;
            return this;
        }

        /**
         * Evaluate the Cell
         */
        eval() {
            super.eval(() => {
                if (this._circuit._depth !== 0)
                    throw new Error(
                        `Cell component must be in top-level circuit, found in depth '${this._circuit._depth}'`
                    );
            });
        }

        /**
         * Render the Cell to the global p5 instance
         */
        render() {
            super.render((p, colour, running) => {
                const isOn = this.isOn();

                // Line
                let offset = 4;
                p.stroke(colour);
                p.strokeWeight(2);
                if (this._dir === Cell.RIGHT) {
                    p.line(offset, this._h / 2, offset, -this._h / 2);
                } else {
                    p.line(-offset, -this._h / 2, -offset, this._h / 2);
                }

                // Rectangle
                offset = 5;
                if (this._dir === Cell.RIGHT) offset = -offset;
                p.noStroke();
                p.fill(colour);
                if (this._dir === Cell.RIGHT) {
                    p.rect(-6, 0, -offset, this._h / 2);
                } else {
                    p.rect(6, 0, offset, this._h / 2);
                }

                // Plus sign (next to line)
                if (running && isOn) {
                    p.noStroke();
                    p.fill(255, 0, 0);
                    p.textSize(Circuit.SMALL_TEXT * 1.5);
                    if (this._dir === Cell.RIGHT) {
                        p.text("+", this._w / 5, -this._h / 4);
                    } else {
                        p.text("+", -this._w / 3, -this._h / 4);
                    }
                }

                // Show voltage in green box
                if (running && this.control._showInfo) {
                    p.textAlign(p.CENTER, p.CENTER);
                    p.strokeWeight(1);
                    p.stroke(0, 100, 0);
                    p.fill(160, 255, 200);

                    let h = this._h / 3;
                    p.rect(0, this._h / 2 + h, this._w, h);

                    p.textSize(Circuit.SMALL_TEXT);
                    p.noStroke();
                    p.fill(0);
                    let v = +this.voltage.toFixed(1);
                    v = isOn ? v + "V" : "- - -";
                    p.text(v, 0, this._h / 1.9 + h);

                    p.textAlign(p.LEFT, p.LEFT);
                }
            });
        }

        /**
         * Where should we connect the input to?
         * @return {Number[]}  Coordinates [x, y]
         */
        getInputCoords() {
            const len = this._dir === Cell.RIGHT ? 9 : 6;
            const move = polToCart(this._angle, len);
            return [this._x - move[0], this._y + move[1]];
        }

        /**
         * Where should we connect the output from?
         * @return {Number[]}  Coordinates [x, y]
         */
        getOutputCoords() {
            const move = polToCart(this._angle, 6);
            return [this._x + move[0], this._y + move[1]];
        }

        /**
         * Override method of super.getData()
         * @return {object} JSON data
         */
        getData() {
            let data = super.getData();
            data.voltage = this.voltage;
            return data;
        }

        /**
         * Flip direction of cell
         * @param  {Boolean} playSound Should we play the toggle sound?
         * @return {Number}     New direction
         */
        flip(playSound = false) {
            this._dir = this._dir === Cell.LEFT ? Cell.RIGHT : Cell.LEFT;
            this._circuit.unlockAllDiodes();
            if (playSound) {
                Sounds.Play(
                    "toggle-" + (this._dir === Cell.RIGHT ? "off" : "on")
                );
            }
            this.control.updateLightLevel();
            return this._dir;
        }
    }

    Cell.toStore = ["voltage", "dir"];
    Cell.defaultVoltage = 1.5;
    Cell.config = [{ field: "dir", name: "Dir", type: "dir" }];

    // DIrectionas of cell
    Cell.LEFT = 0;
    Cell.RIGHT = 1;

    /**
     * Collection of cells
     * @extends Circuit
     *
     * @property _cells         Number of cells
     * @property _cellVoltage   Voltage of each cell
     * @property _cellWidth     WIdth of every cell
     * @property _dir           Direction of cells
     * @property voltage        Set voltage of every cell
     *
     * @method render()          Render the cell onto the global p5 sketch
     * @method eval()               Evaluate the component
     * @method flip()            Flip direction of battery (each cell)
     * @method addCell()         Add another cell
     */
    class Battery extends Circuit.Component {
        constructor(parentCircuit) {
            super(parentCircuit);
            this._cells = 1;
            this._cellVoltage = Cell.defaultVoltage;
            this._maxCurrent = Infinity;
            this._cellWidth = this._w;
            this._dir = Cell.LEFT;
        }

        get resistance() {
            return 0;
        }

        /**
         * Calculate output current of battery
         * I = V / R
         * @return {Number} Current output
         */
        get current() {
            const current = this._circuit.current;
            return current > this.maxCurrent ? this.maxCurrent : current;
        }

        /*      PUBLIC PROPERTIES   */
        get voltage() {
            const v = this._cellVoltage * this._cells;
            return this._dir === Cell.RIGHT ? -v : v;
        }
        set voltage(v) {
            if (typeof v !== "number")
                throw new TypeError(
                    `Cell.voltage: expected voltage to be number`
                );
            if (v <= 0) v = 1;
            this._cellVoltage = v;
        }

        /**
         * Evaluate the Battery
         */
        eval() {
            super.eval(() => {
                if (this._circuit._depth !== 0)
                    throw new Error(
                        `Battery component must be in top-level circuit`
                    );
            });
        }

        render() {
            const isOn = this.isOn();

            super.render((p, colour, running) => {
                let x = -((this._cells / 2) * this._cellWidth);
                // x += this._cellWidth / 2;

                for (let i = 0; i < this._cells; i++) {
                    this._renderCell(x, p, colour);
                    x += this._cellWidth + 4;
                }

                // Plus sign (next to line)
                if (running && isOn) {
                    p.noStroke();
                    p.fill(255, 0, 0);
                    p.textSize(Circuit.SMALL_TEXT * 1.5);
                    if (this._dir === Cell.RIGHT) {
                        p.text("+", this._w / 2 + 2, -this._h / 4);
                    } else {
                        p.text("+", -this._w / 2 - 13, -this._h / 4);
                    }
                }

                // Box around everything
                p.strokeWeight(1);
                p.stroke(colour);
                p.noFill();
                p.rect(0, 0, this._w, this._h);

                // Show voltage in green box
                if (running && this.control._showInfo) {
                    p.textAlign(p.CENTER, p.CENTER);
                    p.strokeWeight(1);
                    p.stroke(0, 100, 0);
                    p.fill(160, 255, 200);

                    let h = this._h / 3;
                    p.rect(0, this._h / 2 + h, this._w, h);

                    p.textSize(Circuit.SMALL_TEXT);
                    p.noStroke();
                    p.fill(0);
                    const v = +this.voltage.toFixed(1);
                    p.text(v + "V", 0, this._h / 1.9 + h);

                    p.textAlign(p.LEFT, p.LEFT);
                }
            });
        }

        /**
         * Render an individual cell
         * @param  {Number} x             X coordinate to translate to
         * @param  {any} p                P5 namespace
         * @param  {color} colour         Colour of components
         */
        _renderCell(x, p, colour) {
            p.push();
            p.translate(x, 0);

            // Line
            let offset = 4;
            p.stroke(colour);
            p.strokeWeight(2);
            let h = this._h / 2.5;
            if (this._dir === Cell.RIGHT) {
                p.line(offset, -h, offset, h);
            } else {
                p.line(-offset, -h, -offset, h);
            }

            // Rectangle
            offset = 5;
            p.noStroke();
            p.fill(colour);
            if (this._dir === Cell.RIGHT) {
                p.rect(-6, 0, -offset, h);
            } else {
                p.rect(6, 0, offset, h);
            }

            p.pop();
        }

        /**
         * Flip direction of cell
         * @param  {Boolean} playSound Should we play the toggle sound?
         * @return {Number}     New direction
         */
        flip(playSound = false) {
            this._dir = this._dir === Cell.LEFT ? Cell.RIGHT : Cell.LEFT;
            this._circuit.unlockAllDiodes();
            if (playSound) {
                Sounds.Play(
                    "toggle-" + (this._dir === Cell.RIGHT ? "off" : "on")
                );
            }
            this.control.updateLightLevel();
            return this._dir;
        }

        /**
         * Add another cell(s) to the mix
         * @param  {Number} [count=1]   How many cells to add?
         * @return {Battery} this (chainable)
         */
        addCell(count = 1) {
            for (let i = 0; i < count; i++) {
                this._cells++;
                this._cellWidth /= 1.5;
                this._w += this._cellWidth / 2;
            }
        }
    }

    Battery.toStore = ["dir", "voltage", "cells"];
    Battery.config = [
        { field: "dir", name: "Dir", type: "dir" },
        { field: "cells", name: "Cells", type: "number", min: 1, max: 10 },
    ];

    /**
     * An alternating current-producing thing
     * AC power
     * @extends Component (template.js)
     *
     * @property voltage         Voltage of the battery
     * @property _dir            Current direction of current
     * @property _frame          After how many frames should we 'flip'
     * @property _lastFlipFrame  When did we last flip? (so we stop flipped twice per frame)
     * @property currentFrame    Get current frame of the control
     *
     * @method hertz(?hz)        Get / Set value (fps)
     * @method frame(?f)         Get / Set frame value (_frame)
     * @method render()          Render the cell onto the global p5 sketch
     * @method eval()            Evaluate the component
     * @method getInputCoords()  Where should we connect the input to?
     * @method getOutputCoords() Where should we connect the output from?
     * @method onScroll(e)          What to do when scrolled on?
     */
    class ACPowerSupply extends Cell {
        constructor(parentCircuit) {
            super(parentCircuit);
            this._frame = 8;
            this._lastFlipFrame = -1;
        }

        /**
         * Get current frame that control is on
         * @return {Number} Current frame count
         */
        get currentFrame() {
            return this._circuit._control._p5.frameCount;
        }

        /**
         * Get / Set cycles per second
         * @param  {Number} hz  If present, what to set hertz to; else, get.
         * @return {Number} Hertz (cycles per second)
         */
        hertz(hz = undefined) {
            if (typeof hz === "number") {
                let val = Math.round(hz);
                if (val <= 0) val = 1;
                let frames = this._circuit._control._fps / val;
                this._frame = frames;
                return val;
            } else {
                return this._circuit._control._fps / this._frame;
            }
        }

        /**
         * Get / Set _frame
         * @param  {Number} f   If present, what to set _frame to; else, get.
         * @return {Number} Execute every x frames...
         */
        frame(f = undefined) {
            if (typeof f === "number") {
                let val = Math.round(f);
                if (val <= 0) val = 1;
                this._frame = val;
                return val;
            } else {
                return this._frame;
            }
        }

        /**
         * Evaluate component
         */
        eval() {
            Circuit.Component.prototype.eval.call(this, () => {
                if (this._circuit._depth !== 0)
                    throw new Error(
                        `ACPowerSupply component must be in top-level circuit`
                    );
                if (
                    this.currentFrame !== this._lastFlipFrame &&
                    this.currentFrame % this._frame === 0
                ) {
                    this._lastFlipFrame = this.currentFrame;
                    this.flip();
                }
            });
        }

        /**
         * Render the Cell to the global p5 instance
         */
        render() {
            const isOn = this.isOn();

            Circuit.Component.prototype.render.call(
                this,
                (p, colour, running) => {
                    const isBlown = this.isBlown();

                    // Circle
                    p.strokeWeight(1);
                    p.stroke(colour);
                    p.noFill();
                    p.ellipse(0, 0, this._w, this._w);

                    // Wave
                    p.beginShape();
                    p.strokeWeight(2);
                    const bound = this._w / 4;
                    if (running && isOn) {
                        for (let x = 0; x <= 360; x += 5) {
                            let px = mapNumber(x, 0, 360, -bound, bound);
                            let py = Math.sin(Degrees(x));
                            py = this._dir === Cell.RIGHT ?
                                mapNumber(py, -1, 1, -bound, bound) :
                                mapNumber(py, -1, 1, bound, -bound);
                            p.vertex(px, py);
                        }
                        p.endShape();
                    } else {
                        p.line(-bound, 0, bound, 0);
                    }

                    // Plus sign
                    if (running) {
                        const [sign, ...fill] =
                        this._dir === Cell.RIGHT ||
                            !running ||
                            !isOn ||
                            isBlown ? ["+", 255, 0, 0] : ["-", 0, 0, 255];
                        p.noStroke();
                        p.fill(...fill);
                        p.textSize(Circuit.SMALL_TEXT * 1.5);
                        p.text(sign, this._w / 2 - 12, 0);
                    }

                    // Show voltage in green box
                    if (running && this.control._showInfo) {
                        p.textAlign(p.CENTER, p.CENTER);
                        p.strokeWeight(1);
                        p.stroke(0, 100, 0);
                        p.fill(160, 255, 200);

                        let h = this._h / 3;
                        p.rect(0, this._h / 2 + h, this._w, h);

                        p.textSize(Circuit.SMALL_TEXT);
                        p.noStroke();
                        p.fill(0);
                        let v = +this.voltage.toFixed(1);
                        if (isBlown) v = "- - -";
                        else if (!running || !isOn) v = "±" + Math.abs(v) + "V";
                        else v += "V";

                        p.text(v, 0, this._h / 1.9 + h);

                        p.textAlign(p.LEFT, p.LEFT);
                    }
                }
            );
        }

        /**
         * Connect coordinates for inputs
         * - Should be overridden for each component, but here just in case :)
         * @return {Number[]} Coordinates [x, y]
         */
        getInputCoords() {
            const move = polToCart(-this._angle, this._w / 2);
            return [this._x - move[0], this._y + move[1]];
        }

        /**
         * Connect coordinates for outputs
         * - Should be overridden for each component, but here just in case :)
         * @return {Number[]} Coordinates [x, y]
         */
        getOutputCoords() {
            const move = polToCart(this._angle, this._w / 2);
            return [this._x + move[0], this._y + move[1]];
        }

        /**
         * What to do on scroll (mouseWheel)
         * @param  {Event} event    Mouse wheel event
         */
        onScroll(event) {
            const delta = Math.sign(event.deltaY) * -0.2;
            this.voltage += delta;
        }
    }
    ACPowerSupply.toStore = [...Cell.toStore, "frame"];

    /**
     * A direct current-producing thing. Linked to slider
     * DC power
     * @extends Component (template.js)
     *
     * @property voltage         Voltage of the battery
     * @property _dir            Current direction of current
     * @property _maxVoltage     Maximum voltage we can produce
     * @property _delta         On scroll, how much should we change the voltage by?
     *
     * @method sensitivity(?d)   Get / Set this._delta
     * @method render()          Render the cell onto the global p5 sketch
     * @method eval()            Evaluate the component
     * @method getInputCoords()  Where should we connect the input to?
     * @method getOutputCoords() Where should we connect the output from?
     * @method onScroll(e)          What to do when scrolled on?
     */
    class DCPowerSupply extends Cell {
        constructor(parentCircuit) {
            super(parentCircuit);
            this._maxVoltage = DCPowerSupply.MAX_VOLTAGE;
            this._maxCurrent = Infinity;
            this._delta = 0.1;
        }

        get voltage() {
            let val = Math.abs(this._voltage);
            return this._dir === Cell.RIGHT ? -val : val;
        }
        set voltage(val) {
            if (typeof val !== "number") return;
            val = clamp(Math.abs(val), 0, this.maxVoltage);
            val = this._dir === Cell.RIGHT ? -val : val;
            this._voltage = val;
        }

        get maxVoltage() {
            return this._maxVoltage;
        }
        set maxVoltage(val) {
            if (typeof val !== "number") return;
            val = Math.abs(Math.round(val));
            if (val === 0) return;
            this._maxVoltage = this._dir === Cell.RIGHT ? -val : val;
        }

        /**
         * Get / Set this._delta
         * @param  {Number} val    If not empty: what to set this._delta to
         * @return {Number}        The sentitivity (this._delta)
         */
        sensitivity(val = undefined) {
            if (typeof val === "number") {
                val = val <= 0 ? 0.1 : clamp(val, 1e-3, 1e3);
                this._delta = val;
            }
            return this._delta;
        }

        /**
         * Evaluate component
         */
        eval() {
            Circuit.Component.prototype.eval.call(this, () => {
                if (this._circuit._depth !== 0)
                    throw new Error(
                        `DCPowerSupply component must be in top-level circuit`
                    );
            });
        }

        /**
         * Render the Cell to the global p5 instance
         */
        render() {
            // const isOn = this.isOn();

            Circuit.Component.prototype.render.call(this, (p, colour, running) => {
                // Circle
                p.strokeWeight(1);
                p.stroke(colour);
                p.noFill();
                p.ellipse(0, 0, this._w, this._w);

                p.textAlign(p.CENTER, p.CENTER);
                // Plus / Minus sign
                let pad = 15;
                p.noStroke();
                p.fill(colour);
                p.textStyle(p.BOLD);
                p.textSize(22);

                // RIGHT: + -
                // LEFT: - +
                let minus =
                    this._dir === Cell.RIGHT ? [-(this._w / 2) + pad, 0] : [this._w / 2 - pad, -2];
                let plus =
                    this._dir === Cell.RIGHT ? [this._w / 2 - pad, 0] : [-(this._w / 2) + pad, 0];

                if (running) p.fill(10, 20, 200);
                p.text("-", ...minus);

                if (running) p.fill(200, 10, 20);
                p.text("+", ...plus);

                p.textStyle(p.NORMAL);

                // Show voltage in green box
                if (running && this.control._showInfo) {
                    p.strokeWeight(1);
                    p.stroke(0, 100, 0);
                    p.fill(160, 255, 200);

                    let h = this._h / 3;
                    p.rect(0, this._h / 2 + h, this._w, h);

                    p.textSize(Circuit.SMALL_TEXT);
                    p.noStroke();
                    p.fill(0);
                    p.text(this.value() + "V", 0, this._h / 1.9 + h);
                }
                p.textAlign(p.LEFT, p.LEFT);
            });
        }

        /**
         * Connect coordinates for inputs
         * - Should be overridden for each component, but here just in case :)
         * @return {Number[]} Coordinates [x, y]
         */
        getInputCoords() {
            const move = polToCart(-this._angle, this._w / 2);
            return [this._x - move[0], this._y + move[1]];
        }

        /**
         * Connect coordinates for outputs
         * - Should be overridden for each component, but here just in case :)
         * @return {Number[]} Coordinates [x, y]
         */
        getOutputCoords() {
            const move = polToCart(this._angle, this._w / 2);
            return [this._x + move[0], this._y + move[1]];
        }

        /**
         * Get formatted voltage value
         * @return {Number} Formatted voltage
         */
        value() {
            let v = this.voltage;
            v = v.toFixed(1);
            v = Number(v);
            return v;
        }

        /**
         * What to do on scroll (mouseWheel)
         * @param  {Event} event    Mouse wheel event
         */
        onScroll(event) {
            const delta = Math.sign(event.deltaY) * -this._delta;
            this.voltage += delta;
        }
    }
    DCPowerSupply.MAX_VOLTAGE = 230;

    DCPowerSupply.toStore = [...Cell.toStore, "delta"];
    DCPowerSupply.config = [
        { field: 'voltage', name: 'Voltage', type: 'number', slider: true, min: 0.1, max: DCPowerSupply.MAX_VOLTAGE, step: 0.1 }
    ];

    return [Cell, Battery, ACPowerSupply, DCPowerSupply];
})();
