/**
 * Wire - a connection between two components
 *
 * @property x1
 * @property y1
 * @property x2
 * @property y2
 * @property _debug     Debug mode
 * @property _path      Extra points in the wire's path
 * @property _handleRadius  Radius of handle points
 *
 * @method contains(x, y)   Are the provided coordinates on the wire?
 * @method render()         Render the connection to the global canvas
 * @method remove()         Remove the connection
 * @method onHandle(x, y)   Is the given (x, y) on a handle?
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
        if (!(this._input instanceof Component)) throw new TypeError(`Wire: cannot resolve argument 'input' to a Component instance`);

        this._output = output;
        if (!(this._output instanceof Component)) throw new TypeError(`Wire: cannot resolve argument 'output' to a Component instance`);

        this._path = path;
        this._debug = false;
        this._handleRadius = 3;
        this._circuit.wires.push(this);
    }

    get x1() { return this._input.getOutputCoords()[0]; }
    get y1() { return this._input.getOutputCoords()[1]; }

    get x2() { return this._output.getInputCoords()[0]; }
    get y2() { return this._output.getInputCoords()[1]; }

    /**
     * Are the provided (x, y) coordinates on this wire?
     * @param  {Number} x X coordinate to test
     * @param  {Number} y Y coordinate to test
     * @return {Boolean}
     */
    contains(x, y) {
        return isOnLine(this.x1, this.y1, this.x2, this.y2, x, y);
    }

    /**
     * Render the connection
     */
    render() {
        const p = this._circuit._p5;

        p.strokeWeight(1.5);
        p.stroke(0);
        p.noFill();
        p.beginShape();
        p.vertex(...this._input.getOutputCoords());
        for (let coord of this._path) {
            p.vertex(...coord);
        }
        p.vertex(...this._output.getInputCoords());
        p.endShape();

        if (this._debug) {
            p.ellipseMode(p.CENTER);
            p.noStroke();
            p.fill(255, 100, 100);

            for (let coord of this._path) {
                p.ellipse(...coord, 5, 5);
            }
        }

        if (this._circuit._selected == this) {
            p.ellipseMode(p.CENTER);
            p.noStroke();
            p.fill(255, 170, 0);

            let d = this._handleRadius * 2;
            p.ellipse(...this._circuit._dragPoint, d, d);
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
    }

    /**
     * Is the given (x, y) on a handle? (i.e. a certain radius from a point in the path)
     * @param  {Number} x    X coordinate
     * @param  {Number} y    y coordinate
     * @return {Number[]}    Return the handle's point
     */
    onHandle(x, y) {
        const r = this._handleRadius;
        for (let point of this._path) {
            let intersect = x > point[0] - r && x < point[0] + r && y > point[1] - r && y < point[1] + r;
            if (intersect) return point;
        }
        return null;
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
        let index = this._circuit.components.indexOf(component);

        let path = this._path;
        return { index, path };
    }
}
