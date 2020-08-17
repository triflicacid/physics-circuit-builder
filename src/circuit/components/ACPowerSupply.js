import * as utils from '../../util/utils.js';
import Component from '../component.js';
import Cell from './Cell.js';

/**
 * An alternating current-producing thing
 * AC power
 * @extends Component (template.js)
 *
 * @property voltage         Voltage of the battery
 * @property _dir            Current direction of current
 * @property _frame          After how many frames should we 'flip'
 * @property _lastFlipFrame  When did we last flip? (so we stop flipped twice per frame)
 * @property currentFrame    Get current frame of the control
 *
 * @method hertz(?hz)        Get / Set value (fps)
 * @method frame(?f)         Get / Set frame value (_frame)
 * @method render()          Render the cell onto the global p5 sketch
 * @method eval()            Evaluate the component
 * @method getInputCoords()  Where should we connect the input to?
 * @method getOutputCoords() Where should we connect the output from?
 * @method onScroll(e)          What to do when scrolled on?
 */
class ACPowerSupply extends Cell {
    constructor(parentCircuit) {
        super(parentCircuit);
        this._frame = 8;
        this._lastFlipFrame = -1;
    }

    /**
     * Get current frame that control is on
     * @return {Number} Current frame count
     */
    get currentFrame() {
        return this._circuit._control._p5.frameCount;
    }

    /**
     * Get / Set cycles per second
     * @param  {Number} hz  If present, what to set hertz to; else, get.
     * @return {Number} Hertz (cycles per second)
     */
    hertz(hz = undefined) {
        if (typeof hz === "number") {
            let val = Math.round(hz);
            if (val <= 0) val = 1;
            let frames = this._circuit._control._fps / val;
            this._frame = frames;
            return val;
        } else {
            return this._circuit._control._fps / this._frame;
        }
    }

    /**
     * Get / Set _frame
     * @param  {Number} f   If present, what to set _frame to; else, get.
     * @return {Number} Execute every x frames...
     */
    frame(f = undefined) {
        if (typeof f === "number") {
            let val = Math.round(f);
            if (val <= 0) val = 1;
            this._frame = val;
            return val;
        } else {
            return this._frame;
        }
    }

    /**
     * Evaluate component
     */
    eval() {
        Component.prototype.eval.call(this, () => {
            if (this._circuit._depth !== 0)
                throw new Error(
                    `ACPowerSupply component must be in top-level circuit`
                );
            if (
                this.currentFrame !== this._lastFlipFrame &&
                this.currentFrame % this._frame === 0
            ) {
                this._lastFlipFrame = this.currentFrame;
                this.flip();
            }
        });
    }

    /**
     * Render the Cell to the global p5 instance
     */
    render() {
        const isOn = this.isOn();

        Component.prototype.render.call(
            this,
            (p, colour, running) => {
                const isBlown = this.isBlown();

                // Circle
                p.strokeWeight(1);
                p.stroke(colour);
                p.noFill();
                p.ellipse(0, 0, this._w, this._w);

                // Wave
                p.beginShape();
                p.strokeWeight(2);
                const bound = this._w / 4;
                if (running && isOn) {
                    for (let x = 0; x <= 360; x += 5) {
                        let px = utils.mapNumber(x, 0, 360, -bound, bound);
                        let py = Math.sin(utils.Degrees(x));
                        py = this._dir === Cell.RIGHT ?
                            utils.mapNumber(py, -1, 1, -bound, bound) :
                            utils.mapNumber(py, -1, 1, bound, -bound);
                        p.vertex(px, py);
                    }
                    p.endShape();
                } else {
                    p.line(-bound, 0, bound, 0);
                }

                // Plus sign
                if (running) {
                    const [sign, ...fill] =
                    this._dir === Cell.RIGHT ||
                        !running ||
                        !isOn ||
                        isBlown ? ["+", 255, 0, 0] : ["-", 0, 0, 255];
                    p.noStroke();
                    p.fill(...fill);
                    p.textSize(Component.SMALL_TEXT * 1.5);
                    p.text(sign, this._w / 2 - 12, 0);
                }

                // Show voltage in green box
                if (running && this.control._showInfo) {
                    p.textAlign(p.CENTER, p.CENTER);
                    p.strokeWeight(1);
                    p.stroke(0, 100, 0);
                    p.fill(160, 255, 200);

                    let h = this._h / 3;
                    p.rect(0, this._h / 2 + h, this._w, h);

                    p.textSize(Component.SMALL_TEXT);
                    p.noStroke();
                    p.fill(0);
                    let v = +this.voltage.toFixed(1);
                    if (isBlown) v = "- - -";
                    else if (!running || !isOn) v = "±" + Math.abs(v) + "V";
                    else v += "V";

                    p.text(v, 0, this._h / 1.9 + h);

                    p.textAlign(p.LEFT, p.LEFT);
                }
            }
        );
    }

    /**
     * Connect coordinates for inputs
     * - Should be overridden for each component, but here just in case :)
     * @return {Number[]} Coordinates [x, y]
     */
    getInputCoords() {
        const move = utils.polToCart(-this._angle, this._w / 2);
        return [this._x - move[0], this._y + move[1]];
    }

    /**
     * Connect coordinates for outputs
     * - Should be overridden for each component, but here just in case :)
     * @return {Number[]} Coordinates [x, y]
     */
    getOutputCoords() {
        const move = utils.polToCart(this._angle, this._w / 2);
        return [this._x + move[0], this._y + move[1]];
    }

    /**
     * What to do on scroll (mouseWheel)
     * @param  {Event} event    Mouse wheel event
     */
    onScroll(event) {
        const delta = Math.sign(event.deltaY) * -0.2;
        this.voltage += delta;
    }
}
ACPowerSupply.toStore = [...Cell.toStore, "frame"];

export default ACPowerSupply;