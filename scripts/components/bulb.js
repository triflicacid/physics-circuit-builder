Circuit.Bulb = (function() {
    /**
     * Bulb: light
     * @extends Component (template.js)
     *
     * @property (readonly) brightness Brightness (alpha) of bulb
     * @property _playedFizzle  When bulb is blown, plays fizzle sound. Has it already been played?
     * @property _blown         Bollean; is/has this been blown?
     *
     * @method render()             Render the cell onto the global p5 sketch
     * @method eval()               Evaluate the component
     * @method getInputCoords()     Where should we connect the input to?
     * @method getOutputCoords()    Where should we connect the output from?
     * @method getData()         Override method of super.getData()
     */
    class Bulb extends Circuit.Component {
        constructor(parentCircuit) {
            super(parentCircuit);
            this._resistance = 2;
            this._inputMax = 1;
            this._playedFizzle = false;
            this._blown = false;
        }

        get brightness() {
            return (this.control._running && !this._circuit._isBroken) ? Math.abs(this.current) / this.maxCurrent : 0;
        }

        /**
         * Evaluate the Bulb
         */
        eval() {
            super.eval(() => {
                if (this._circuit._brokenBy == this && !this._blown) {
                    this._blown = true;
                    if (!this._playedFizzle) {
                        Bulb.fizzle();
                        this._playedFizzle = true;
                    }
                }
            });
        }


        /**
         * Render the Bulb on to the global canvas
         */
        render() {
            super.render((p, colour, running, circuitBroken) => {
                p.ellipseMode(p.CENTER);

                // Circle
                p.stroke(colour);

                if (running) {
                    if (this._blown) {
                        // BULB HAS BEEN BLOWN!
                        p.fill(p.random(100));
                    } else if (circuitBroken) {
                        p.noFill();
                    } else {
                        p.fill(255, 255, 102, this.brightness * 255);
                    }
                } else {
                    p.noFill();
                }

                p.strokeWeight(1);
                p.ellipse(0, 0, this._w, this._w);

                // Cross thing (always show if not running)
                if (!running || (!this._blown || p.random() <= 0.4)) {
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
                    p.text(roundTo(this.brightness * 100, 1).toFixed(1) + '%', 0, this._h / 1.25);

                    p.textAlign(p.LEFT, p.LEFT);
                }
            });
        }

        /**
         * Where should we connect the input to?
         * @return {Number[]}  Coordinates [x, y]
         */
        getInputCoords() {
            const move = polToCart(this._angle, -this._w / 2);
            return [
                this._x + move[0],
                this._y + move[1]
            ];
        }

        /**
         * Where should we connect the output from?
         * @return {Number[]}  Coordinates [x, y]
         */
        getOutputCoords() {
            const move = polToCart(this._angle, this._w / 2);
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
            data.maxV = this._maxVoltage;
            return data;
        }
    }

    // Play fizzle sound
    Bulb.fizzle = function() {
        Sounds.Play('BLOW');
    };

    return Bulb;
})();
