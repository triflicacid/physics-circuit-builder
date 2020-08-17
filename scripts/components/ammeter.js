Circuit.Ammeter = (function() {
    /**
     * Ammeter: measure current and diaplay it
     * @extends Component (template.js)
     *
     * @property resistance         Changing this doesn't do anything now
     */
    class Ammeter extends Circuit.Component {
        constructor(parentCircuit) {
            super(parentCircuit);
            this._maxCurrent = Infinity;
        }

        get resistance() { return Circuit.ZERO_RESISTANCE; }

        /**
         * Render the component
         */
        render() {
            super.render((p, colour, running) => {
                // Circle
                p.strokeWeight(1);
                p.stroke(colour);
                p.fill(255);
                p.ellipse(0, 0, this._w, this._w);

                // 'A'
                p.textAlign(p.CENTER, p.CENTER);
                p.textStyle(p.BOLD);
                p.noStroke();
                p.fill(colour);
                p.textSize(25);
                p.text('A', 0, 0);
                p.textStyle(p.NORMAL);

                // Reading of current in green label
                if (running) {
                    p.strokeWeight(1);
                    p.stroke(0, 100, 0);
                    p.fill(160, 255, 200);
                    p.rect(0, this._h / 1.3, this._w, this._h / 3);

                    p.textSize(Circuit.SMALL_TEXT);
                    p.noStroke();
                    p.fill(0);
                    let current = roundTo(this.current, 1);
                    if (current === 0) {
                        p.text('LOW', 0, this._h / 1.25);
                    } else {
                        p.text(current.toString() + 'A', 0, this._h / 1.25);
                    }
                }
                p.textAlign(p.LEFT, p.LEFT);
            });
        }
    }

    return Ammeter;
})();
