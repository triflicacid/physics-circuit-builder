/**
 * Template to all components
 *
 * @property _circuit       Parent Circuit
 * @property _renderSetup   Has the render stuff been set up?
 * @property _x             x position of the Cell
 * @property _y             y position of the Cell
 * @property _w             Width of the bounding box
 * @property _debug         Are we in debug mode?
 * @property _highlighted   Are we highlighted? (change colour)
 * @property _selected      Are we selected? (change colour & show info)
 * @property _lvl           "Depth" of the component
 * @property _outputCount   How many outputs are there?
 * @property _outputMax     How many outputs can this be connected to?
 * @property _outputs       Array of components that this is connected to (output)
 * @property _inputCount    How many inputs are there?
 * @property _inputMax      How many inputs can this be connected to?
 * @property _inputs        Array of components that this is connected to (input)
 *
 * @property resistance     Components' resistance
 *
 * @method setupRender(x, y)    Initiate position of the Cell and prepare for .render()
 * @method move(x, y)           Change coordinates of component
 * @method render(fn)           Render wrapper
 * @method contains(x, y)       Are the provided [x, y] inside this component?
 * @method select() / unselect() Toggle state of this._selected
 * @method highlight() / unhighlight() Toggle state of this._highlight
 * @method setResistance(r)     Set resistance
 * @method connect(component)   Attempt to connect this to a component
 * @method getInputCoords()     Coordinates to connect the input from.
 * @method getOutputCoords()    Coordinates to connect the output to.
 * @method getData()            Get data for this component
 */
class Component {
    constructor(parentCircuit) {
        this._circuit = parentCircuit;
        if (!(this._circuit instanceof Circuit)) throw new TypeError(`Cell: cannot resolve argument 'parentCircuit' to a Circuit instance`);

        this._renderSetup = false;
        this._x = 0;
        this._y = 0;
        this._w = 50;
        this._debug = false;
        this._highlighted = false;
        this._selected = false;
        this._lvl = 0;
        this._resistance = 0;

        // Input connections (reference only)
        this._inputCount = 0;
        this._inputMax = Infinity;
        this._inputs = [];

        // Output connections
        this._outputCount = 0;
        this._outputMax = Infinity;
        this._outputs = [];
    }

    get resistance() { return this._resistance; }
    set resistance(r) {
        if (typeof r !== 'number') return;
        if (r <= 0) r = 1;
        this._resistance = r;
    }

    /**
     * Set up the rendering of the cell
     * @param  {Number} x X coordinate of the Cell
     * @param  {Number} y Y coordinate of the Cell
     * @return {Cell}    Return this (chainable)
     */
    setupRender(x, y) {
        this._renderSetup = true;
        this.move(x, y, false);
        return this;
    }

    /**
     * Move position of component
     * @param {Number} x X coordinate of the Cell
     * @param {Number} y Y coordinate of the Cell
     * @return {Cell}    Return this (chainable
     */
    move(x, y) {
        let pad = this._w / 2;
        this._x = clamp(x, pad, this._circuit._width - pad);
        this._y = clamp(y, pad, this._circuit._height - pad);
        return this;
    }

    /**
     * Render wrapper
     * @param {Function} fn         Contains personalised rendering info
     *          fn(colour: Color)   Colour of everything
     */
    render(fn) {
        if (!this._renderSetup) throw new TypeError(`Cannot invoking render before setupRender`);
        const p = this._circuit._p5;

        // Sort out connections
        p.stroke(0);
        p.strokeWeight(1.5);
        for (let conn of this._outputs) {
            conn.render();
        }

        p.rectMode(p.CENTER);
        p.push();
        p.translate(this._x, this._y);

        if (this._debug) {
            // Center dot
            p.stroke(255, 0, 0);
            p.ellipse(0, 0, 2, 2);

            // Bounding box
            let colour = this._highlighted ? p.color(255, 170, 0) : p.color(255, 0, 255);
            p.stroke(colour);

            p.strokeWeight(1);
            p.noFill();
            p.rect(0, 0, this._w, this._w);
        }

        let colour = this._highlighted ? p.color(220, 100, 100) : p.color(0);
        fn(colour); // Other rendering shenanigans

        p.pop();
    }

    /**
     * Are the provided (x, y) coordinates inside this component?
     * @param  {Number} x X coordinate to test
     * @param  {Number} y Y coordinate to test
     * @return {Boolean}  Does this component contain the given coordinates?
     */
    contains(x, y) {
        let d = this._w / 2;
        return (x > this._x - d && x < this._x + d &&
            y > this._y - d && y < this._y + d);
    }

    select() {
        this._selected = true;
        this._highlighted = true;
    }
    unselect() {
        this._selected = false;
        this._highlighted = false;
    }

    highlight() {
        this._highlighted = true;
    }
    unhighlight() {
        this._highlighted = false;
    }

    /**
     * Set resistance of component
     * @param {Number} r The new resistance
     * @return {Component} Returns 'this' chainable)
     */
    setResistance(r) {
        this.resistance = r;
        return this;
    }

    /**
     * Attempt to connect this to a component
     * @param  {Component} component Component to connect
     * @param  {Number[][]} wirePath Path of point for the path
     * @return {Component}           Return 'this' (chainable)
     */
    connect(component, wirePath = []) {
        if (!(component instanceof Component)) throw new TypeError(`Cannot connect component to a non-component`);
        if (component === this) return;

        // Check that connections between these two doesn't already exist
        for (let conn of this._outputs) {
            if (conn instanceof Wire && conn._output == component) return;
        }

        // Create connection is possible
        if (this._outputCount < this._outputMax && component._inputCount < component._inputMax) {
            let wire = new Wire(this._circuit, this, component, wirePath);

            this._outputCount++;
            this._outputs.push(wire);

            component._inputs.push(wire);
            component._inputCount++;
        } else {
            console.warn(`Cannot connect component: too many connections.`, component, '->', this);
        }
        return this;
    }

    /**
     * Connect coordinates for inputs
     * - Should be overridden for each component, but here just in case :)
     * @return {Number[]} Coordinates [x, y]
     */
    getInputCoords() {
        return [this._x - (this._w / 2), this._y];
    }

    /**
     * Connect coordinates for outputs
     * - Should be overridden for each component, but here just in case :)
     * @return {Number[]} Coordinates [x, y]
     */
    getOutputCoords() {
        return [this._x + (this._w / 2), this._y];
    }

    /**
     * Get data for this component
     * @return {object} JSON data
     */
    getData() {
        let data = {
            type: this.constructor.name.toLowerCase(),
            pos: [this._x, this._y]
        };
        if (this.resistance !== 0) data.resistance = this.resistance;

        // Connections (only worry about outputs)
        if (this._outputs.length > 0) {
            data.conns = [];
            for (let i = 0; i < this._outputs.length; i++) {
                let conn = this._outputs[i];
                if (conn instanceof Wire) {
                    data.conns.push(conn.getData());
                }
            }
        }

        return data;
    }
}
