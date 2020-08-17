/**
 * Wrapper for controlling a circuit
 *
 * @property _circuit           The topmost Circuit object
 * @property _file              Which file is this loaded from?
 * @property _selected          Selected component (on canvas)
 * @property _isDragging        Are we dragging the selected component?
 * @property _isCreatingWire    Are we creating a connection from _selected?
 * @property _wirePath          Array of soordinates - path of wire if created
 * @property _dragPoint         Which poijt is being dragged (wire manipulation)
 * @property _sketch            Contains sketch function for P5
 * @property _p5                Contains p5 object
 * @property _fps               Frames per second
 * @property _width             Width of canvas (alias of this._circuit._p5.width)
 * @property _height            Height of canvas (alias of this._circuit._p5.height)
 * @property _container         Container element
 * @property _canvas            Canvas element
 * @property _showInfo          Show extra info (green boxes)?
 * @property _componentShowingInfo  Which component is showing info in the table?
 * @property state              State of the Control
 * @property components         Array of all components
 * @property wires              Array of all wires
 * @property _running           Is this circuit running?
 *
 * @method getData()            Get circuit data
 * @method load(file)           Load circuit from file
 * @method save(?file)          Saves the circuits data to a file. Default: current file
 * @method terminate(fn)        Terminate the cirucit
 *
 * @method setup(...)           Get ready to draw (prepare P5 instance). To initiate, call '.draw()' on result
 * @method createComponent(name, x, y)  Create a <name> component at (x, y)
 * @method frameRate(rate)      Set frame rate of p5
 * @method select(x, y)                 Select component at (x, y)
 * @method render()         Renders all components in this.components array
 * @method forEach(fn: component, index)     Loop through all components
 * @method forEachWire(fn: component, index) Loop through all wires
 * @method showDebugInfo(component)          Show info inside debug table
 * @method eval()               Evaluate the circuit
 * @method stopEval()           Stop evaluating the circuit (only needed visually)
 * @method connectAll()         Connect all components in top-level circuit. DEBUG only
 *
 * @static isComponent(x)       Is provided value a component?
 */
class Control {
    constructor() {
        this._file = null;
        this._circuit = null;
        this.state = 'ready';

        this.components = [];
        this.wires = [];

        // Drawing / Rendering managment variables
        this._selected = null;
        this._isDragging = false;
        this._isCreatingWire = false;
        this._wirePath = [];
        this._dragPoint = null;

        this._sketch = null;
        this._p5 = null;
        this._width = -1;
        this._height = -1;
        this._canvas = null;
        this._container = null;
        this._showInfo = true;
        this._running = false;
        this._fps = Control._defaultFPS;
    }

    /**
     * Get this._circuit's data
     * @return {String} JSON data
     */
    getData() {
        let data = this._circuit.getData();
        return JSON.stringify(data, false, '  ');
    }

    /**
     * Load circuit from a file
     * @param  {String} file The data file (.json)
     * @param  {Function} setupFn    Additional stuff to complete on setup
     *      fn: setup(ns, circuit)
     * @param  {Function} drawFn    Additional stuff to complete on draw
     *      fn: draw(ns, circuit)
     * @return {Promise}
     */
    async load(file, setupFn, drawFn) {
        // return new Promise((resolve, reject) => {
        return await Server.getFile(file, true)
            .then(json => {
                this._file = file;

                // Setup function
                const _setup = function(ns, circuit) {
                    for (let component of json.components) {
                        let c = circuit.createComponent(component.type, +component.pos[0], +component.pos[1]);

                        if (component.type === 'cell' && typeof component.voltage === 'number') c.setVoltage(component.voltage);
                        if (component.type === 'bulb' && typeof component.maxV === 'number') c.maxVoltage = component.maxV;
                        if (component.type === 'bulb' && typeof component.resistance === 'number') c.setResistance(component.resistance);
                    }

                    // conns: connections. Array of indexes
                    for (let i = 0; i < circuit.components.length; i++) {
                        let component = circuit.components[i];
                        let def = json.components[i];
                        if (Array.isArray(def.conns)) {
                            for (let conn of def.conns) {
                                let other = circuit.components[conn.index];
                                component.connect(other, conn.path);
                            }
                        }
                    }

                    if (typeof setupFn === 'function') setupFn(ns, circuit);
                };

                // NB: 'this' refers to the Control object
                this._circuit = new Circuit();
                this._circuit.setup('container', +json.width, +json.height, _setup, drawFn)
                    .draw();

                this.state = 'running';
                return this;
            })
            .catch(e => {
                if (e === 'E404') throw new TypeError(`Cannot resolve name '${file}' to a file`);
                if (e === 'E401') throw new TypeError(`Incorrect permissions to access file '${file}'`);
                throw `Cannot access file '${file}': ${e}`;
            });
    }

    /**
     * Save this.getData() to a file
     * @param  {String} file    File to save to (Default: this._file)
     * @return {Promise}
     */
    async save(file = this._file) {
        if (file !== this._file) {
            // Create file
            await Server.createFile(file + '.json');
        }

        let data = this.getData();
        return await Server.putFile(file + '.json', data);
    }

    /**
     * Terminate the circuit and p5 sketch
     * @param {Function} fn     Any other things? (like a callback)
     * @return {Control} Return this (chainable)
     */
    terminate(fn) {
        this._p5.remove(); // Remove P5 sketch

        // Delete all unique properties of top-level circuit
        for (let prop in this._circuit) {
            if (this._circuit.hasOwnProperty(prop)) {
                delete this._circuit[prop];
            }
        }

        if (typeof fn === 'function') fn(this);

        // Remove all unique properties
        for (let prop in this) {
            if (this.hasOwnProperty(prop)) {
                delete this[prop];
            }
        }

        this.state = 'terminated';

        return this;
    }

    /**
     * Prepare for drawing
     * @param  {String}   id    ID of the HTMLElement parent of canvas
     * @param  {Number}   w     Width of the canvas
     * @param  {Number}   h     Height of the canvas
     * @param  {Function} setup Extra setup shenanigans
     *          setup: fn(namespace, control)
     * @param  {Function} draw  Extra draw shenanigans
     *           draw: fn(namespace, control)
     * @return {Function}      Function to begin drawing
     */
    setup(id, w, h, setup, draw) {
        let e = document.getElementById(id);
        if (!(e instanceof HTMLElement)) throw new TypeError(`Cannot resolve provided ID to an HTMLElement`);
        this._container = e;

        document.body.setAttribute('oncontextmenu', 'return false;');

        this._width = w;
        this._height = h;
        this._circuit = new Circuit(this);

        const control = this;
        this._sketch = function(ns) {
            ns.setup = function() {
                control._canvas = ns.createCanvas(w, h);
                control._canvas.parent(id)
                    .style('border', '1px solid black')
                    .doubleClicked(function() {
                        control._selected = control.select(ns.mouseX, ns.mouseY);
                        control._isDragging = true;
                    });

                ns.frameRate(control._fps);

                control._container.insertAdjacentHTML('beforeEnd', `<div id='debug_info'><table><tr><td><table border='1' style='border-collapse: collapse;'><tr><th colspan='10'>Component Info</th></tr><tr><th>Type</th><td id='c-type'>-</td></tr><tr><th>Resistance</th><td><span id='c-resistance'></span>${Circuit.OHM}</td></tr><tr><th><abbr title='Voltage across component'>Voltage</abbr></th><td><span id='c-voltage'></span>V</td></tr><tr><th><abbr title='Current across component'>Current</abbr></th><td><span id='c-current'></span>A</td></tr><tr><th><abbr title='Maximum current this component can handle'>Max Current</abbr></th><td><span id='c-maxCurrent'></span>A</td></tr><tr><th><abbr title='Power consumption of component. 1 watt = 1 joule per second'>Power</abbr></th><td><span id='c-power'></span> W</td></tr></table></td><td><table border='1' style='border-collapse: collapse;'><thead><tr><th colspan='10'>Additional Info</th></tr></thead><tbody id='c-other'></tbody></table></td><td><table border='1' style='border-collapse: collapse;'><tr><th colspan='10'>Parent Circuit</th></tr><tr><th>Depth</th><td id='cr-depth'></td></tr><tr><th>Components</th><td id='cr-components'></td></tr><tr><th>Is Broken?</th><td id='cr-broken'></td></tr><tr><th>Voltage</th><td><span id='cr-voltage'></span> V</td></tr><tr><th>Resistance</th><td><span id='cr-resistance'></span> ${Circuit.OHM}</td></tr><tr><th>Current</th><td><span id='cr-current'></span> A</td></tr><tr><th>Power</th><td><span id='cr-power'></span> W</td></tr><tr><td colspan='10'><center id='cr-log'></center></td></tr></table></td></div>`);

                ns.rectMode(ns.CENTER);
                ns.ellipseMode(ns.CENTER);

                if (typeof setup === 'function') setup(ns, control);
            };

            ns.draw = function() {
                ns.background(255);

                // Draw line from selected component to (x, y)
                if (Control.isComponent(control._selected) && control._isCreatingWire) {
                    ns.stroke(150, 0, 0);
                    ns.strokeWeight(1.5);

                    ns.beginShape();
                    ns.vertex(...control._selected.getOutputCoords());
                    for (let coord of control._wirePath) {
                        ns.vertex(...coord);
                    }
                    ns.vertex(ns.mouseX, ns.mouseY);
                    ns.endShape();
                }

                control.render();
                if (typeof draw === 'function') draw(ns, control);
            };

            // When mouse if pressed - is a component selected?
            ns.mousePressed = function() {
                if (ns.mouseButton === ns.LEFT) {
                    // Check if click on wire handle
                    for (let wire of control.wires) {
                        let on = wire.onHandle(ns.mouseX, ns.mouseY);
                        if (on != null) {
                            control._selected = wire;
                            control._dragPoint = on;
                            return;
                        }
                    }

                    // Check if clicking on wire...
                    // for (let wire of control.wires) {
                    //     if (wire.contains(ns.mouseX, ns.mouseY)) {
                    //         wire.remove();
                    //         return;
                    //     }
                    // }

                    // ELse, check for selected component
                    let lastSelected = control._selected;
                    control._selected = control.select(ns.mouseX, ns.mouseY);

                    // If new one selected and there's an old one and creating wire...
                    if (Control.isComponent(control._selected)) {
                        if (Control.isComponent(lastSelected) && control._isCreatingWire) {
                            if (control._isCreatingWire) {
                                lastSelected.connectTo(control._selected, control._wirePath);
                                control._isCreatingWire = false;
                                control._selected.unselect();
                                control._selected = null;
                                control._wirePath = [];
                            }
                        } else {
                            // If selected, start creating wire
                            control._isCreatingWire = true;
                            control._wirePath = [];
                        }
                    } else {
                        // Clear everything
                        control._selected = null;
                        control._isDragging = control._isCreatingWire = false;
                        control._wirePath = [];
                    }
                } else if (ns.mouseButton === ns.RIGHT) {
                    // If press right and creating wire...
                    if (control._isCreatingWire) {
                        control._wirePath.push([ns.mouseX, ns.mouseY]);
                        return;
                    }

                    // Right clicking has some special actions on certain components
                    for (let component of control.components) {
                        // Toggle switch/buzzer.
                        if ((component instanceof Circuit.Switch ||
                                component instanceof Circuit.Buzzer) && component.contains(ns.mouseX, ns.mouseY)) {
                            component.toggle();
                            break;
                        }

                        // Flip cell/battery/diode
                        if ((component instanceof Circuit.Cell ||
                                component instanceof Circuit.Battery ||
                                component instanceof Circuit.Diode) && component.contains(ns.mouseX, ns.mouseY)) {
                            component.flip();
                            break;
                        }
                    }
                }
            };

            // When the mouse is dragged - is a component being dragged?
            ns.mouseDragged = function() {
                if (Control.isComponent(control._selected)) {
                    // If dragging, move component...
                    if (control._isDragging) {
                        document.body.style.cursor = 'move';
                        control._isCreatingWire = false;
                        control._selected.move(ns.mouseX, ns.mouseY);
                    }
                } else if (control._selected instanceof Circuit.Wire && Array.isArray(control._dragPoint)) {
                    // Dragging wire point
                    let pad = control._selected._handleRadius * 3;
                    let x = clamp(ns.mouseX, pad, ns.width - pad);
                    let y = clamp(ns.mouseY, pad, ns.height - pad);
                    control._dragPoint[0] = x;
                    control._dragPoint[1] = y;
                    document.body.style.cursor = 'move';
                } else {
                    document.body.style.cursor = 'default';
                }
            };

            ns.mouseMoved = function() {
                // Highlight any components we are over
                for (let component of control.components) {
                    if (component === control._selected) continue;
                    if (component.contains(ns.mouseX, ns.mouseY)) {
                        component.select();
                        control.showDebugInfo(null);
                        control.showDebugInfo(component);
                        break;
                    } else {
                        component.unselect();
                    }
                }
            };

            ns.mouseReleased = function() {
                // Stop dragging
                document.body.style.cursor = 'default';
                if (Control.isComponent(control._selected) && control._isDragging) {
                    control._selected.unselect();
                    control._selected = null;
                    control._isDragging = false;
                } else if (control._selected instanceof Circuit.Wire) {
                    control._selected = null;
                    control._dragPoint = null;
                }
            };
        };

        // Return function to start drawing
        return {
            draw: function(fn) {
                if (typeof fn === 'function') fn(control);
                control._p5 = new p5(control._sketch);
                return control;
            }
        };
    }

    /**
     * Creates a component of <name> at (x, y)
     * - Inserted into top-level circuit
     * @param  {String} name    Type of the component
     * @param  {Number} x       X coordinate of the component
     * @param  {Number} y       Y coordinate of the component
     * @return {Component}      Return the newly created component
     */
    createComponent(name, x, y) {
        if (typeof name !== 'function') throw new TypeError(`createComponent: expected 'Function', got '${typeof name}'`);

        let component = new name(this._circuit);

        // Check if instanceof Component
        if (!Control.isComponent(component)) throw new TypeError(`createComponent: cannot trace arg 'name' to a Component constructor`);

        component.setupRender(x, y);
        this.components.push(component);
        return component;
    }

    /**
     * Set frame rate of P5
     * @param  {Number} r The new frame rate
     * @return {Control}  this (chainable)
     */
    frameRate(r) {
        if (typeof r !== 'number') return;
        r = Math.round(r);
        if (r <= 0) r = 1;
        if (this._p5) this._p5.frameRate(r);
        this._fps = r;
        return this;
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
     * Render every component in this.components
     */
    render() {
        this.components.forEach(c => {
            if (typeof c.render === 'function') c.render();
        });

        // this.wires.forEach(w => {
        //     if (typeof w.render === 'function') w.render();
        // });
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
     * Loop through all wires
     * @param {Function} fn
     *  fn -> (Component component, Number index)
     */
    forEachWire(fn) {
        this.wires.forEach(fn);
    }

    /**
     * Given a component, display information in debug table
     * @param  {Component} component Component to give info about (or null to clear table)
     */
    showDebugInfo(component) {
        if (Control.isComponent(component)) {
            this._componentShowingInfo = component;
            document.getElementById('c-type').innerText = component.constructor.name;
            document.getElementById('c-resistance').innerText = component.resistance;
            document.getElementById('c-voltage').innerText = component.voltage;
            document.getElementById('c-current').innerText = component.current;
            document.getElementById('c-power').innerText = component.getWatts();
            document.getElementById('c-other').innerHTML = '';

            document.getElementById('c-maxCurrent').innerHTML = isFinite(component.maxCurrent) ?
                '&plusmn;' + component.maxCurrent :
                '<small><code>N/A</code></small> ';

            if (component instanceof Circuit.Bulb) {
                document.getElementById('c-other').innerHTML += '<tr><th>Brightness</th><td>' + Number((component.brightness * 100).toFixed(1)) + '%</td></tr>';
            }

            if (component instanceof Circuit.Cell || component instanceof Circuit.Battery) {
                document.getElementById('c-other').innerHTML += '<tr><th>Direction</th><td>' + ((component._dir === Circuit.Cell.LEFT) ? 'Left' : 'Right') + '</td></tr>';
            }

            if (component instanceof Circuit.ACPowerSupply) {
                document.getElementById('c-other').innerHTML += '<tr><th>Speed</th><td>' + component.hertz + ' Hz</td></tr>';
            }

            if (component instanceof Circuit.DCPowerSupply) {
                document.getElementById('c-other').innerHTML += '<tr><th>Max Voltage</th><td>' + component._maxVoltage + 'V</td></tr>';
            }

            if (component instanceof Circuit.Switch) {
                let state = `<span style='color: ${component.isOpen() ? 'crimson' : 'green; font-weight: bold'};'>${component.isOpen() ? 'Open' : 'Closed'}</span>`;
                document.getElementById('c-other').innerHTML += '<tr><th>State</th><td>' + state + '</td></tr>';
            }

            if (component instanceof Circuit.Buzzer) {
                document.getElementById('c-other').innerHTML += `<tr><th>Volume</th><td>${component.volume * 100}%</td></tr>
                                                                <tr><th>Mute</th><td>${component._mute}</td></tr>
                                                                <tr><th>Freq.</th><td>${component._beep._frequency} Hz</td></tr>`;
            }

            if (component instanceof Circuit.Battery) {
                document.getElementById('c-voltage').innerHTML += component._cells + ' &times; ' + component._cellVoltage + 'V = ' + component.voltage;
                document.getElementById('c-type').innerHTML += component._cells + '-Cell Battery';
            }

            if (component instanceof Circuit.Diode) {
                let html = `<span style='color: ${component.state ? 'green; font-weight: bold' : 'crimson'};'>${component.state ? 'ON' : 'OFF'}</span>`;
                document.getElementById('c-other').innerHTML += '<tr><th>State</th><td>' + html + '</td></tr>';
                document.getElementById('c-other').innerHTML += '<tr><th>Direction</th><td>' + ((component._dir === Circuit.Diode.LEFT) ? 'Left' : 'Right') + '</td></tr>';
            }

            if (component instanceof Circuit.LightEmittingDiode) {
                document.getElementById('c-other').innerHTML += '<tr><th>Colour</th><td style=\'background-color: rgb(' + component._rgb.join(',') + ');\'>Hue: <input type=\'number\' value=\'' + component.hue + '\' placeholder=\'Hue\' min=\'0\' max=\'360\' step=\'1\' onchange=\'control._componentShowingInfo.setHue(+this.value); control.showDebugInfo(control._componentShowingInfo);\' /></td></tr>';
            }

            if (component instanceof Circuit.Junction) {
                if (!component._isEnd) {
                    document.getElementById('c-resistance').innerHTML = '<abbr title=\'Resistance of connected circuits in parallel\'>' + component.getResistance() + '</abbr>';
                }
                document.getElementById('c-other').innerHTML += `<tr><th>Type</th><td>${component._isEnd ? 'Joiner' : 'Splitter'}</td></tr>
                                                                <tr><th>Inputs</th><td>${component._inputCount} / ${component._inputMax}</td></tr>
                                                                <tr><th>Outputs</th><td>${component._outputCount} / ${component._outputMax}</td></tr>`;
            }

            // Button to 'console.log()'
            document.getElementById('c-other').innerHTML += '<tr><td colspan=\'2\'><button onclick=\'console.log(control._componentShowingInfo);\'><code>Console.log</code></button></td></tr>';

            const circuit = component._circuit;
            document.getElementById('cr-depth').innerHTML = circuit._depth;
            document.getElementById('cr-components').innerHTML = circuit.components.length;
            document.getElementById('cr-broken').innerHTML = circuit._isBroken;
            document.getElementById('cr-voltage').innerHTML = circuit.getVoltage();
            document.getElementById('cr-resistance').innerHTML = circuit.getResistance();
            document.getElementById('cr-current').innerHTML = circuit.getCurrent();
            document.getElementById('cr-power').innerHTML = circuit.getWatts();
            document.getElementById('cr-log').innerHTML = '';
            document.getElementById('cr-log').innerHTML = '<button onclick=\'console.log(control._componentShowingInfo._circuit);\'><code>Console.log</code></button>';
        } else {
            this._componentShowingInfo = null;
            document.getElementById('c-type').innerHTML = '';
            document.getElementById('c-resistance').innerHTML = '';
            document.getElementById('c-voltage').innerHTML = '';
            document.getElementById('c-current').innerHTML = '';
            document.getElementById('c-maxCurrent').innerHTML = '';
            document.getElementById('c-power').innerHTML = '';
            document.getElementById('c-other').innerHTML = '';

            document.getElementById('cr-depth').innerHTML = '';
            document.getElementById('cr-components').innerHTML = '';
            document.getElementById('cr-broken').innerHTML = '';
            document.getElementById('cr-voltage').innerHTML = '';
            document.getElementById('cr-resistance').innerHTML = '';
            document.getElementById('cr-current').innerHTML = '';
            document.getElementById('cr-power').innerHTML = '';
            document.getElementById('cr-log').innerHTML = '';
        }
    }

    /**
     * Evaluate the circuit
     * @param {Boolean} playSound       Play sound effect?
     */
    eval(playSound = true) {
        // Calculate current
        // I = V / R
        const current = this._circuit.getCurrent();
        this._circuit.current = current;

        if (!this._running) {
            this._p5.frameRate(this._fps);
            if (playSound) Sounds.Play('BZZ');
            this._running = true;
        }

        // this._circuit.eval();
        this._head.eval();

        this._head.render();
        for (let output of this._head._outputs) {
            output._output.render();
        }
    }

    /**
     * Return circuit to visual "off" state
     */
    stopEval() {
        if (this._running) {
            this._p5.frameRate(5);
            this._running = false;
        }
    }

    /**
     * Connect all components in the top-level circuit (in series)
     */
    connectAll() {
        for (let i = 0; i < this.components.length - 1; i++) {
            let a = this.components[i];
            let b = this.components[i + 1];
            if (Control.isComponent(a) && Control.isComponent(b)) a.connectTo(b);
        }
        arrLast(this.components).connectTo(this.components[0], Circuit.LOOP);
    }

    /**
     * Is the provided object a component?
     * @param  {any}     Object to test
     * @return {Boolean} Well?
     */
    static isComponent(x) {
        return (x instanceof Circuit.Component);
    }
}

Control._defaultFPS = 25;
