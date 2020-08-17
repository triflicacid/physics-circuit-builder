// import * as utils from '../../util/utils.js';
import Connector from './connector.js';

/**
 * Like connector, but switches between executing one circuit to the other
 * - OLD NAME: ToggleConnector
 * @extends Connector
 *
 * @property _originalExec      The original value of _exec
 *
 * @method one()        Only execute circuit 1
 * @method two()        Only execute circuit 2
 * @method toggle()     Flip execution
 * @method eval()
 * @method render()
 */
class TwoWaySwitch extends Connector {
    constructor(parentCircuit) {
        super(parentCircuit);

        this._exec =
            Math.random() <= 0.5 ?
            Connector.EXEC_ONE :
            Connector.EXEC_TWO;
        this._originalExec = this._exec;

        this._w = Component.DEFAULT_WIDTH;
        this._h = this._w;

        delete this._isEnd;
    }

    /**
     * Switch _exec to circuit 1
     */
    one() {
        this._exec = Connector.EXEC_ONE;
    }

    /**
     * Switch _exec to circuit 2
     */
    two() {
        this._exec = Connector.EXEC_ONE;
    }

    /**
     * Toggle which circuit to execute
     * @param  {Boolean} playSound  Play toggle sound
     * @return {Number}              Which circuit are we executing? 1 or 2?
     */
    toggle(playSound = false) {
        this._exec =
            this._exec === Connector.EXEC_ONE ?
            Connector.EXEC_TWO :
            Connector.EXEC_ONE;
        if (playSound)
            Sounds.Play(
                "toggle-" +
                (this._exec === this._originalExec ? "off" : "on")
            );
        this.control.updateLightLevel();
        return this._exec;
    }

    /**
     * Evaluate the component
     */
    eval() {
        Component.prototype.eval.call(this, () => {
            if (!this._isEnd) {
                // Unbreak if necessary
                if (
                    this._circuit1 !== undefined &&
                    this._circuit1._brokenBy === this
                )
                    this._circuit1.break(null);
                if (
                    this._circuit2 !== undefined &&
                    this._circuit2._brokenBy === this
                )
                    this._circuit2.break(null);

                // If executing circuit 1...
                if (this._exec === Connector.EXEC_ONE) {
                    // Set current if possible
                    if (this._circuit1 !== undefined)
                        this._circuit1.current = this.current;

                    // Stop other circuit
                    if (this._circuit2 !== undefined) {
                        this._circuit2.break(this);
                    }
                }

                // If executing circuit 2...
                else if (this._exec === Connector.EXEC_TWO) {
                    // Set current if possible
                    if (this._circuit2 !== undefined)
                        this._circuit2.current = this.current;

                    // Stop other circuit
                    if (this._circuit1 !== undefined) {
                        this._circuit1.break(this);
                    }
                }
            }
        });
    }

    /**
     * Renders component connector
     */
    render() {
        const isOn = this.isOn();

        Component.prototype.render.call(
            this,
            (p, colour, running) => {
                const d = 9;
                // Input blob
                p.fill(colour);
                p.noStroke();
                let inputCoords = this.getInputCoords();
                inputCoords[0] -= this._x;
                inputCoords[1] -= this._y;
                p.ellipse(...inputCoords, d, d);

                // Output 1 blob
                p.fill(colour);
                p.noStroke();
                let output1Coords = this.getOutputCoords(0);
                output1Coords[0] -= this._x;
                output1Coords[1] -= this._y;
                p.ellipse(...output1Coords, d, d);

                // Output 2 blob
                p.fill(colour);
                p.noStroke();
                let output2Coords = this.getOutputCoords(1);
                output2Coords[0] -= this._x;
                output2Coords[1] -= this._y;
                p.ellipse(...output2Coords, d, d);

                // Lines
                p.stroke(colour);
                let outputCoords =
                    this._exec === Connector.EXEC_ONE ?
                    output1Coords :
                    output2Coords;
                p.line(...inputCoords, ...outputCoords);

                if (this._debug) {
                    p.noStroke();
                    p.fill(255, 0, 20);

                    // Labels from circuits
                    p.text("1", ...output1Coords);
                    p.text("2", ...output2Coords);
                }
            }
        );
    }

    /**
     * Connect coordinates for inputs
     * - Should be overridden for each component, but here just in case :)
     * @param  {Number} no  Input number
     * @return {Number[]} Coordinates [x, y]
     */
    getInputCoords(no) {
        const move = utils.polToCart(-this._angle, this._w / 2);
        return [this._x - move[0], this._y + move[1]];
    }

    /**
     * Connect coordinates for outputs
     * - Should be overridden for each component, but here just in case :)
     * @param  {Number} no  Input number
     * @return {Number[]} Coordinates [x, y]
     */
    getOutputCoords(no) {
        const move =
            no === 1 ?
            utils.polToCart(this._angle, this._w / 2) :
            utils.polToCart(this._angle + Degrees._90, this._w / 2);
        return [this._x + move[0], this._y + move[1]];
    }
}
TwoWaySwitch.toStore = ["exec", "originalExec"];

export default TwoWaySwitch;