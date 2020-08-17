import * as utils from '../util/utils.js';
import {
    Control
} from './control.js';
import Circuit from './circuit.js';
import Component from './component.js';

/**
 * Wire - a connection between two components
 *
 * @property x1
 * @property y1
 * @property x2
 * @property y2
 * @property _debug                     Debug mode?
 * @property _path                      Extra points in the wire's path
 * @property _hasResistance             Does this wire have resistance?
 * @property _material                  Determines the wires resistance, when _hasResistance === true
 * @property _selected                  Are we selected (_over)?
 * @property _r                         Radius of cross-section of wire
 * @property (readonly) resistance      Get resistance of wire
 * @property (readonly) length          Get length of wire (px)
 * @property (readonly) material        Get materials name
 *
 * @method toString()       String representation of wire
 * @mathod volume()         Get volume of wire in cm or px
 * @method contains(x, y)   Are the provided coordinates on the wire?
 * @method select() / unselect()    Change value of this._selected
 * @method render()         Render the connection to the global canvas
 * @method remove()         Remove the connection
 * @method radiusPx()       Get / Set radius in px
 * @method radiusCm()       Get / Set radius in cm
 * @method onHandle(x, y)   Is the given (x, y) on a handle?
 * @method addHandle(x, y)  Add handle at (x, y)
 * @method insertComponent(c)   Insert component. If on wire, split it
 * @method getData()        Get data resembling this wire
 */
class Wire {
    /**
     * @param {Circuit}    parentCircuit Parent circuit object
     * @param {Component}  input         Input component (from)
     * @param {Component}  output        Output component (to)
     * @param {Number[][]} path          Array of coordinates of line path
     */
    constructor(parentCircuit, input, output, path = []) {
        this._circuit = parentCircuit;
        if (!(this._circuit instanceof Circuit)) throw new TypeError(`Cell: cannot resolve argument 'parentCircuit' to a Circuit instance`);

        this._input = input;
        if (!Control.isComponent(this._input)) throw new TypeError(`Wire: cannot resolve argument 'input' to a Component instance`);

        this._output = output;
        if (!Control.isComponent(this._output)) throw new TypeError(`Wire: cannot resolve argument 'output' to a Component instance`);

        this._path = path;
        this._debug = false;

        // Is path OK?
        if (!Array.isArray(this._path)) throw new TypeError(`Wire: invalid path: path must be array, got ${this._path}`);

        if (this._path.length !== 0) {
            for (let point of this._path) {
                if (!Array.isArray(point) || point.length !== 2) throw new TypeError(`Wire: invalid path: path must be array of number[2], got '${point}'`);
            }
        }

        this._hasResistance = false;
        this._material = Wire.MATERIALS_KEYS.indexOf("copper");
        this._selected = false;
        this._r = Wire.DEFAULT_RADIUS;
    }
    get p5() {
        return this._circuit._control._p5;
    }
    get control() {
        return this._circuit._control;
    }

    get x1() {
        return this._input.getOutputCoords()[0];
    }
    get y1() {
        return this._input.getOutputCoords()[1];
    }

    get x2() {
        return this._output.getInputCoords()[0];
    }
    get y2() {
        return this._output.getInputCoords()[1];
    }

    /**
     * Get materials name
     * @type {String}
     */
    get material() {
        return Wire.MATERIALS_KEYS[this._material];
    }

    /**
     * Get resistance of wire
     * - If _hasResistance, dependant upon material
     * @type {Number}
     */
    get resistance() {
        if (this._hasResistance) {
            const info = Wire.MATERIALS[this.material];
            let r = info.resistance;
            r = (r < 0) ? (r / this.volume(true)) : (r * this.volume(true));
            return r;
        } else {
            return 0;
        }
    }

    /**
     * Get length of wire in pixels
     * @type {Number}
     */
    get length() {
        let length = 0;

        if (this._path.length === 0) {
            length = utils.distance(...this._input.getOutputCoords(), ...this._output.getInputCoords());
        } else {
            const path = [
                this._input.getOutputCoords(),
                ...this._path,
                this._output.getInputCoords()
            ];

            for (let i = 0; i < path.length - 2; i++) {
                length += utils.distance(...path[i], ...path[i + 1]);
            }
        }
        return length;
    }

    /**
     * Strigng representation of wire
     * @return {String}
     */
    toString() {
        let str = 'Wire#' + this._input._id + ':' + this._output._id;
        if (this._hasResistance) str = nicifyString(this.material, '') + str;
        return str;
    }

    /**
     * Get volume of wire in cm
     * - volume of cylinder = π(r**2)h
     * @param  {Boolean} inCm   CM (true) or PX (false)?
     * @return {Number} Volume in PX or CM
     */
    volume(inCm = false) {
        const h = (inCm) ? (this.length / this.control.PIXELS_PER_CM) : this.length;
        const r = (inCm) ? (this._r / this.control.PIXELS_PER_CM) : this._r;
        return Math.PI * Math.pow(r, 2) * h;
    }

    /**
     * Are the provided (x, y) coordinates on this wire?
     * @param  {Number} x X coordinate to test
     * @param  {Number} y Y coordinate to test
     * @return {Boolean}
     */
    contains(x, y) {
        const delta = (this._hasResistance) ? (this._r / 2) : Wire.DEFAULT_RADIUS;

        let on = false;
        if (this._path.length === 0) {
            on = utils.isNearLine(this.x1, this.y1, this.x2, this.y2, x, y, delta);
            // console.log("ONE: ", on);
        } else {
            const p = [
                [this.x1, this.y1],
                ...this._path,
                [this.x2, this.y2]
            ];
            for (let i = 0; i <= p.length - 2; i++) {
                if (utils.isNearLine(...p[i], ...p[i + 1], x, y, delta)) {
                    on = true;
                    break;
                }
            }
            // console.log("MULTIPLE: ", on);
        }
        return on;
    }

    select() {
        this._selected = true;
    }
    unselect() {
        this._selected = false;
    }

    /**
     * Render the connection
     */
    render() {
        const p = this.p5;

        p.strokeWeight(this._hasResistance ? this._r / 2 : Wire.DEFAULT_RADIUS);

        if (this._selected) {
            p.stroke(200, 115, 80);
        } else if (this.control._mode === Control.NORMAL) {
            if (this._hasResistance) {
                const colour = Array.isArray(Wire.MATERIALS[this.material].colour[0]) ?
                    Wire.MATERIALS[this.material].colourSingle :
                    Wire.MATERIALS[this.material].colour;
                p.stroke(...colour);
            } else {
                p.stroke(1);
            }
        } else {
            p.stroke(170);
        }

        p.noFill();
        p.beginShape();

        let outputNo = this._input._outputs.indexOf(this);
        p.vertex(...this._input.getOutputCoords(outputNo));
        for (let coord of this._path) {
            p.vertex(...coord);
        }

        let inputNo = this._output._inputs.indexOf(this);
        p.vertex(...this._output.getInputCoords(inputNo));
        p.endShape();

        if (this._debug && this.control._mode === Control.NORMAL) {
            p.noStroke();
            p.fill(255, 100, 100);

            let i = 0;
            for (let coord of this._path) {
                p.ellipse(...coord, 5, 5);
                p.text(i, ...coord);
                i++;
            }
        }

        // If over a point...
        if (this.control._over === this) {
            const handle = this.onHandle(p.mouseX, p.mouseY);
            if (Array.isArray(handle)) {
                p.noStroke();
                p.fill(255, 170, 0);

                let d = Wire.HANDLE_RADIUS * 2;
                p.ellipse(...handle, d, d);
            }
        }
    }

    /**
     * Remove the connection
     */
    remove() {
        // Remove inputs' connection to output
        let index = this._input._outputs.indexOf(this);
        if (index !== -1) {
            this._input._outputs.splice(index, 1);
            this._input._outputCount--;
        }

        // Remove outputs' connection from input
        index = this._output._inputs.indexOf(this);
        if (index !== -1) {
            this._output._inputs.splice(index, 1);
            this._output._inputCount--;
        }

        // Remove from _circuit's wires array
        index = this._circuit.wires.indexOf(this);
        if (index !== -1) this._circuit.wires.splice(index, 1);

        // Remove from control's wires array
        index = this.control.wires.indexOf(this);
        if (index !== -1) this.control.wires.splice(index, 1);
    }

    /**
     * Get / Set radius of wire in px
     * @param  {Number} px   If present: value to set radius to
     * @return {Number} Radius in px
     */
    radiusPx(px = undefined) {
        if (typeof px === 'number') {
            this._r = utils.clamp(px, Wire.MIN_RADIUS, Wire.MAX_RADIUS);
        }
        return this._r;
    }

    /**
     * Get / Set radius of wire in cm
     * @param  {Number} cm   If present: value to set radius to
     * @return {Number} Radius in cm
     */
    radiusCm(cm = undefined) {
        if (typeof cm === 'number') {
            const px = cm * this.control.PIXELS_PER_CM;
            this._r = utils.clamp(px, Wire.MIN_RADIUS, Wire.MAX_RADIUS);
        }
        return this._r / this.control.PIXELS_PER_CM;
    }

    /**
     * Is the given (x, y) on a handle? (i.e. a certain radius from a point in the path)
     * @param  {Number} x    X coordinate
     * @param  {Number} y    y coordinate
     * @return {Number[]}    Return the handle's point
     */
    onHandle(x, y) {
        const r = Wire.HANDLE_RADIUS;
        for (let point of this._path) {
            let intersect = x > point[0] - r && x < point[0] + r && y > point[1] - r && y < point[1] + r;
            if (intersect) return point;
        }
        return null;
    }

    /**
     * Add a hanel at (x, y)
     * @param  {Number} x    X coordinate
     * @param  {Number} y    y coordinate
     * @return {Number}     At what index in _path was the point inserted at?
     */
    addHandle(x, y) {
        const point = [x, y];
        if (this._path.length === 0) {
            this._path.push(point);
            return 0;
        } else {
            // Find point at start of line on
            const p = [
                [this.x1, this.y1],
                ...this._path,
                [this.x2, this.y2]
            ];

            let iBefore = -1;
            const delta = (this._hasResistance) ? (this._r / 2) : Wire.DEFAULT_RADIUS;
            for (let i = 0; i <= p.length - 2; i++) {
                if (utils.isNearLine(...p[i], ...p[i + 1], x, y, delta)) {
                    iBefore = i;
                    break;
                }
            }

            if (iBefore === -1) {
                // Default to end
                this._path.push(point);
                return this._path.length - 1;
            } else {
                this._path.splice(iBefore, 0, point);
                return iBefore;
            }
        }
    }

    /**
     * Insert component only if on wire. If on wire, split the wire around component.
     * @param  {Component} component    Component to insert
     * @return {Boolean} Inserted the component?
     */
    insertComponent(component) {
        const pos = [component._x, component._y];

        // If we contain the position...
        if (this.contains(...pos)) {
            const p = [
                [this.x1, this.y1],
                ...this._path,
                [this.x2, this.y2]
            ];

            // Contain node directly before the split should be
            let nodeBeforeSplitPos = -1;
            const delta = (this._hasResistance) ? (this._r / 2) : Wire.DEFAULT_RADIUS;
            for (let i = 0; i <= p.length - 2; i++) {
                if (utils.isNearLine(...p[i], ...p[i + 1], ...pos, delta)) {
                    nodeBeforeSplitPos = i - 1;
                    break;
                }
            }

            const pathBefore = this._path.slice(0, nodeBeforeSplitPos + 1);
            const pathAfter = this._path.slice(nodeBeforeSplitPos + 1);
            console.log(pathBefore, pathAfter);

            const componentBefore = this._input;
            const componentAfter = this._output;
            this.remove();

            componentBefore.connectTo(component, pathBefore);
            component.connectTo(componentAfter, pathAfter);
        }

        return false;
    }

    /**
     * Return data representation of this object
     *  {
     *    index,    // Index of the component we are connecting to (in circuit.connections)
     *    path      // Array of coordinate arrays of path (if line: empty)
     *  }
     * @return {object} data
     */
    getData() {
        let component = this._output;
        let index = this.control.components.indexOf(component);

        let path = this._path;
        return {
            index,
            path,
            hasRes: this._hasResistance,
            material: this._material,
            r: this._r
        };
    }
}

// ALl porrible materials. Also included in Circuit.MaterialContainer
Wire.MATERIALS = {
    // Material: { resistance (ohms per metre), colour }
    aluminium: {
        resistance: 2.82e-8,
        colour: [132, 135, 137]
    },
    antimony: {
        resistance: 3.90e-7,
        colour: [76, 79, 77]
    },
    bismuth: {
        resistance: 1.30e-6,
        colour: [
            [154, 155, 166],
            [138, 45, 100],
            [239, 186, 59],
            [255, 146, 147],
            [19, 1, 8]
        ],
        colourSingle: [154, 155, 156]
    },
    brass: {
        resistance: 0.75e-7,
        colour: [181, 166, 66]
    },
    cadmium: {
        resistance: 6e-8,
        colour: [124, 124, 128]
    },
    carbon_steel: {
        resistance: 1010,
        colour: [95, 96, 98]
    },
    cobalt: {
        resistance: 5.60e-8,
        colour: [0, 71, 171]
    },
    constantan: {
        resistance: 4.9e-7,
        colour: [214, 216, 219]
    },
    copper: {
        resistance: 1.68e-8,
        colour: [184, 115, 51]
    },
    germanium: {
        resistance: 4.60e-1,
        colour: [193, 194, 198]
    },
    gold: {
        resistance: 2.44e-8,
        colour: [212, 175, 55]
    },
    iron: {
        resistance: 1.0e-7,
        colour: [203, 205, 205]
    },
    lead: {
        resistance: 2.2e-7,
        colour: [76, 76, 76]
    },
    manganin: {
        resistance: 4.20e-7,
        colour: [142, 74, 43]
    },
    nichrome: {
        resistance: 1.10e-6,
        colour: [182, 180, 186]
    },
    nickel: {
        resistance: 6.99e-8,
        colour: [181, 182, 181]
    },
    palladium: {
        resistance: 1e-7,
        colour: [195, 198, 192]
    },
    platinum: {
        resistance: 1.06e-7,
        colour: [229, 228, 226]
    },
    silicon: {
        resistance: 6.40e2,
        colour: [68, 68, 68]
    },
    silver: {
        resistance: 1.56e-8,
        colour: [192, 192, 192]
    },
    stainless_steel: {
        resistance: 6.9e-7,
        colour: [67, 70, 75]
    },
    tantalum: {
        resistance: 1.30e-7,
        colour: [77, 77, 80]
    },
    tin: {
        resistance: 1.09e-7,
        colour: [211, 212, 213]
    },
    titanium: {
        resistance: 4.20e-7,
        colour: [135, 134, 129]
    },
    tungsten: {
        resistance: 5.60e-8,
        colour: [118, 121, 128]
    },
    zinc: {
        resistance: 5.90e-8,
        colour: [186, 196, 200]
    },
};
Wire.MATERIALS_KEYS = Object.keys(Wire.MATERIALS);

Wire.DEFAULT_RADIUS = 1.5;
Wire.MIN_RADIUS = 0.4;
Wire.MAX_RADIUS = 15;
Wire.HANDLE_RADIUS = 4;

export default Wire;