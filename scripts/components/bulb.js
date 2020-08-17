/**
 * Bulb: light
 * @extends Component (template.js)
 *
 * @property maxVoltage         What is the max volta ebefore the bulb blows?
 *
 * @method setMaxVoltage(v)     Set the max voltage (chainable)
 * @method render()             Render the cell onto the global p5 sketch
 * @method getInputCoords()     Where should we connect the input to?
 * @method getOutputCoords()    Where should we connect the output from?
 * @method getData()         Override method of super.getData()
 */
class Bulb extends Component {
    constructor(parentCircuit) {
        super(parentCircuit);
        this._maxVoltage = 5;
        this._maxConnected = 1;
    }

    get maxVoltage() { return this._maxVoltage; }
    set maxVoltage(v) {
        if (typeof v !== 'number') return;
        if (v <= 0) v = 1;
        this._maxVoltage = v;
    }

    /**
     * Set the max voltage
     * @param {Number} The new maximum voltage
     * @return {Bulb}  Return 'this' (chainable)
     */
    setMaxVoltage(v) {
        this.maxVoltage = v;
        return this;
    }

    /**
     * Render the Bulb on to the global canvas
     */
    render() {
        super.render(colour => {
            const p = this._circuit._p5;

            p.ellipseMode(p.CENTER);

            // Circle
            p.stroke(colour);
            p.noFill();
            p.strokeWeight(1);
            p.ellipse(0, 0, this._w, this._w);

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

            if (this._selected) {
                p.textAlign(p.CENTER);
                p.textSize(Circuit.SMALL_TEXT);
                p.noStroke();
                p.fill(colour);

                // Resistance
                p.text(this.resistance + Circuit.OHM, -1, -this._w / 4);

                // Max voltage
                p.text(this.maxVoltage + 'V', -1, this._w / 4 + 5);

                p.textAlign(p.LEFT);
            }
        });
    }

    /**
     * Where should we connect the input to?
     * @return {Number[]}  Coordinates [x, y]
     */
    getInputCoords() {
        return [
            this._x - (this._w / 2),
            this._y
        ];
    }

    /**
     * Where should we connect the output from?
     * @return {Number[]}  Coordinates [x, y]
     */
    getOutputCoords() {
        return [
            this._x + (this._w / 2),
            this._y
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
