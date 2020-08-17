import * as utils from '../../util/utils.js';
import Component from '../component.js';

/**
 * Ammeter: measure current and diaplay it
 * @extends Component (template.js)
 *
 * @property resistance         Changing this doesn't do anything now
 * @property _units             Units of ammeter (index of Ammeter.UNITS)
 *
 * @method changeUnits()        Change units
 * @method onScroll(e)          What to do when scrolled on?
 */
class Ammeter extends Component {
    constructor(parentCircuit) {
        super(parentCircuit);
        this._maxCurrent = Number.MAX_SAFE_INTEGER;
        this._units = 2; // 'A'
    }

    get resistance() {
        return Component.LOW_RESISTANCE;
    }

    /**
     * Render the component
     */
    render() {
        super.render((p, colour, running) => {
            const unit = Ammeter.UNITS[this._units];
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
            p.textSize(25);
            p.text(unit, 0, 0);
            p.textStyle(p.NORMAL);

            // Reading of current in green label
            if (running) {
                p.strokeWeight(1);
                p.stroke(0, 100, 0);
                p.fill(160, 255, 200);
                p.rect(0, this._h / 1.3, this._w, this._h / 3);

                p.textSize(Component.SMALL_TEXT);
                p.fill(0);
                p.noStroke();
                let current = this.current;
                if (isOn) {
                    if (this._units === 0) current *= 1e6;
                    // µA
                    else if (this._units === 1) current *= 1e3;
                    // mA
                    else if (this._units === 3) current *= 1e-3; // kA

                    if (current !== 0) {
                        current = utils.roundTo(current, 1);
                        if (current === 0) current = "< 0.1";
                        else if (current > 1e4) current = "> 10,000";
                    }
                } else {
                    current = "- - -";
                }
                p.text(current, 0, this._h / 1.25);
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
        if (this._units === Ammeter.UNITS.length) this._units = 0;
        return this._units;
    }

    /**
     * What to do on scroll (mouseWheel)
     * @param  {Event} event    Mouse wheel event
     */
    onScroll(event) {
        const delta = -Math.sign(event.deltaY);

        this._units += delta;

        if (this._units === Ammeter.UNITS.length) this._units = 0;
        else if (this._units === -1) this._units = Ammeter.UNITS.length - 1;
    }
}

Ammeter.toStore = ["units"];
Ammeter.UNITS = ["μA", "mA", "A", "kA"];

export default Ammeter;