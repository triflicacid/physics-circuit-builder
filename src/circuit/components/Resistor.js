import * as utils from '../../util/utils.js';
import Component from '../component.js';

/**
 * Component with a resistance
 * @extends Component (template.js)
 *
 * @property _american          Should we use the american symbol?
 *
 * @method render(fn)           Render the cell onto the global p5 sketch
 *  - NB as this can be extended, ability to pass extra fn code to execute
 *  @method toggle()            Toggle between American and British symbols
 */
class Resistor extends Component {
    constructor(parentCircuit) {
        super(parentCircuit);
        this._resistance = 1;
        this._maxCurrent = Number.MAX_SAFE_INTEGER;
        this._american = false;
        this._h /= 3;
    }

    /**
     * Render component
     * @param {Function} fn     Additional render code
     */
    render(fn) {
        const isOn = this.isOn();

        super.render((p, colour, running) => {
            p.strokeWeight(2);
            p.stroke(colour);
            p.noFill();

            if (this._american) {
                const dx = this._w / 10;
                const dy = 8;

                p.beginShape();
                const startX = -this._w / 2;
                const limX = this._w / 2;
                for (
                    let i = 0, x = startX, y = 0; x < limX; x += dx, i++, y = i % 2 === 0 ? -dy : dy
                ) {
                    p.vertex(x, y);
                }
                p.vertex(this._w / 2, 0);
                p.endShape();
            } else {
                p.rect(0, 0, this._w, Resistor.SMALL_HEIGHT);
            }

            // Resistance in green label box
            if (running && this.control._showInfo) {
                p.textAlign(p.CENTER, p.CENTER);
                p.strokeWeight(1);
                p.stroke(0, 100, 0);
                p.fill(160, 255, 200);
                let padTop, textYOffset;
                if (this.constructor.name === 'Thermistor') {
                    padTop = 0.58;
                    textYOffset = 0.03;
                } else {
                    padTop = 0.75;
                    textYOffset = 0.05;
                }
                p.rect(0, this._h / padTop, this._w, this._h / 1.2);

                p.textSize(Component.SMALL_TEXT);
                p.noStroke();
                p.fill(0);
                let res = this.resistance;
                if (isOn) {
                    if (res === 0 || res === Component.ZERO_RESISTANCE) {
                        res = "0";
                    } else {
                        if (res < 0.0001) res = "< 0.1m";
                        else if (res < 0.1)
                            res = utils.roundTo(res * 1e3, 1) + "m";
                        else if (res > 1e4)
                            res = utils.roundTo(res / 1e3, 1) + "k";
                        else res = utils.roundTo(res, 1);
                    }
                    res += 'Ω';
                } else {
                    res = "- - -";
                }
                p.text(res, 0, this._h / (padTop - textYOffset));
                p.textAlign(p.LEFT, p.LEFT);
            }

            if (typeof fn === "function") fn(p, colour, running);
        });
    }

    /**
     * Toggle between American and British symbols
     */
    toggle() {
        this._american = !this._american;
    }
}
Resistor.toStore = ["american"];
Resistor.config = [{
    field: "american",
    name: "US",
    type: "boolean"
}];
Resistor.SMALL_HEIGHT = 17; // E.g. box, arrow

export default Resistor;