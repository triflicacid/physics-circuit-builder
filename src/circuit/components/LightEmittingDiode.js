import * as utils from '../../util/utils.js';
import Component from '../component.js';
import Diode from './Diode.js';

/**
 * Light Emitting Diode [LED]: diode, but emits light
 * @extends Component (template.js)
 *
 * @property _hue               Hue of LED (0-360)
 * @property _lpw                   Lumens per Watt
 * @property _luminoscity       Luminoscity of LED
 * @property (readonly) state   Is diode ON (boolean)
 *
 * @method hue(?hu)             Get / Set hue
 * @method getColour()          Get colour of LED
 * @method isOn()               Is this component 'on'?
 * @method eval()               Evaluate the component
 * @method render()             Render the component
 * @method onScroll(e)          What to do when scrolled on?
 * @method luminoscity()        Luminoscity is FIXED
 */
class LightEmittingDiode extends Diode {
    constructor(parentCircuit) {
        super(parentCircuit);
        this.hue(utils.randomInt(259));
        this._lpw = 90; // between 80 - 100, (https://www.rapidtables.com/calc/light/how-watt-to-lumen.html)
        this._luminoscity = utils.randomInt(200, 300);
    }

    /**
     * Is diode ON?
     * @type Boolean
     */
    get state() {
        return this.isOn();
    }

    /**
     * Get / Set hue
     * @param  {Number} hu      If  prenent, set hue:: New hue, 0 - 360
     * @return {LightEmittingDiode | Number} SET: this (chainable), GET: the hue
     */
    hue(hu = undefined) {
        if (typeof hu === "number") {
            this._hue = utils.clamp(hu, 0, 360);
            return this;
        } else {
            return this._hue;
        }
    }

    /**
     * Get RGB colour of LED
     * @param  {Boolean} asHsb  Return HSB or RGB?
     * @return {Number[]} RGB values
     */
    getColour(asHsb = false) {
        let s = 100;
        let hsb = [this.hue(), s, 100];
        if (asHsb) {
            hsb = hsb.map((n) => utils.roundTo(n, 1));
            return hsb;
        } else {
            let rgb = utils.hsb2rgb(...hsb);
            rgb = rgb.map((n) => utils.roundTo(n, 1));
            return rgb;
        }
    }

    /**
     * Is this component 'on'?
     * @return {Boolean} Well?
     */
    isOn() {
        return !this._broken && super.isOn();
    }

    /**
     * Render the LED
     */
    render() {
        // Call 'render' of super-super class
        Component.prototype.render.call(
            this,
            (p, colour, running, isBlown) => {
                const isOn = this.isOn();

                // Circle
                p.strokeWeight(1);
                p.stroke(colour);
                if (isBlown) {
                    p.fill(utils.randomInt(100));
                } else if (running && isOn) {
                    p.fill(...this.getColour());
                } else {
                    p.noFill();
                }
                p.ellipse(0, 0, this._w, this._w);

                // Line and triangle (like >|)
                {
                    p.push();
                    p.rotate(this._angle);
                    // Triangle
                    let y = this._w / 3;
                    let w = this._w / 4;

                    p.fill(
                        this._broken && running ?
                        p.color(255, 70, 80) :
                        colour
                    );
                    p.noStroke();
                    p.beginShape();
                    if (this._dir === Diode.LEFT) {
                        p.vertex(w, -y);
                        p.vertex(w, y);
                        p.vertex(-w, 0);
                    } else {
                        p.vertex(-w, y);
                        p.vertex(-w, -y);
                        p.vertex(w, 0);
                    }
                    p.endShape(p.CLOSE);

                    // Line
                    p.stroke(colour);
                    let x = w;
                    y = this._w / 3.5;
                    if (this._dir === Diode.LEFT) {
                        p.line(-x, -y, -x, y);
                    } else {
                        p.line(x, -y, x, y);
                    }
                    p.pop();
                }

                // Arrows
                const len = 10;
                const arr_off = 3;
                const rot_main =
                    this._dir === Diode.LEFT ?
                    utils.Degrees._270 - utils.Degrees._45 :
                    -utils.Degrees._45;
                const rot_angle =
                    this._dir === Diode.LEFT ?
                    this._angle + utils.Degrees._270 - utils.Degrees._45 :
                    this._angle - utils.Degrees._45;

                // Topmost
                p.push();
                let angle = this._angle + rot_main - utils.Degrees._10;
                let coords = utils.polToCart(angle, this._w / 2);
                p.translate(...coords);
                p.rotate(rot_angle);
                p.stroke(0);
                p.line(0, 0, len, 0);
                p.beginShape();
                p.fill(colour);
                p.vertex(len, arr_off);
                p.vertex(len, -arr_off);
                p.vertex(len + arr_off, 0);
                p.endShape(p.CLOSE);
                p.pop();

                // Bottommost
                p.push();
                angle = this._angle + rot_main + utils.Degrees._10 + utils.Degrees._5;
                coords = utils.polToCart(angle, this._w / 2);
                p.translate(...coords);
                p.rotate(rot_angle);
                p.stroke(0);
                p.line(0, 0, len, 0);
                p.beginShape();
                p.fill(colour);
                p.vertex(len, arr_off);
                p.vertex(len, -arr_off);
                p.vertex(len + arr_off, 0);
                p.endShape(p.CLOSE);
                p.pop();

                // Show expected direction of flow in green box
                // if (running && this.control._showInfo && !isBlown) {
                //     p.textAlign(p.CENTER, p.CENTER);
                //     p.strokeWeight(1);
                //     p.stroke(0, 100, 0);
                //     p.fill(160, 255, 200);
                //
                //     let h = this._h / 3;
                //     p.rect(0, this._h / 2 + h, this._w, h);
                //
                //     p.textSize(Component.SMALL_TEXT);
                //     p.noStroke();
                //     p.fill(0);
                //     p.text(this.isOn(), 0, this._h / 1.9 + h);
                //
                //     p.textAlign(p.LEFT, p.LEFT);
                // }
            }
        );
    }

    /**
     * What to do on scroll (mouseWheel)
     * @param  {Event} event    Mouse wheel event
     */
    onScroll(event) {
        const delta = Math.sign(event.deltaY) * -2;
        let newHu = this._hue + delta;
        if (newHu < 0) newHu += 360;
        else if (newHu >= 360) newHu -= 360;
        this.hue(newHu);
    }

    /**
     * Luminoscity is FIXED
     */
    luminoscity() {
        return this._luminoscity;
    }
}
LightEmittingDiode.toStore = [
    ...Diode.toStore,
    "hue",
    "lpw",
    "luminoscity",
];
LightEmittingDiode.config = [{
        field: "dir",
        name: "Dir",
        type: "dir"
    },
    {
        field: "hue",
        name: "Hue",
        type: "number",
        min: 0,
        max: 359
    },
];

export default LightEmittingDiode;