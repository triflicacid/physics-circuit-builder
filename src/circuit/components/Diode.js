import * as utils from '../../util/utils.js';
import Sounds from '../../sounds/index.js';
import Component from '../component.js';

/**
 * Diode: only allow current to flow one way
 * @extends Component (template.js)
 *
 * @property resistance         Changing this doesn't do anything now
 * @property _broken            Have we broken the circuit?
 * @property _dir               Direction
 *
 * @method eval()               Evaluate the component
 * @method lock()               Check to 'lock' the diode
 * @method unlock()             Check to 'unlock' the diode
 * @method render()             Render the component
 * @method setMaxCurrent(v)     Set the max current (chainable)
 * @method flip()               Flip direction of diode
 */
class Diode extends Component {
    constructor(parentCircuit) {
        super(parentCircuit);
        this._maxCurrent = 5;
        this._broken = false;
        this._dir = Diode.RIGHT;
    }

    get resistance() {
        return this._broken ?
            Component.INFIN_RESISTANCE :
            Component.LOW_RESISTANCE;
    }

    /**
     * Evaluate the component
     */
    eval() {
        super.eval(() => {
            this.lock();
        });
    }

    /**
     * Check to "lock" the diode
     * @return {Boolean} Was the diode locked?
     */
    lock() {
        // Check for bad flow
        let badFlow = false;
        if (this._dir === Diode.RIGHT && this.current < 0) badFlow = true;
        else if (this._dir === Diode.LEFT && this.current >= 0)
            badFlow = true;

        if (!this._broken && badFlow) {
            this._broken = true;
            if (!this._circuit._isBroken) {
                this._circuit.break(this);
            }
        }
    }

    /**
     * Check to "unlock" the diode (called when a battery/cell is flipped)
     * @return {Boolean} Was the diode unlocked?
     */
    unlock() {
        // If the flow is now good...
        if (
            (this._dir === Diode.RIGHT && this.current >= 0) ||
            (this._dir === Diode.LEFT && this.current <= 0)
        ) {
            this._broken = false;
            // Sounds.Play('bzz');
            if (this._circuit._brokenBy === this) {
                this._circuit.break(null);
            }
            return true;
        }
        return false;
    }

    /**
     * Render the component
     */
    render() {
        super.render((p, colour, running, isBlown) => {
            const isOn = this.isOn();

            // Circle
            p.strokeWeight(1);
            p.stroke(colour);
            if (isBlown) {
                p.fill(utils.randomInt(0, 100));
            } else {
                p.noFill();
            }
            p.ellipse(0, 0, this._w, this._w);

            // Triangle
            let y = this._w / 3;
            let w = this._w / 4;

            p.fill(this._broken && running ? p.color(255, 70, 80) : colour);
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

            // Show whether LED is ON/OFF in green box
            // if (running && this.control._showInfo && isOn) {
            //     p.textAlign(p.CENTER, p.CENTER);
            //     p.strokeWeight(1);
            //     p.stroke(0, 100, 0);
            //     p.fill(160, 255, 200);

            //     let h = this._h / 3;
            //     p.rect(0, this._h / 2 + h, this._w, h);

            //     p.textSize(Component.SMALL_TEXT);
            //     p.noStroke();
            //     p.fill(0);
            //     // const arrow = (this._dir === Diode.RIGHT) ? Diode.RIGHT_ARROW : Diode.LEFT_ARROW;
            //     let text = this._dir === Diode.RIGHT ? "> 0A" : "< 0A";
            //     p.text(text, 0, this._h / 1.9 + h);

            //     p.textAlign(p.LEFT, p.LEFT);
            // }
        });
    }

    /**
     * Flip direction of diode
     * @return {Number}     New direction
     */
    flip() {
        this._dir = this._dir === Diode.LEFT ? Diode.RIGHT : Diode.LEFT;
        Sounds.Play("toggle-" + (this._dir === Diode.RIGHT ? "on" : "off"));
        this.unlock();
        return this._dir;
    }

    /**
     * Is this component passable?
     * @override
     * @return {Boolean} true/false
     */
    passable() {
        return !this._broken && super.passable();
    }
}

Diode.toStore = ["dir"];
Diode.config = [{
    field: "dir",
    name: "Dir",
    type: "dir"
}];

Diode.LEFT = 0; // <-
Diode.RIGHT = 1; // -> [DEFAULT]

Diode.RIGHT_ARROW = "→";
Diode.LEFT_ARROW = "←";

export default Diode;