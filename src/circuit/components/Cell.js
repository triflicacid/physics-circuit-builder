import * as utils from '../../util/utils.js';
import Component from '../component.js';
import Sounds from '../../sounds/index.js';

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
class Cell extends Component {
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
                p.textSize(Component.SMALL_TEXT * 1.5);
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

                p.textSize(Component.SMALL_TEXT);
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
        const move = utils.polToCart(this._angle, len);
        return [this._x - move[0], this._y + move[1]];
    }

    /**
     * Where should we connect the output from?
     * @return {Number[]}  Coordinates [x, y]
     */
    getOutputCoords() {
        const move = utils.polToCart(this._angle, 6);
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
Cell.config = [{
    field: "dir",
    name: "Dir",
    type: "dir"
}];

// DIrectionas of cell
Cell.LEFT = 0;
Cell.RIGHT = 1;

export default Cell;