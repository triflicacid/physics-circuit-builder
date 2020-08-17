import * as utils from '../../util/utils.js';
import Component from '../component.js';

/**
 * Thermometer: measure external temperature to thermometer
 * @extends Component (template.js)
 *
 * @property resistance         Changing this doesn't do anything now
 * @property _min               Minimum temperature we can handle
 * @property _max               Maximum temperature we can handle
 *
 * @method howFull()            How full is the thermometer? (0..1 decimal)
 */
class Thermometer extends Component {
    constructor(parentCircuit) {
        super(parentCircuit);
        this._maxCurrent = Number.MAX_SAFE_INTEGER;
        this._min = -25;
        this._max = 100;
    }

    get resistance() {
        return Component.LOW_RESISTANCE;
    }

    /**
     * Evaluate
     */
    eval() {
        super.eval(() => {
            if (
                this.control._running &&
                !this._circuit._isBroken &&
                this._externalTemp > this._max
            ) {
                super.blow(
                    `Component ${this.toString()} blew as it exceeded ${
                            this._max
                        }°C (was ${this._externalTemp}°C)`
                );
            }
        });
    }

    /**
     * Render the component
     */
    render() {
        super.render((p, colour, running) => {
            const isOn = this.isOn();
            p.textAlign(p.CENTER, p.CENTER);

            // Rectangle
            p.strokeWeight(1.5);
            p.stroke(colour);
            p.noFill();
            p.rect(0, 0, this._w / 2, this._h);

            // Filing
            const pad = 3;
            if (running && !this._blown) {
                const w = this._w / 4 - pad;
                const a = 200;
                p.noStroke();
                p.rectMode(p.CORNER);
                let h;
                if (this._externalTemp < this._min) {
                    p.fill(28, 58, 217, a);
                    h = 2;
                } else {
                    p.fill(217, 58, 28, a);
                    h = utils.mapNumber(this.howFull(), 0, 1, 1, this._h - pad * 2);
                }
                p.rect(-w, this._h / 2 - h - pad, w * 2, h);
                p.rectMode(p.CENTER);
            }

            {
                const limY = this._h / 2;
                const dy = this._h / 10;
                const x = this._w / 4;
                const len = 5;
                p.stroke(colour);
                p.strokeWeight(1.2);
                for (let y = -limY; y < limY; y += dy) {
                    p.line(x - len, y, x, y);
                }
            }

            // Reading of lumens in green label
            if (running) {
                p.strokeWeight(1);
                p.stroke(0, 100, 0);
                p.fill(160, 255, 200);
                p.rect(0, this._h / 1.3, this._w, this._h / 3);

                p.textSize(Component.SMALL_TEXT);
                p.noStroke();
                p.fill(0);
                let temp = this._externalTemp;
                if (this._blown) {
                    temp = "- - -";
                } else {
                    if (temp < this._min) {
                        temp = "COLD";
                    } else {
                        if (this._units === 0) temp *= 1e6;
                        // µ
                        else if (this._units === 1) temp *= 1e3;
                        // m
                        else if (this._units === 3) temp *= 1e-3; // k

                        if (temp !== 0) {
                            temp = utils.roundTo(temp, 2);
                            if (temp === 0) temp = "< 0.1";
                            else if (temp > 1e4) temp = "> 10,000";
                        }

                        temp += "°C";
                    }
                }
                p.text(temp, 1, this._h / 1.25);
            }
            p.textAlign(p.LEFT, p.LEFT);
        });
    }

    /**
     * How full is the thermometer?
     * @return {Number} 0..1
     */
    howFull() {
        const fract =
            (this._externalTemp - this._min) / (this._max - this._min);
        return fract;
    }

    /**
     * Connect coordinates for inputs
     * - Should be overridden for each component, but here just in case :)
     * @param  {Number} no  Input number
     * @return {Number[]} Coordinates [x, y]
     */
    getInputCoords(no) {
        const move = utils.polToCart(-this._angle, this._w / 4);
        return [this._x - move[0], this._y + move[1]];
    }

    /**
     * Connect coordinates for outputs
     * - Should be overridden for each component, but here just in case :)
     * @param  {Number} no  Input number
     * @return {Number[]} Coordinates [x, y]
     */
    getOutputCoords(no) {
        const move = utils.polToCart(this._angle, this._w / 4);
        return [this._x + move[0], this._y + move[1]];
    }
}

Thermometer.toStore = ["min", "max"];

export default Thermometer;