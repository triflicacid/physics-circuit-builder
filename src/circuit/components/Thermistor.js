import * as utils from '../../util/utils.js';
import Control from '../control.js';
import Sounds from '../../sounds/index.js';
import Component from '../component.js';
import Resistor from './Resistor.js';

/**
 * Resistance changes with heat
 * @extends Resistor
 *
 * @property _externalTemp      Heat we are exposed to from the surroundings
 * @property _mode              Thermistor mode
 * @property _min               Minimum temperature
 * @property _max               Maximum temperature
 * @property resistance         Calculate resistance, given this._heatRecieving
 *
 * @method mode(m)              Set mode of thermistor
 * @method eval()
 * @method render()             Render the cell onto the global p5 sketch
 */
class Thermistor extends Resistor {
    constructor(parentCircuit) {
        super(parentCircuit);
        this.mode(Thermistor.NTC); // What is in GCSE (BBC Bitesize)
    }

    /**
     * Return string representation of object (name)
     * @override
     * @return {String} description
     */
    toString() {
        const modeStr = this._mode === Thermistor.NTC ? "NTC" : "PTC";
        return modeStr + "-" + super.toString();
    }

    /**
     * Calculate and return resistance of component
     * @return {Number} Resistance
     */
    get resistance() {
        const temp = utils.clamp(this._externalTemp, Control.MIN_TEMP, Control.MAX_TEMP);

        // Default; PTC. smaller temp -> smaller resistance
        let min = Component.ZERO_RESISTANCE;
        let max = 1;

        // If NTC; smaller temp -> larger resistance
        if (this._mode === Thermistor.NTC)[min, max] = [max, min];

        const r = utils.mapNumber(
            temp,
            Control.MIN_TEMP,
            Control.MAX_TEMP,
            min,
            max
        );
        return r;
    }

    /**
     * Set mode of thermistor
     * @param {Number} mode     Either Thermistor.NTC or Thermistor.PTC
     */
    mode(mode) {
        if (mode === Thermistor.NTC) {
            this._mode = Thermistor.NTC;
            this._min = -55;
            this._max = 200;
        } else if (mode === Thermistor.PTC) {
            this._mode = Thermistor.PTC;
            this._min = 0;
            this._max = 120;
        } else {
            throw new TypeError(
                `Thermistor.mode: invalid enum argument '${mode}'`
            );
        }
    }

    render() {
        super.render((p, colour) => {
            p.strokeWeight(1.3);
            p.stroke(colour);

            const ext = 8;

            // Bottom tail
            const len = 10;
            const y = this._h / 2 + ext;
            const x = -this._w / 2;
            p.line(x, y, x + len, y);

            // Diagonal
            const dx = this._w / 1.25;
            p.line(x + len, y, x + dx, -this._h / 2 - ext);

            // Text
            const text = (this._mode === Thermistor.NTC ? "-" : "+") + "t°";
            p.noStroke();
            p.fill(colour);
            p.textSize(Component.SMALL_TEXT);
            p.textAlign(p.CENTER, p.CENTER);
            p.text(text, 0, y);
            p.textAlign(p.LEFT, p.LEFT);
        });
    }

    /**
     * Toggle between NTC and PTC
     */
    toggle() {
        if (this._mode === Thermistor.PTC) {
            this._mode = Thermistor.NTC;
            Sounds.Play("toggle-off");
        } else {
            this._mode = Thermistor.PTC;
            Sounds.Play("toggle-on");
        }
    }
}
// NTC: negative. Resistance increases while temperature decreases. Smaller temp, bigger resistance.
Thermistor.NTC = -1;

// PTC: positive. Resistance increases with temperature. Smaller temp, smaller resistance.
Thermistor.PTC = +1;

Thermistor.toStore = ["mode"];
Thermistor.config = [
    ...Resistor.config,
    {
        field: "mode",
        name: "Mode",
        type: "option",
        optionType: "number",
        options: [{
                value: Thermistor.NTC,
                name: "NTC",
            },
            {
                value: Thermistor.PTC,
                name: "PTC",
            },
        ],
    },
];

export default Thermistor;