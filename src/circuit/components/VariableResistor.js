import * as utils from '../../util/utils.js';
// import Component from '../component.js';
import Resistor from './Resistor.js';

/**
 * Component with a resistance with ability to alter this resistance
 * @extends Resistor
 *
 * @property _min               Minimum resistance
 * @property _max               Maximum resistance
 *
 * @method render()             Render the cell onto the global p5 sketch
 * @method min(n) / max(n)      Set max/min resistance
 * @method value()              Return resistance (formatted)
 * @method onScroll(e)          What to do when scrolled on?
 */
class VariableResistor extends Resistor {
    constructor(parentCircuit) {
        super(parentCircuit);
        this._min = 0;
        this._max = 1e3; //1e6;
    }

    render() {
        super.render((p, colour, running) => {
            p.strokeWeight(1.3);
            p.stroke(colour);
            const extX = 5;
            const extY = 2;

            const h = Resistor.SMALL_HEIGHT;
            const end = [this._w / 2 + extX, -h / 2 - extY];
            p.line(-this._w / 2 - extX, h / 2 + extY, ...end);

            // Arrow head
            p.push();
            p.translate(...end);
            p.rotate(Math.PI / 3);
            p.noStroke();
            p.fill(colour);
            p.beginShape();

            const off = 5;
            p.vertex(-off, 0);
            p.vertex(off, 0);
            p.vertex(0, -off);

            p.endShape();
            p.pop(p.CLOSE);
        });
    }

    /**
     * Set minimum resistance
     * @param  {Number} n       Min resistance
     */
    min(n) {
        if (n >= this._max)
            throw new TypeError(
                `Cannot set min resistance above max resistance`
            );
        this._min = n;
    }

    /**
     * Set minimum resistance
     * @param  {Number} n       Min resistance
     */
    max(n) {
        if (n <= this._min)
            throw new TypeError(
                `Cannot set max resistance below min resistance`
            );
        this._max = n;
    }

    /**
     * Get formatted resistance value
     * @return {Number} Formatted resistance
     */
    value() {
        let r = this.resistance;
        r = r.toFixed(1);
        r = +r;
        return r;
    }

    /**
     * What to do on scroll (mouseWheel)
     * @param  {Event} event    Mouse wheel event
     */
    onScroll(event) {
        let amount = 0.1;
        if (this.resistance > 1e5) amount = 1e3;
        else if (this.resistance > 1e4) amount = 100;
        else if (this.resistance > 1e3) amount = 1;

        const delta = Math.sign(event.deltaY) * -amount;
        let newR = utils.clamp(this._resistance + delta, this._min, this._max);
        this.resistance = newR;

        this.control.updateLightLevel();
    }
}
VariableResistor.toStore = [...Resistor.toStore, "min", "max"];
VariableResistor.config = [
    ...Resistor.config,
    {
        field: "resistance",
        name: "Resistance",
        min: 0.1,
        max: 1e6,
        type: 'number'
    },
];

export default VariableResistor;