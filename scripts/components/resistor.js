Circuit.Resistor = (function() {
    /**
     * Component with a resistance
     * @extends Component (template.js)
     *
     * @method render(fn)           Render the cell onto the global p5 sketch
     *  - NB as this can be extended, ability to pass extra fn code to execute
     */
    class Resistor extends Circuit.Component {
        constructor(parentCircuit) {
            super(parentCircuit);
            this._resistance = 1;
            this._h /= 3;
            this._maxCurrent = Infinity;
        }

        /**
         * Render component
         * @param {Function} fn     Additional render code
         */
        render(fn) {
            super.render((p, colour, running) => {
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
                    let res = +(this.resistance).toFixed(1);
                    res = (res <= 0) ? 'LOW' : res + Circuit.OHM;
                    p.text(res, 0, this._h + 4);
                    p.textAlign(p.LEFT, p.LEFT);
                }

                if (typeof fn === 'function') fn(p, colour, running);
            });
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
     *
     * @method render()             Render the cell onto the global p5 sketch
     * @method genSlider()          Generate a slider which links to this resistance
     * @property value()            Return resistance (formatted)
     */
    class VariableResistor extends Circuit.Resistor {
        constructor(parentCircuit) {
            super(parentCircuit);
            this._div = null;
            this._text = null;
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
         * Generate a slider to control this resistance
         * @return {HTMLInputElement} <input type="range" ... />
         */
        genSlider() {
            let el = document.createElement('input');
            el.setAttribute('type', 'range');
            el.setAttribute('min', 0);
            el.setAttribute('max', 50);
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
    }

    return VariableResistor;
})();
