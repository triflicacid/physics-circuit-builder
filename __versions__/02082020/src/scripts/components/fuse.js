Circuit.Fuse = (function () {
    /**
     * Fuse: Break if current through it is too much
     * @extends Component (template.js)
     *
     * @property resistance         Changing this doesn't do anything now
     * @property _playedSound      When fuse is blown, plays a sound. Has it already been played?
     *
     * @method render()             Render the cell onto the global p5 sketch
     * @method eval()               Evaluate the component
     * @method setMaxVoltage(v)     Set max voltage across component
     */
    class Fuse extends Circuit.Component {
        constructor(parentCircuit) {
            super(parentCircuit);
            this._maxCurrent = 10;
            this._h /= 3;
            this._playedSound = false;
        }

        get resistance() {
            return Circuit.LOW_RESISTANCE;
        }

        /**
         * Evaluate the component
         */
        eval() {
            super.eval(() => {
                if (this._circuit._brokenBy == this && !this._playedSound) {
                    this._playedSound = true;
                    Fuse.break();
                }
            });
        }

        /**
         * Render the component
         */
        render() {
            super.render((p, colour, running) => {
                const isOn = this.isOn();
                const isBlown = this._circuit._brokenBy == this;

                p.strokeWeight(2);
                p.stroke(colour);
                if (isBlown && running) {
                    p.fill(p.random(100));
                } else {
                    p.noFill();
                }
                p.rect(0, 0, this._w, this._h);

                // Broken wire if blown
                if (running && isBlown) {
                    p.line(-this._w / 2, 0, -this._w / 4, 0);
                    p.line(this._w / 4, 0, this._w / 2, 0);
                } else {
                    p.line(-this._w / 2, 0, this._w / 2, 0);
                }

                // Show max current in green label
                if (running && this.control._showInfo && isOn) {
                    p.textAlign(p.CENTER, p.CENTER);
                    p.strokeWeight(1);
                    p.stroke(0, 100, 0);
                    p.fill(160, 255, 200);
                    p.rect(0, this._h + 4, this._w, this._h / 1.2);

                    p.textSize(Circuit.SMALL_TEXT);
                    p.noStroke();
                    p.fill(0);
                    let c = +this._maxCurrent.toFixed(1);
                    c = c <= 0 ? "LOW" : c + "A";
                    p.text("< " + c, 0, this._h + 5);

                    p.textAlign(p.LEFT, p.LEFT);
                }
            });
        }

        /**
         * Set maximum voltage across component
         * I = V / require('module')
         * @param {Number} v The maximum voltage
         */
        setMaxVoltage(v) {
            const current = v;
            this._maxCurrent = current;
        }
    }

    // Sound when fuse breaks
    Fuse.break = function () {
        Sounds.Play("BLOW");
    };

    Fuse.toStore = ["maxCurrent"];
    Fuse.config = [
        {
            field: "maxCurrent",
            name: "Max Current",
            type: "number",
            min: 0.01,
            max: 1000,
        },
    ];

    return Fuse;
})();
