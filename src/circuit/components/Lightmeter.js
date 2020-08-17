import * as utils from '../../util/utils.js';
import Component from '../component.js';

/**
 * Lightmeter: measure light hitting the meter
 * @extends Component (template.js)
 *
 * @property resistance         Changing this doesn't do anything now
 * @property _units             Units of ammeter (index of Lightmeter.UNITS)
 *
 * @method changeUnits()        Change units
 * @method onScroll(e)          What to do when scrolled on?
 */
class Lightmeter extends Component {
    constructor(parentCircuit) {
        super(parentCircuit);
        this._maxCurrent = Number.MAX_SAFE_INTEGER;
        this._units = 2; // 'Lm'
    }

    get resistance() {
        return Component.LOW_RESISTANCE;
    }

    /**
     * Render the component
     */
    render() {
        super.render((p, colour, running) => {
            const unit = Lightmeter.UNITS[this._units];
            const isOn = this.isOn();

            // Circle
            p.strokeWeight(1);
            p.stroke(colour);
            if (this._blown) {
                p.fill(randomInt(100));
            } else {
                p.noFill();
            }
            p.ellipse(0, 0, this._w, this._w);

            // Units
            p.textAlign(p.CENTER, p.CENTER);
            p.textStyle(p.BOLD);
            p.noStroke();
            p.fill(colour);
            p.textSize(22);
            p.text(unit, 0, 0);
            p.textStyle(p.NORMAL);

            // Reading of lumens in green label
            if (running) {
                p.strokeWeight(1);
                p.stroke(0, 100, 0);
                p.fill(160, 255, 200);
                p.rect(0, this._h / 1.3, this._w, this._h / 3);

                p.textSize(Component.SMALL_TEXT);
                p.noStroke();
                p.fill(0);
                let lumens = this._lightRecieving;
                if (isOn) {
                    if (this._units === 0) lumens *= 1e6;
                    // µlm
                    else if (this._units === 1) lumens *= 1e3;
                    // mlm
                    else if (this._units === 3) lumens *= 1e-3; // klm

                    if (lumens !== 0) {
                        lumens = utils.roundTo(lumens, 1);
                        if (lumens === 0) lumens = "< 0.1";
                        else if (lumens > 1e4) lumens = "> 10,000";
                    }
                } else {
                    lumens = "- - -";
                }
                p.text(lumens, 0, this._h / 1.25);
            }
            p.textAlign(p.LEFT, p.LEFT);
        });
    }

    /**
     * Sitch between units
     * @return {Number} New unit index (Ammeter.UNITS)
     */
    changeUnits() {
        this._units++;
        if (this._units === Lightmeter.UNITS.length) this._units = 0;
        return this._units;
    }

    /**
     * What to do on scroll (mouseWheel)
     * @param  {Event} event    Mouse wheel event
     */
    onScroll(event) {
        const delta = Math.sign(event.deltaY) * -1;
        this._units += delta;

        if (this._units === Lightmeter.UNITS.length) this._units = 0;
        else if (this._units === -1)
            this._units = Lightmeter.UNITS.length - 1;
    }
}

Lightmeter.toStore = ["units"];
Lightmeter.UNITS = ["μlm", "mlm", "lm", "klm"];

export default Lightmeter;