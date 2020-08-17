import * as utils from '../../util/utils.js';
import Component from '../component.js';
import Cell from './Cell.js';

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
        val = utils.clamp(Math.abs(val), 0, this.maxVoltage);
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
            val = val <= 0 ? 0.1 : utils.clamp(val, 1e-3, 1e3);
            this._delta = val;
        }
        return this._delta;
    }

    /**
     * Evaluate component
     */
    eval() {
        Component.prototype.eval.call(this, () => {
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

        Component.prototype.render.call(this, (p, colour, running) => {
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

                p.textSize(Component.SMALL_TEXT);
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
        const move = utils.polToCart(-this._angle, this._w / 2);
        return [this._x - move[0], this._y + move[1]];
    }

    /**
     * Connect coordinates for outputs
     * - Should be overridden for each component, but here just in case :)
     * @return {Number[]} Coordinates [x, y]
     */
    getOutputCoords() {
        const move = utils.polToCart(this._angle, this._w / 2);
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
DCPowerSupply.config = [{
    field: 'voltage',
    name: 'Voltage',
    type: 'number',
    slider: true,
    min: 0.1,
    max: DCPowerSupply.MAX_VOLTAGE,
    step: 0.1
}];

export default DCPowerSupply;