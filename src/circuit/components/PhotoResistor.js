import * as utils from '../../util/utils.js';
import Component from '../component.js';
import Resistor from './Resistor.js';

/**
 * Resistance changes with light
 * @extends Resistor
 *
 * @property resistance         Calculate resistance, given light_recieving
 *
 * @method eval()
 * @method render()             Render the cell onto the global p5 sketch
 */
class PhotoResistor extends Resistor {
    constructor(parentCircuit) {
        super(parentCircuit);
    }

    /**
     * Calculate and return resistance of component
     * - More light == less resistance
     * @return {Number} Resistance
     */
    get resistance() {
        const lumens = utils.clamp(this._lightRecieving, 0, 1000);
        const r = utils.mapNumber(lumens, 0, 1000, 1, Component.ZERO_RESISTANCE);
        return r;
    }

    render() {
        super.render((p, colour) => {
            // Arrows
            const len = 10;
            const arr_off = 3;
            const rot_main = utils.Degrees._270 - utils.Degrees._45 + utils.Degrees._10;
            const rot_angle =
                this._angle + utils.Degrees._270 - utils.Degrees._45 + utils.Degrees._10;
            const pad = 2.5;

            // Topmost
            p.push();
            let angle = this._angle + rot_main - utils.Degrees._10;
            let coords = utils.polToCart(angle, this._w / 2);
            p.translate(...coords);
            p.rotate(rot_angle);
            p.stroke(colour);
            p.line(pad, 0, pad + len, 0);
            p.beginShape();
            p.fill(colour);
            p.vertex(pad, arr_off);
            p.vertex(pad, -arr_off);
            p.vertex(pad - arr_off, 0);
            p.endShape(p.CLOSE);
            p.pop();

            // Bottommost
            p.push();
            angle = this._angle + rot_main + utils.Degrees._10 + utils.Degrees._5;
            coords = utils.polToCart(angle, this._w / 2);
            p.translate(...coords);
            p.rotate(rot_angle);
            p.stroke(colour);
            p.line(pad, 0, len + pad, 0);
            p.beginShape();
            p.fill(colour);
            p.vertex(pad, arr_off);
            p.vertex(pad, -arr_off);
            p.vertex(pad - arr_off, 0);
            p.endShape(p.CLOSE);
            p.pop();
        });
    }
}

export default PhotoResistor;