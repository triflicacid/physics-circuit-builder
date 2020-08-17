/**
 * Object for managing a circuit - components, wires etc...
 *
 * @property _selected          Selected component (on canvas)
 * @property _isDragging        Are we dragging the selected component?
 * @property _isCreatingWire    Are we creating a connection from _selected?
 * @property _wirePath          Array of soordinates - path of wire if created
 * @property _dragPoint         Which poijt is being dragged (wire manipulation)
 * @property _over              Seomtimes contains the component our mouse is over (e.g. when creating wire)
 * @property _sketch            Contains sketch function for P5
 * @property _p5                Contains p5 object
 * @property _width             Width of canvas (alias of this._circuit._p5.width)
 * @property _height            Height of canvas (alias of this._circuit._p5.height)
 * @property _canvas            Canvas element
 *
 * @property (readonly) canvas  Return camvas element
 * @property components         Array of components
 * @property wires              Array of all Wire objects (aka connections)
 * @property (readonly) size     How many components are there?
 * @property (readonly) lastComponent  The last component (or latest added)
 *
 * @method setup(...)           Get ready to draw
 * @method go()                 Start drawing (only callable after this.setup())
 * @method createComponent(name, x, y)  Create a <name> component at (x, y)
 * @method select(x, y)                 Select component at (x, y)
 * @method render()         Renders all components in this.components array
 * @method forEach(fn: component, index)     Loop through all components
 * @method getData()             Return circuit as a data structure
 * @method stop()                Close and remove all traces of this circuit
 */
class Circuit {
    constructor() {
        this.components = [];
        this.wires = [];

        this._selected = null;
        this._isDragging = false;
        this._isCreatingWire = false;
        this._wirePath = [];
        this._over = null;

        this._sketch = null;
        this._p5 = null;
        this._width = -1;
        this._height = -1;
        this._canvas = null;
    }

    /*      READONLY PROPERTIES */
    get size() { return this.components.length; }
    get canvas() { return this._canvas.elt; }
    get lastComponent() { return this.components[this.components.length - 1]; }

    /**
     * Prepare for drawing
     * @param  {String}   id    ID of the HTMLElement parent of canvas
     * @param  {Number}   w     Width of the canvas
     * @param  {Number}   h     Height of the canvas
     * @param  {Function} setup Extra setup shenanigans
     *          setup: fn(namespace, circuit)
     * @param  {Function} draw  Extra draw shenanigans
     *           draw: fn(namespace, circuit)
     * @return {Function}      Function to begin drawing
     */
    setup(id, w, h, setup, draw) {
        let e = document.getElementById(id);
        if (!(e instanceof HTMLElement)) throw new TypeError(`Cannot resolve provided ID to an HTMLElement`);

        document.body.setAttribute('oncontextmenu', 'return false;');

        this._width = w;
        this._height = h;

        const circuit = this;
        this._sketch = function(ns) {
            ns.setup = function() {
                circuit._canvas = ns.createCanvas(w, h);
                circuit._canvas.parent(id)
                    .style('border', '1px solid black')
                    .doubleClicked(function() {
                        circuit._selected = circuit.select(ns.mouseX, ns.mouseY);
                        circuit._isDragging = true;
                    });

                if (typeof setup === 'function') setup(ns, circuit);
            };

            ns.draw = function() {
                ns.background(255);

                // Draw line from selected component to (x, y)
                if (circuit._selected instanceof Component && circuit._isCreatingWire) {
                    ns.stroke(150, 0, 0);
                    ns.strokeWeight(1.5);

                    ns.beginShape();
                    ns.vertex(...circuit._selected.getOutputCoords());
                    for (let coord of circuit._wirePath) {
                        ns.vertex(...coord);
                    }
                    ns.vertex(ns.mouseX, ns.mouseY);
                    ns.endShape();
                }

                circuit.render();
                if (typeof draw === 'function') draw(ns, circuit);
            };

            // When mouse if pressed - is a component selected?
            ns.mousePressed = function() {
                if (ns.mouseButton === ns.LEFT) {
                    // Check if click on wire handle
                    for (let wire of circuit.wires) {
                        let on = wire.onHandle(ns.mouseX, ns.mouseY);
                        if (on != null) {
                            circuit._selected = wire;
                            circuit._dragPoint = on;
                            return;
                        }
                    }

                    // Check if clicking on wire...
                    // for (let wire of circuit.wires) {
                    //     if (wire.contains(ns.mouseX, ns.mouseY)) {
                    //         wire.remove();
                    //         return;
                    //     }
                    // }

                    // ELse, check for selected component
                    let lastSelected = circuit._selected;
                    circuit._selected = circuit.select(ns.mouseX, ns.mouseY);

                    // If new one selected and there's an old one and creating wire...
                    if (circuit._selected instanceof Component) {
                        if (lastSelected instanceof Component && circuit._isCreatingWire) {
                            if (circuit._isCreatingWire) {
                                lastSelected.connect(circuit._selected, circuit._wirePath);
                                circuit._isCreatingWire = false;
                                circuit._selected.unselect();
                                circuit._selected = null;
                                circuit._wirePath = [];
                            }
                        } else {
                            // If selected, start creating wire
                            circuit._isCreatingWire = true;
                            circuit._wirePath = [];
                        }
                    } else {
                        // Clear everything
                        circuit._selected = null;
                        circuit._isDragging = circuit._isCreatingWire = false;
                        circuit._wirePath = [];
                    }
                }

                // If press right and creating wire...
                else if (ns.mouseButton === ns.RIGHT && circuit._isCreatingWire) {
                    circuit._wirePath.push([ns.mouseX, ns.mouseY]);
                }
            };

            // When the mouse is dragged - is a component being dragged?
            ns.mouseDragged = function() {
                if (circuit._selected instanceof Component) {
                    // If dragging, move component...
                    if (circuit._isDragging) {
                        circuit._isCreatingWire = false;
                        circuit._selected.move(ns.mouseX, ns.mouseY);
                    }
                } else if (circuit._selected instanceof Wire && Array.isArray(circuit._dragPoint)) {
                    // Dragging wire point
                    let pad = circuit._selected._handleRadius * 3;
                    let x = clamp(ns.mouseX, pad, ns.width - pad);
                    let y = clamp(ns.mouseY, pad, ns.height - pad);
                    circuit._dragPoint[0] = x;
                    circuit._dragPoint[1] = y;
                }
            };

            ns.mouseMoved = function() {
                // Highlight any components we are over
                for (let component of circuit.components) {
                    if (component === circuit._selected) continue;
                    if (component.contains(ns.mouseX, ns.mouseY)) {
                        component.select();
                    } else {
                        component.unselect();
                    }
                }
            };

            ns.mouseReleased = function() {
                // Stop dragging
                if (circuit._selected instanceof Component && circuit._isDragging) {
                    circuit._selected.unselect();
                    circuit._selected = null;
                    circuit._isDragging = false;
                } else if (circuit._selected instanceof Wire) {
                    circuit._selected = null;
                    circuit._dragPoint = null;
                }
            };
        };

        return {
            draw: function() {
                circuit._p5 = new p5(circuit._sketch);
                return circuit;
            }
        };
    }

    render() {
        this.components.forEach(c => {
            if (typeof c.render === 'function') c.render();
        });

        // this.wires.forEach(w => {
        //     if (typeof w.render === 'function') w.render();
        // });
    }

    /**
     * Creates a component of <name> at (x, y)
     * @param  {String} name    Type of the component
     * @param  {Number} x       X coordinate of the component
     * @param  {Number} y       Y coordinate of the component
     * @return {Component}      Return the newly created component
     */
    createComponent(name, x, y) {
        if (typeof name !== 'string') name = name.toString();

        let component;
        switch (name.toLowerCase()) {
            case Circuit.CELL:
                component = new Cell(this);
                break;
            case Circuit.BULB:
                component = new Bulb(this);
                break;
            default:
                throw new TypeError(`Cannot resolve name '${name}' to a component`);
        }

        component.setupRender(x, y);
        this.components.push(component);
        return component;
    }

    /**
     * Select a component at given (x, y)
     * @param  {Number} x Target x coordinate
     * @param  {Number} y Target y coordinate
     * @return {Component}   Selected component or null
     */
    select(x, y) {
        for (let component of this.components) {
            if (component.contains(x, y)) {
                component.select();
                return component;
            }
        }
        return null;
    }

    /**
     * Loop through all components
     * @param {Function} fn
     *  fn -> (Component component, Number index)
     */
    forEach(fn) {
        this.components.forEach(fn);
    }

    /**
     * Get this as a data representation
     * @return {object} Data output
     */
    getData() {
        let data = {
            width: this._p5.width,
            height: this._p5.height,
            components: []
        };

        for (let component of this.components) {
            if (typeof component.getData === 'function') {
                let cdata = component.getData();
                data.components.push(cdata);
            }
        }

        return data;
    }

    /**
     * Close and remove all traces of this circuit
     * @return {Circuit} Returns this (chainable)
     */
    stop() {
        this._p5.remove();

        // Delete all unique properties
        for (let prop in this) {
            if (this.hasOwnProperty(prop)) {
                delete this[prop];
            }
        }

        return this;
    }
}

// Types of components
Circuit.CELL = 'cell';
Circuit.BULB = 'bulb';

// Ohm symbol
Circuit.OHM = 'Ω';

// Text size for volta e etc...
Circuit.SMALL_TEXT = 9;
