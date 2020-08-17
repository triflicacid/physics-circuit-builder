/**
 * A cell has a voltage
 * @extends Component (template.js)
 *
 * @property voltage         Voltage of the battery
 *
 * @method setVoltage(v)     Chainable setter for this.voltage
 * @method render()          Render the cell onto the global p5 sketch
 * @method getInputCoords()  Where should we connect the input to?
 * @method getOutputCoords() Where should we connect the output from?
 * @method getData()         Override method of super.getData()
 */
class Cell extends Component {
    constructor(parentCircuit) {
        super(parentCircuit);

        this._voltage = 1;
        this._maxConnected = 1;
    }

    /*      PUBLIC PROPERTIES   */
    get voltage() { return this._voltage; }
    set voltage(v) {
        if (typeof v !== 'number') throw new TypeError(`Cell.voltage: expected voltage to be number`);
        if (v <= 0) v = 1;
        this._voltage = v;
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
     * Render the Cell to the global p5 instance
     */
    render() {
        super.render(colour => {
            const p = this._circuit._p5;

            // Line
            let offset = 4;
            p.stroke(colour);
            p.strokeWeight(2);
            p.line(-offset, -this._w / 2, -offset, this._w / 2);

            // Rectangle
            p.noStroke();
            p.fill(colour);
            p.rect(6, 0, 5, this._w / 2);

            // Minus sign (near rectangle)
            // p.stroke(0, 0, 255);
            // p.strokeWeight(1);
            // p.line(offset + 5, -this._w / 3, offset + 10, -this._w / 3);

            if (this._selected) {
                // Show voltage
                p.noStroke();
                p.fill(colour);
                p.textSize(Circuit.SMALL_TEXT);
                p.text(this.voltage + 'V', 1, (-this._w / 2) + 5);
            }
        });
    }

    /**
     * Where should we connect the input to?
     * @return {Number[]}  Coordinates [x, y]
     */
    getInputCoords() {
        return [
            this._x - 6,
            this._y
        ];
    }

    /**
     * Where should we connect the output from?
     * @return {Number[]}  Coordinates [x, y]
     */
    getOutputCoords() {
        return [
            this._x + 6,
            this._y
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
}
