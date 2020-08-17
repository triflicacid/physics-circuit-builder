[Circuit.Cell, Circuit.Battery, Circuit.ACPowerSupply, Circuit.DCPowerSupply] = (function() {
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

        get resistance() { return 0; }
        set resistance(v) { return v; }

        /**
         * Calculate output current of cell
         * I = V / R
         * @return {Number} Current output
         */
        get current() {
            const current = this._circuit.current;
            return (current > this.maxCurrent) ? this.maxCurrent : current;
        }

        /*      PUBLIC PROPERTIES   */
        get voltage() { return (this._dir === Cell.RIGHT) ? -this._voltage : this._voltage; }
        set voltage(v) {
            if (typeof v !== 'number') throw new TypeError(`Cell.voltage: expected voltage to be number`);
            if (v <= 0) v = 1;
            this._voltage = (this._dir === Cell.RIGHT) ? -v : v;
        }

        /*      METHODS         */
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
                if (this._circuit._depth !== 0) throw new Error(`Cell component must be in top-level circuit`);
            });
        }

        /**
         * Render the Cell to the global p5 instance
         */
        render() {
            super.render((p, colour, running, circuitBroken) => {
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
                if (running && !circuitBroken) {
                    p.noStroke();
                    p.fill(255, 0, 0);
                    p.textSize(Circuit.SMALL_TEXT * 1.5);
                    if (this._dir === Cell.RIGHT) {
                        p.text('+', this._w / 5, -this._h / 4);
                    } else {
                        p.text('+', -this._w / 3, -this._h / 4);
                    }
                }

                // Show voltage in green box
                if (running && !this._circuit._isBroken && control._showInfo) {
                    p.textAlign(p.CENTER, p.CENTER);
                    p.strokeWeight(1);
                    p.stroke(0, 100, 0);
                    p.fill(160, 255, 200);

                    let h = this._h / 3;
                    p.rect(0, this._h / 2 + h, this._w, h);

                    p.textSize(Circuit.SMALL_TEXT);
                    p.noStroke();
                    p.fill(0);
                    const v = +(this.voltage).toFixed(1);
                    p.text(v + 'V', 0, this._h / 1.9 + h);

                    p.textAlign(p.LEFT, p.LEFT);
                }
            });
        }

        /**
         * Where should we connect the input to?
         * @return {Number[]}  Coordinates [x, y]
         */
        getInputCoords() {
            const len = (this._dir === Cell.RIGHT) ? 9 : 6;
            const move = polToCart(this._angle, len);
            return [
                this._x - move[0],
                this._y + move[1]
            ];
        }

        /**
         * Where should we connect the output from?
         * @return {Number[]}  Coordinates [x, y]
         */
        getOutputCoords() {
            const move = polToCart(this._angle, 6);
            return [
                this._x + move[0],
                this._y + move[1]
            ];
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
         * @return {Number}     New direction
         */
        flip() {
            this._dir = (this._dir === Cell.LEFT) ? Cell.RIGHT : Cell.LEFT;
            this._circuit.unlockAllDiodes();
            if (this._circuit._control._componentShowingInfo == this) {
                this._circuit._control.showDebugInfo(this);
            }
            return this._dir;
        }
    }

    Cell.defaultVoltage = 1.5;

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
     * @method getInputCoords()  Where should we connect the input to?
     * @method getOutputCoords() Where should we connect the output from?
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

        get resistance() { return 0; }
        set resistance(v) { return v; }

        /**
         * Calculate output current of battery
         * I = V / R
         * @return {Number} Current output
         */
        get current() {
            const current = this._circuit.current;
            return (current > this.maxCurrent) ? this.maxCurrent : current;
        }

        /*      PUBLIC PROPERTIES   */
        get voltage() {
            const v = this._cellVoltage * this._cells;
            return (this._dir === Cell.RIGHT) ? -v : v;
        }
        set voltage(v) {
            if (typeof v !== 'number') throw new TypeError(`Cell.voltage: expected voltage to be number`);
            if (v <= 0) v = 1;
            this._cellVoltage = v;
        }

        /**
         * Evaluate the Battery
         */
        eval() {
            super.eval(() => {
                if (this._circuit._depth !== 0) throw new Error(`Battery component must be in top-level circuit`);
            });
        }

        render() {
            super.render((p, colour, running, circuitBroken) => {
                let x = -this._w / 2;
                x += this._cellWidth / 2;

                for (let i = 0; i < this._cells; i++) {
                    this._renderCell(x, p, colour);
                    x += this._cellWidth + 4;
                }

                // Plus sign (next to line)
                if (running && !circuitBroken) {
                    p.noStroke();
                    p.fill(255, 0, 0);
                    p.textSize(Circuit.SMALL_TEXT * 1.5);
                    if (this._dir === Cell.RIGHT) {
                        p.text('+', this._w / 2.3, -this._h / 4);
                    } else {
                        p.text('+', -this._w / 2, -this._h / 4);
                    }
                }

                // Show voltage in green box
                if (running && !this._circuit._isBroken && control._showInfo) {
                    p.textAlign(p.CENTER, p.CENTER);
                    p.strokeWeight(1);
                    p.stroke(0, 100, 0);
                    p.fill(160, 255, 200);

                    let h = this._h / 3;
                    p.rect(0, this._h / 2 + h, this._w, h);

                    p.textSize(Circuit.SMALL_TEXT);
                    p.noStroke();
                    p.fill(0);
                    const v = +(this.voltage).toFixed(1);
                    p.text(v + 'V', 0, this._h / 1.9 + h);

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
            if (this._dir === Cell.RIGHT) {
                p.line(offset, -this._h / 2, offset, this._h / 2);
            } else {
                p.line(-offset, -this._h / 2, -offset, this._h / 2);
            }

            // Rectangle
            offset = 5;
            p.noStroke();
            p.fill(colour);
            if (this._dir === Cell.RIGHT) {
                p.rect(-6, 0, -offset, this._h / 2);
            } else {
                p.rect(6, 0, offset, this._h / 2);
            }

            p.pop();
        }

        /**
         * Where should we connect the input to?
         * @return {Number[]}  Coordinates [x, y]
         */
        getInputCoords() {
            return [
                this._x - this._w / 2,
                this._y
            ];
        }

        /**
         * Where should we connect the output from?
         * @return {Number[]}  Coordinates [x, y]
         */
        getOutputCoords() {
            return [
                this._x + this._w / 2,
                this._y
            ];
        }

        /**
         * Flip direction of cell
         * @return {Number}     New direction
         */
        flip() {
            this._dir = (this._dir === Cell.LEFT) ? Cell.RIGHT : Cell.LEFT;
            this._circuit.unlockAllDiodes();
            return this._dir;
        }

        /**
         * Add another cell to the mix
         * @return {Battery} this (chainable)
         */
        addCell() {
            this._cells++;
            this._cellWidth /= 1.5;
            this._w += this._cellWidth / 2;
        }
    }


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
     * @property hertz           Get cycles per second
     *
     * @method render()          Render the cell onto the global p5 sketch
     * @method eval()            Evaluate the component
     * @method getInputCoords()  Where should we connect the input to?
     * @method getOutputCoords() Where should we connect the output from?
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
        get currentFrame() { return this._circuit._control._p5.frameCount; }

        /**
         * Cycles per second
         * @return {Number}
         */
        get hertz() { return this._circuit._control._fps / this._frame; }
        set hertz(v) {
            if (typeof v !== 'number') return;
            v = Math.round(v);
            if (v <= 0) v = 1;
            let frames = this._circuit._control._fps / v;
            this.frame = frames;
        }

        get frame() { return this._frame; }
        set frame(v) {
            if (typeof v !== 'number') return;
            v = Math.round(v);
            if (v <= 0) v = 1;
            this._frame = v;
        }

        /**
         * Evaluate component
         */
        eval() {
            Circuit.Component.prototype.eval.call(this, () => {
                if (this._circuit._depth !== 0) throw new Error(`ACPowerSupply component must be in top-level circuit`);
                if (this.currentFrame !== this._lastFlipFrame && this.currentFrame % this._frame === 0) {
                    this._lastFlipFrame = this.currentFrame;
                    this.flip();
                }
            });
        }

        /**
         * Render the Cell to the global p5 instance
         */
        render() {
            Circuit.Component.prototype.render.call(this, (p, colour, running, circuitBroken) => {
                // Circle
                p.strokeWeight(1);
                p.stroke(colour);
                p.fill(255);
                p.ellipse(0, 0, this._w, this._w);

                // Wave
                p.beginShape();
                p.strokeWeight(2);
                const bound = this._w / 4;
                for (let x = 0; x <= 360; x += 5) {
                    let px = mapNumber(x, 0, 360, -bound, bound);
                    let py = Math.sin(deg2rad(x));
                    py = (this._dir === Cell.RIGHT) ?
                        mapNumber(py, -1, 1, -bound, bound) :
                        mapNumber(py, -1, 1, bound, -bound);
                    p.vertex(px, py);
                }
                p.endShape();

                // Plus sign
                if (running) {
                    const [sign, ...fill] = (this._dir === Cell.RIGHT) ? ['+', 255, 0, 0] : ['-', 0, 0, 255];
                    p.noStroke();
                    p.fill(...fill);
                    p.textSize(Circuit.SMALL_TEXT * 1.5);
                    p.text(sign, (this._w / 2) - 12, 0);
                }

                // Show voltage in green box
                if (running && control._showInfo) {
                    p.textAlign(p.CENTER, p.CENTER);
                    p.strokeWeight(1);
                    p.stroke(0, 100, 0);
                    p.fill(160, 255, 200);

                    let h = this._h / 3;
                    p.rect(0, this._h / 2 + h, this._w, h);

                    p.textSize(Circuit.SMALL_TEXT);
                    p.noStroke();
                    p.fill(0);
                    const v = +(this.voltage).toFixed(1);
                    p.text(v + 'V', 0, this._h / 1.9 + h);

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
            const move = polToCart(-this._angle, this._w / 2);
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
            const move = polToCart(this._angle, this._w / 2);
            return [
                this._x + move[0],
                this._y + move[1]
            ];
        }
    }

    /**
     * A direct current-producing thing. Linked to slider
     * DC power
     * @extends Component (template.js)
     *
     * @property voltage         Voltage of the battery
     * @property _dir            Current direction of current
     * @property _maxVoltage     Maximum voltage we can produce
     * @property _div               Div containing slider
     * @property _text              Span element containing resistance inside _div
     *
     * @method render()          Render the cell onto the global p5 sketch
     * @method eval()            Evaluate the component
     * @method getInputCoords()  Where should we connect the input to?
     * @method getOutputCoords() Where should we connect the output from?
     * @method genSlider()       Generate slider element
     */
    class DCPowerSupply extends Cell {
        constructor(parentCircuit) {
            super(parentCircuit);
            this._maxVoltage = 10;
            this._maxCurrent = Infinity;
            this._div = null;
            this._text = null;
        }

        get voltage() {
            let val = Math.abs(this._voltage);
            return (this._dir === Cell.RIGHT) ? -val : val;
        }
        set voltage(val) {
            if (typeof val !== 'number') return;
            this._voltage = (this._dir === Cell.RIGHT) ? -val : val;
        }

        get maxVoltage() { return this._maxVoltage; }
        set maxVoltage(val) {
            if (typeof val !== 'number') return;
            val = Math.abs(Math.round(val));
            if (val === 0) return;
            this._maxVoltage = (this._dir === Cell.RIGHT) ? -val : val;
        }

        /**
         * Evaluate component
         */
        eval() {
            Circuit.Component.prototype.eval.call(this, () => {
                if (this._circuit._depth !== 0) throw new Error(`DCPowerSupply component must be in top-level circuit`);
            });
        }

        /**
         * Render the Cell to the global p5 instance
         */
        render() {
            Circuit.Component.prototype.render.call(this, (p, colour, running, circuitBroken) => {
                if (running && this._div === null) {
                    const slider = this.genSlider();

                    this._div = document.createElement('div');
                    this._div.insertAdjacentText('beforeEnd', 'DC Voltage: ');
                    this._div.appendChild(slider);

                    this._text = document.createElement('span');
                    this._text.innerText = this.value() + 'V';
                    this._div.append(this._text);

                    this._circuit._control._container.appendChild(this._div);
                } else if (!running && this._div instanceof HTMLDivElement) {
                    this._div.remove();
                    this._div = null;
                }

                // Circle
                p.strokeWeight(1);
                p.stroke(colour);
                p.fill(255);
                p.ellipse(0, 0, this._w, this._w);

                p.textAlign(p.CENTER, p.CENTER);
                // Plus sign (left). Minus sign (right)
                if (running) {
                    let pad = 15;
                    p.noStroke();
                    p.fill(colour);
                    p.textStyle(p.BOLD);
                    p.textSize(22);

                    if (this._dir === Cell.RIGHT) {
                        p.text('+', (this._w / 2) - pad, 0);
                        p.text('-', -(this._w / 2) + pad, 0);
                    } else {
                        p.text('-', (this._w / 2) - pad, -2);
                        p.text('+', -(this._w / 2) + pad, 0);
                    }

                    p.textStyle(p.NORMAL);
                }

                // Show voltage in green box
                if (running && control._showInfo) {
                    p.strokeWeight(1);
                    p.stroke(0, 100, 0);
                    p.fill(160, 255, 200);

                    let h = this._h / 3;
                    p.rect(0, this._h / 2 + h, this._w, h);

                    p.textSize(Circuit.SMALL_TEXT);
                    p.noStroke();
                    p.fill(0);
                    p.text(this.value() + 'V', 0, this._h / 1.9 + h);

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
            const move = polToCart(this._angle, this._w / 2);
            return [
                this._x + move[0],
                this._y + move[1]
            ];
        }

        /**
         * Generate a slider to control this resistance
         * @return {HTMLInputElement} <input type="range" ... />
         */
        genSlider() {
            let el = document.createElement('input');
            el.setAttribute('type', 'range');
            el.setAttribute('min', 0);
            el.setAttribute('max', this.maxVoltage);
            el.setAttribute('step', 0.1);
            el.value = this.voltage;

            el.addEventListener('input', event => {
                let val = +event.target.value;
                this.voltage = val;
                this._text.innerText = this.value() + 'V';
            });

            return el;
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
    }

    return [Cell, Battery, ACPowerSupply, DCPowerSupply];
})();
