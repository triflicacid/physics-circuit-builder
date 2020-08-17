// import * as utils from '../../util/utils.js';
import Component from '../component.js';
import Cell from './Cell.js';
import Sounds from '../../sounds/index.js';

/**
 * Collection of cells
 * @extends Circuit
 *
 * @property _cells         Number of cells
 * @property _cellVoltage   Voltage of each cell
 * @property _cellWidth     WIdth of every cell
 * @property _dir           Direction of cells
 * @property voltage        Set voltage of every cell
 *
 * @method render()          Render the cell onto the global p5 sketch
 * @method eval()               Evaluate the component
 * @method flip()            Flip direction of battery (each cell)
 * @method addCell()         Add another cell
 */
class Battery extends Component {
    constructor(parentCircuit) {
        super(parentCircuit);
        this._cells = 1;
        this._cellVoltage = Cell.defaultVoltage;
        this._maxCurrent = Infinity;
        this._cellWidth = this._w;
        this._dir = Cell.LEFT;
    }

    get resistance() {
        return 0;
    }

    /**
     * Calculate output current of battery
     * I = V / R
     * @return {Number} Current output
     */
    get current() {
        const current = this._circuit.current;
        return current > this.maxCurrent ? this.maxCurrent : current;
    }

    /*      PUBLIC PROPERTIES   */
    get voltage() {
        const v = this._cellVoltage * this._cells;
        return this._dir === Cell.RIGHT ? -v : v;
    }
    set voltage(v) {
        if (typeof v !== "number")
            throw new TypeError(
                `Cell.voltage: expected voltage to be number`
            );
        if (v <= 0) v = 1;
        this._cellVoltage = v;
    }

    /**
     * Evaluate the Battery
     */
    eval() {
        super.eval(() => {
            if (this._circuit._depth !== 0)
                throw new Error(
                    `Battery component must be in top-level circuit`
                );
        });
    }

    render() {
        const isOn = this.isOn();

        super.render((p, colour, running) => {
            let x = -((this._cells / 2) * this._cellWidth);
            // x += this._cellWidth / 2;

            for (let i = 0; i < this._cells; i++) {
                this._renderCell(x, p, colour);
                x += this._cellWidth + 4;
            }

            // Plus sign (next to line)
            if (running && isOn) {
                p.noStroke();
                p.fill(255, 0, 0);
                p.textSize(Component.SMALL_TEXT * 1.5);
                if (this._dir === Cell.RIGHT) {
                    p.text("+", this._w / 2 + 2, -this._h / 4);
                } else {
                    p.text("+", -this._w / 2 - 13, -this._h / 4);
                }
            }

            // Box around everything
            p.strokeWeight(1);
            p.stroke(colour);
            p.noFill();
            p.rect(0, 0, this._w, this._h);

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
                const v = +this.voltage.toFixed(1);
                p.text(v + "V", 0, this._h / 1.9 + h);

                p.textAlign(p.LEFT, p.LEFT);
            }
        });
    }

    /**
     * Render an individual cell
     * @param  {Number} x             X coordinate to translate to
     * @param  {any} p                P5 namespace
     * @param  {color} colour         Colour of components
     */
    _renderCell(x, p, colour) {
        p.push();
        p.translate(x, 0);

        // Line
        let offset = 4;
        p.stroke(colour);
        p.strokeWeight(2);
        let h = this._h / 2.5;
        if (this._dir === Cell.RIGHT) {
            p.line(offset, -h, offset, h);
        } else {
            p.line(-offset, -h, -offset, h);
        }

        // Rectangle
        offset = 5;
        p.noStroke();
        p.fill(colour);
        if (this._dir === Cell.RIGHT) {
            p.rect(-6, 0, -offset, h);
        } else {
            p.rect(6, 0, offset, h);
        }

        p.pop();
    }

    /**
     * Flip direction of cell
     * @param  {Boolean} playSound Should we play the toggle sound?
     * @return {Number}     New direction
     */
    flip(playSound = false) {
        this._dir = this._dir === Cell.LEFT ? Cell.RIGHT : Cell.LEFT;
        this._circuit.unlockAllDiodes();
        if (playSound) {
            Sounds.Play(
                "toggle-" + (this._dir === Cell.RIGHT ? "off" : "on")
            );
        }
        this.control.updateLightLevel();
        return this._dir;
    }

    /**
     * Add another cell(s) to the mix
     * @param  {Number} [count=1]   How many cells to add?
     * @return {Battery} this (chainable)
     */
    addCell(count = 1) {
        for (let i = 0; i < count; i++) {
            this._cells++;
            this._cellWidth /= 1.5;
            this._w += this._cellWidth / 2;
        }
    }
}

Battery.toStore = ["dir", "voltage", "cells"];
Battery.config = [{
        field: "dir",
        name: "Dir",
        type: "dir"
    },
    {
        field: "cells",
        name: "Cells",
        type: "number",
        min: 1,
        max: 10
    },
];

export default Battery;