Circuit.Resistor = (function() {
    /**
     * Component with a resistance
     * @extends Component (template.js)
     *
     * @property _kilo              Is ohms or kiloOhms?
     *
     * @method render(fn)           Render the cell onto the global p5 sketch
     *  - NB as this can be extended, ability to pass extra fn code to execute
     * @method toggle()             Toggle between Ohms and KiloOhms
     */
    class Resistor extends Circuit.Component {
        constructor(parentCircuit) {
            super(parentCircuit);
            this._resistance = 1;
            this._h /= 3;
            this._maxCurrent = Infinity;
            this._kilo = false;
        }

        get resistance() {
            return this._kilo ? this._resistance * 1e3 : this._resistance;
        }
        set resistance(r) { this._resistance = r; }

        /**
         * Render component
         * @param {Function} fn     Additional render code
         */
        render(fn) {
            const isOn = this.isOn();

            super.render((p, colour, running) => {
                const unit = (this._kilo ? 'k' : '') + Circuit.OHM;

                p.strokeWeight(2);
                p.stroke(colour);
                p.noFill();
                p.rect(0, 0, this._w, this._h);

                // Resistance in green label box
                if (running && control._showInfo) {
                    p.textAlign(p.CENTER, p.CENTER);
                    p.strokeWeight(1);
                    p.stroke(0, 100, 0);
                    p.fill(160, 255, 200);
                    p.rect(0, this._h + 3, this._w, this._h / 1.2);

                    p.textSize(Circuit.SMALL_TEXT);
                    p.noStroke();
                    p.fill(0);
                    let res = roundTo(this.resistance, 1);
                    if (isOn) {
                        if (this._kilo) res /= 1e3;

                        if (res <= 0) res = '< 0.1';
                        else if (res > 1e4) res = '> 10000';
                        res += unit;
                    } else {
                        res = '- - -';
                    }
                    p.text(res, 0, this._h + 4);
                    p.textAlign(p.LEFT, p.LEFT);
                }

                if (typeof fn === 'function') fn(p, colour, running);
            });
        }

        /**
         * Toggle between ohms and kiloOhms
         * @return {Boolean} KiloOhms?
         */
        toggle() {
            this._kilo = !this._kilo;
            return this._kilo;
        }
    }

    return Resistor;
})();

Circuit.VariableResistor = (function() {
    /**
     * Component with a resistance with ability to alter this resistance
     * @extends Component (template.js)
     *
     * @property _div               Div containing slider
     * @property _text              Span element containing resistance inside _div
     * @property _min               Minimum resistance
     * @property _max               Maximum resistance
     *
     * @method render()             Render the cell onto the global p5 sketch
     * @method min(n) / max(n)      Set max/min resistance
     * @method genSlider()          Generate a slider which links to this resistance
     * @method value()              Return resistance (formatted)
     * @method onScroll(e)          What to do when scrolled on?
     */
    class VariableResistor extends Circuit.Resistor {
        constructor(parentCircuit) {
            super(parentCircuit);
            this._div = null;
            this._text = null;
            this._min = 0;
            this._max = 50;
        }

        render() {
            super.render((p, colour, running) => {
                if (running && this._div === null) {
                    const slider = this.genSlider();

                    this._div = document.createElement('div');
                    this._div.insertAdjacentText('beforeEnd', 'Resistance: ');
                    this._div.appendChild(slider);

                    this._text = document.createElement('span');
                    this._text.innerText = this.value() + Circuit.OHM;
                    this._div.append(this._text);

                    this._circuit._control._container.appendChild(this._div);
                } else if (!running && this._div instanceof HTMLDivElement) {
                    this._div.remove();
                    this._div = null;
                }

                p.strokeWeight(1.3);
                p.stroke(colour);
                const extX = 5;
                const extY = 2;

                const end = [this._w / 2 + extX, -this._h / 2 - extY];
                p.line(-this._w / 2 - extX, this._h / 2 + extY, ...end);

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
            if (n >= this._max) throw new TypeError(`Cannot set min resistance above max resistance`);
            this._min = n;
        }

        /**
         * Set minimum resistance
         * @param  {Number} n       Min resistance
         */
        max(n) {
            if (n <= this._min) throw new TypeError(`Cannot set max resistance below min resistance`);
            this._max = n;
        }

        /**
         * Generate a slider to control this resistance
         * @return {HTMLInputElement} <input type="range" ... />
         */
        genSlider() {
            let el = document.createElement('input');
            el.setAttribute('type', 'range');
            el.setAttribute('min', this._min);
            el.setAttribute('max', this._max);
            el.setAttribute('step', 0.1);
            el.value = this.resistance;

            el.addEventListener('input', event => {
                let val = +event.target.value;
                this.resistance = val;
                this._text.innerText = this.value() + Circuit.OHM;
            });

            return el;
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
            const delta = Math.sign(event.deltaY) * -0.1;
            let newR = clamp(this._resistance + delta, this._min, this._max);
            this.resistance = newR;

            if (this._div) {
                this._div.querySelector('input').value = this.resistance;
                this._text.innerText = roundTo(this.resistance, 1) + Circuit.OHM;
            }

            if (this.control._componentShowingInfo === this && this.control._showInfo) {
                this.control.showDebugInfo(this);
            }
        }
    }

    return VariableResistor;
})();
