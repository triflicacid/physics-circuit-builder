import * as utils from '../../util/utils.js';
import Component from '../component.js';

/**
 * Voltmeter: measure voltage accross a component and display it
 * @extends Component (template.js)
 *
 * @property resistance         Changing this doesn't do anything now
 */
class Wattmeter extends Component {
    constructor(parentCircuit) {
        super(parentCircuit);
        this._maxCurrent = Infinity;
    }

    get resistance() {
        return Component.LOW_RESISTANCE;
    }

    /**
     * Render the component
     */
    render() {
        const isOn = this.isOn();

        super.render((p, colour, running) => {
            // Circle
            p.strokeWeight(1);
            p.stroke(colour);
            p.noFill();
            p.ellipse(0, 0, this._w, this._w);

            // 'Sign
            p.textAlign(p.CENTER, p.CENTER);
            p.textStyle(p.BOLD);
            p.noStroke();
            p.fill(colour);
            p.textSize(18);
            p.text("Watt", 0, 2);
            p.textStyle(p.NORMAL);

            // Reading of current in green label
            if (running) {
                p.strokeWeight(1);
                p.stroke(0, 100, 0);
                p.fill(160, 255, 200);
                p.rect(0, this._h / 1.3, this._w, this._h / 3);

                p.textSize(Component.SMALL_TEXT);
                p.noStroke();
                p.fill(0);
                let power = utils.roundTo(this._circuit.power(), 1);
                power = isOn ?
                    (power === 0 ? "< 0.1" : power) + "W" :
                    "- - -";
                p.text(power, 0, this._h / 1.25);
            }
            p.textAlign(p.LEFT, p.LEFT);
        });
    }
}

export default Wattmeter;