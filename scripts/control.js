/**
 * Wrapper for controlling a circuit
 *
 * @property _circuit           The topmost Circuit object
 * @property _file              Which file is this loaded from?
 * @property _selected          Selected component (on canvas)
 * @property _over              Component our mouse is over
 * @property _isDragging        Are we dragging the selected component?
 * @property _isCreatingWire    Are we creating a connection from _selected?
 * @property _enableCreateWire  Enable wire creation?
 * @property _wirePath          Array of soordinates - path of wire if created
 * @property _dragPoint         Which poijt is being dragged (wire manipulation)
 * @property _p5                Contains p5 object
 * @property _fps               Frames per second
 * @property _mode              Display mode of P5
 * @property _width             Width of canvas (alias of this._circuit._p5.width)
 * @property _height            Height of canvas (alias of this._circuit._p5.height)
 * @property _container         Container element
 * @property _canvas            Canvas element
 * @property _showInfo          Show extra info (green boxes)?
 * @property _componentShowingInfo  Which component is showing info in the table?
 * @property _lightLevel        Universal light level
 * @property _lastlightLevel    Universal light level last frame
 * @property _lightLevelRgb     RGB colour of light level
 * @property _updateLightNext   Call this.updateLightLevel() next frame?
 * @property _temperature       Background temperature (°C)
 * @property _lastTemperature   Background temperature last frame
 * @property _temperatureRgb    RGB colour of tenperature
 * @property _updateTempNext    Call this.updateTemp() next frame?
 * @property state              State of the Control
 * @property components         Array of all components
 * @property wires              Array of all wires
 * @property _running           Is this circuit running?
 * @property _debug             Debug mode enabled? (use debug method)
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
 * @method start()              Start render loop
 * @method eval()               Evaluate the circuit
 * @method stop()               Stop render loop
 * @method debug(bool)          Set debug mode true/false
 * @method setLightLevel(lvl)   Set the universal ambient light level
 * @method updateLightLevel()   Update _lightRecieving of all components
 * @method setTemp(deg)         Set the background temperature
 * @method updateTemp()         Update _tempRecieving of all Thermistors
 * @method connect(a, b)        a.connectTo(b)
 * @method connectAll()         Connect all components in top-level circuit. DEBUG only
 * @method secs2frames(secs)    Convert N seconds to N frames
 * @method frames2secs(secs)    Convert N frames to N seconds
 * @method radialGradient(...)  Create a radial gradient
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
        this._enableCreateWire = true;
        this._wirePath = [];
        this._dragPoint = null;

        this._p5 = null;
        this._mode = Control.NORMAL;
        this._width = -1;
        this._height = -1;
        this._canvas = null;
        this._container = null;
        this._showInfo = true;
        this._running = false;
        this._fps = Control._defaultFPS;

        // Light
        this._lightLevel = 0;
        this._lastLightLevel = undefined;
        this._lightLevelRgb = undefined;
        this._updateLightNext = false;

        // Heat
        this._temperature = Control.RTP;
        this._lastTemperature = undefined;
        this._temperatureRgb = undefined;
        this._updateTempNext = false;
    }

    /**
     * Get this._circuit's data
     * @param  {Boolean} asJson Return object in JSON format?
     * @return {String | Object} JSON data or object
     */
    getData(asJson = false) {
        let data = {
            width: this._p5.width,
            height: this._p5.height,
            components: []
        };

        // Do not set stuff if they're just at the default
        if (this._lightLevel !== 0) data.light = this._lightLevel;
        if (this._mode !== Control.NORMAL) data.mode = this._mode;
        data.temp = this._temperature;

        for (let component of this.components) {
            if (typeof component.getData === 'function') {
                let cdata = component.getData();
                data.components.push(cdata);
            }
        }

        return asJson ? JSON.stringify(data, false, '  ') : data;
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
        // if (file !== this._file) {
        //     // Create file
        //     await Server.createFile(file + '.json');
        // }

        let data = this.getData();
        // data = JSON.stringify(data, null, ' ');
        data = JSON.stringify(data);
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
     *           start: fn(namespace, control)
     * @return {Control}       this (nb invoke start() to begin rendering)
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
        const sketch = function(ns) {
            ns.setup = function() {
                control._canvas = ns.createCanvas(w, h);
                control._canvas.parent(id)
                    .style('border', '1px solid black')
                    .doubleClicked(function() {
                        control._selected = control.select(ns.mouseX, ns.mouseY);
                        control._isDragging = true;
                    });

                control._container.insertAdjacentHTML('beforeEnd', `<div id='circuit_debug_info'><table><tr><td><table border='1' ><tr><th colspan='10'>Component Info</th></tr><tr><th>Type</th><td id='c-type'>-</td></tr><tr><th>Resistance</th><td><span id='c-resistance'></span>${Circuit.OHM}</td></tr><tr><th><abbr title='Voltage across component'>Voltage</abbr></th><td><span id='c-voltage'></span>V</td></tr><tr><th><abbr title='Current across component'>Current</abbr></th><td><span id='c-current'></span>A</td></tr><tr><th><abbr title='Maximum current this component can handle'>Max Current</abbr></th><td><span id='c-maxCurrent'></span>A</td></tr><tr><th><abbr title='Power consumption of component. 1 watt = 1 joule per second'>Power</abbr></th><td><span id='c-power'></span> W</td></tr><tr><th>Is On?</th><td id='c-isOn'></td></tr><tr><th>Is Blown?</th><td id='c-isBlown'></td></tr><tr><th>External Light</th><td id='c-light'></td></tr><tr><th>External Heat</th><td id='c-heat'></td></tr></table></td><td><table border='1' ><thead><tr><th colspan='10'>Additional Info</th></tr></thead><tbody id='c-other'></tbody></table></td><td><table border='1' ><tr><th colspan='10'>Parent Circuit</th></tr><tr><th>Depth</th><td id='cr-depth'></td></tr><tr><th>Components</th><td id='cr-components'></td></tr><tr><th>Is Broken?</th><td id='cr-broken'></td></tr><tr><th>Voltage</th><td><span id='cr-voltage'></span> V</td></tr><tr><th>Resistance</th><td><span id='cr-resistance'></span> ${Circuit.OHM}</td></tr><tr><th>Current</th><td><span id='cr-current'></span> A</td></tr><tr><th>Power</th><td><span id='cr-power'></span> W</td></tr><tr><td colspan='10'><center id='cr-log'></center></td></tr></table></td></div>`);

                ns.rectMode(ns.CENTER);
                ns.ellipseMode(ns.CENTER);

                if (typeof setup === 'function') setup(ns, control);
            };

            ns.draw = function() {
                if (control._mode === Control.LIGHT) {
                    ns.background(0);
                } else {
                    ns.background(250);
                }

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

                // Show ambient light
                {
                    const h = 20;
                    const ambient = clamp(control._lightLevel, 0, 1000);
                    if (ambient !== control._lastLightLevel) {
                        const brightness = ambient / 10;
                        control._lightLevelRgb = hsb2rgb(60, 100, brightness);
                        control._lastLightLevel = ambient;
                    }
                    ns.noStroke();
                    ns.fill(...control._lightLevelRgb);
                    ns.rect(ns.width / 2, 0, ns.width, h);
                    if (control._debug) {
                        ns.fill(255, 0, 255);
                        ns.textSize(13);
                        ns.text(ambient + ' lm', ns.width / 2, h / 2);
                    }
                }

                // Show background heat
                {
                    const h = 20;
                    const temp = clamp(control._temperature, Control.MIN_TEMP, Control.MAX_TEMP);
                    if (temp !== control._lastTemperature) {
                        // control._temperatureRgb = hsb2rgb(0, 100, temp);
                        const from = ns.color(...Control.MIN_TEMP_COLOUR);
                        const to = ns.color(...Control.MAX_TEMP_COLOUR);
                        const decimal = mapNumber(temp, Control.MIN_TEMP, Control.MAX_TEMP, 0, 1);
                        control._temperatureRgb = ns.lerpColor(from, to, decimal);
                        control._lastTemperature = temp;
                    }
                    ns.noStroke();
                    ns.fill(control._temperatureRgb);
                    ns.rect(ns.width / 2, ns.height, ns.width, h);
                    if (control._debug) {
                        ns.fill(250);
                        ns.textSize(13);
                        ns.text(temp + ' °C', ns.width / 2, ns.height);
                    }
                }

                // Components
                control.render();
                if (typeof draw === 'function') draw(ns, control);
            };

            // When mouse if pressed - is a component selected?
            ns.mousePressed = function() {
                if (!control._running) return;

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
                        if (control._enableCreateWire) {
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
                        let modified = false;

                        // Toggle component
                        if (typeof component.toggle === 'function' && component.contains(ns.mouseX, ns.mouseY)) {
                            component.toggle(true);
                            modified = true;
                        }

                        // Flip cell/battery/diode
                        else if ((component instanceof Circuit.Cell ||
                                component instanceof Circuit.Battery ||
                                component instanceof Circuit.Diode) && component.contains(ns.mouseX, ns.mouseY)) {
                            component.flip(true);
                            modified = true;
                        }

                        // CHange units ammeter
                        else if (typeof component.changeUnits === 'function' && component.contains(ns.mouseX, ns.mouseY)) {
                            component.changeUnits();
                            modified = true;
                        }

                        // If modified, update showDebugInfo
                        if (modified && control._componentShowingInfo === component) {
                            control.showDebugInfo(component);
                        }
                    }
                }
            };

            // When the mouse is dragged - is a component being dragged?
            ns.mouseDragged = function() {
                if (!control._running) return;

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
                if (!control._running) return;

                control._over = null;
                // Highlight any components we are over
                for (let component of control.components) {
                    if (component === control._selected) continue;
                    if (component.contains(ns.mouseX, ns.mouseY)) {
                        component.select();
                        control.showDebugInfo(null);
                        control.showDebugInfo(component);
                        control._over = component;
                        break;
                    } else {
                        component.unselect();
                    }
                }
            };

            ns.mouseReleased = function() {
                if (!control._running) return;

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

            ns.mouseWheel = function(event) {
                if (!control._running) return;
                if (Control.isComponent(control._over)) {
                    if (typeof control._over.onScroll === 'function') {
                        event.preventDefault();
                        control._over.onScroll(event);
                        control.showDebugInfo(control._over);
                    }
                }
            };
        };

        // Initiate P5
        this._p5 = new p5(sketch);
        this._p5.noLoop();

        return this;
    }

    /**
     * Creates a component of <name> at (x, y)
     * - Inserted into top-level circuit
     * @param  {String} name    Type of the component
     * @param  {Number} x       X coordinate of the component
     * @param  {Number} y       Y coordinate of the component
     * @return {Component}      Return the newly created component
     */
    createComponent(rawName, x, y) {
        // Transform to case naming convention
        // e.g. 'variable resistor' -> 'VariableResistor'
        let name = toClassName(rawName);
        let origName = name;
        let lowName = name.toLowerCase();

        if (lowName === 'led') name = 'LED';
        else if (lowName === 'ldr') name = 'LDR';
        else if (lowName === 'ntcthermistor') name = 'Thermistor';
        else if (lowName === 'ptcthermistor') name = 'Thermistor';

        let klass = Circuit[name];
        if (typeof klass !== 'function') throw new TypeError(`createComponent: component Circuit.${name} does not exist`);

        let component = new klass(this._circuit);

        // Check if instanceof Component
        if (!Control.isComponent(component)) throw new TypeError(`createComponent: component Circuit.${name} does not exist`);

        component.move(x, y);
        this.components.push(component);

        // Additional names
        if (origName.toLowerCase() === 'ntcthermistor') {
            component.mode(Circuit.Thermistor.NTC);
        } else if (origName.toLowerCase() === 'ptcthermistor') {
            component.mode(Circuit.Thermistor.PTC);
        }
        return component;
    }

    /**
     * Set frame rate of P5
     * @param  {Number} r The new frame rate
     * @return {Control}  this (chainable)
     */
    frameRate(r) {
        r = clamp(r, 1, 60);
        if (this._running && this._p5) this._p5.frameRate(r);
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
            document.getElementById('c-type').innerText = component.toString();
            document.getElementById('c-resistance').innerText = component.resistance;
            document.getElementById('c-voltage').innerText = component.voltage;
            document.getElementById('c-current').innerText = component.current;
            document.getElementById('c-power').innerText = component.power();
            document.getElementById('c-other').innerHTML = '';
            document.getElementById('c-isOn').innerHTML = getHtmlBoolString(component.isOn());
            document.getElementById('c-isBlown').innerHTML = getHtmlBoolString(component._blown);
            document.getElementById('c-light').innerHTML = component._lightRecieving + ' lm';
            document.getElementById('c-heat').innerHTML = component._externalTemp + ' °C';

            document.getElementById('c-maxCurrent').innerHTML = isFinite(component.maxCurrent) ?
                '&plusmn;' + component.maxCurrent :
                '<small><code>N/A</code></small> ';

            // Button to 'console.log()'
            document.getElementById('c-other').innerHTML += `<tr><td colspan='2'><button onclick='console.log(control._componentShowingInfo);'><code>Console.log</code></button> <button onclick='console.log(control._componentShowingInfo.getData());'><code>Data</code></button></td></tr>`;

            // If luminous...
            if (typeof component._lpw === 'number') {
                document.getElementById('c-other').innerHTML += `<tr><th>Luminoscity</th><td>${roundTo(component.luminoscity(), 2)} lumens</td></tr>
                                                                <tr><th>Lumens / Watt</th><td>${component._lpw} lm/w</td></tr>`;
            }

            if (component instanceof Circuit.Bulb) {
                const rgb = `rgb(${component.getColour().join(', ')})`;
                document.getElementById('c-type').innerText = component.wattage() + '-Watt ' + component.constructor.name;
                document.getElementById('c-other').innerHTML += `<tr><th>Brightness</th><td>${Number((component.brightness() * 100).toFixed(1))}%</td></tr>
                                                                <tr><th>Colour</th><td style='background-color:${rgb}'>${rgb}</td></tr>
                                                                <tr><th>Old symbol</th><td>${getHtmlBoolString(component._old)}</td></tr>`;
            }

            if (component instanceof Circuit.Resistor) {
                document.getElementById('c-other').innerHTML += '<tr><th>American</th><td>' + getHtmlBoolString(component._american) + '</td></tr>';
            }

            if (component instanceof Circuit.Cell || component instanceof Circuit.Battery) {
                document.getElementById('c-other').innerHTML += '<tr><th>Direction</th><td>' + ((component._dir === Circuit.Cell.LEFT) ? 'Left' : 'Right') + '</td></tr>';
            }

            if (component instanceof Circuit.ACPowerSupply) {
                document.getElementById('c-other').innerHTML += '<tr><th>Speed</th><td>' + component.hertz() + ' Hz</td></tr>';
            }

            if (component instanceof Circuit.DCPowerSupply) {
                document.getElementById('c-other').innerHTML += `<tr><th>Max Voltage</th><td>${component._maxVoltage}V</td></tr>
                                                                <tr><th><abbr title='What to change voltage by onScroll'>Sensitivity</abbr></th><td>Δ${component.sensitivity()}V</td></tr>`;
            }

            if (component instanceof Circuit.Switch) {
                let state = `<span style='color: ${component.isOpen() ? 'crimson' : 'green; font-weight: bold'};'>${component.isOpen() ? 'Open' : 'Closed'}</span>`;
                document.getElementById('c-other').innerHTML += '<tr><th>State</th><td>' + state + '</td></tr>';
            }

            if (component instanceof Circuit.Buzzer) {
                document.getElementById('c-other').innerHTML += `<tr><th>Volume</th><td>${component.volume() * 100}%</td></tr>
                                                                <tr><th>Mute</th><td>${component.mute()}</td></tr>
                                                                <tr><th>Freq.</th><td>${component.frequency()} Hz</td></tr>`;
            }

            if (component instanceof Circuit.Battery) {
                document.getElementById('c-voltage').innerHTML += component._cells + ' &times; ' + component._cellVoltage + 'V = ' + component.voltage;
                document.getElementById('c-type').innerHTML = component._cells + '-Cell Battery';
            }

            if (component instanceof Circuit.Diode) {
                document.getElementById('c-other').innerHTML += '<tr><th>Direction</th><td>' + ((component._dir === Circuit.Diode.LEFT) ? 'Left' : 'Right') + '</td></tr>';
            }

            if (component instanceof Circuit.LightEmittingDiode) {
                let rgb = 'rgb(' + component.getColour().join(', ') + ')';
                document.getElementById('c-other').innerHTML += '<tr><th>Colour</th><td style=\'background-color: ' + rgb + '\'>hsb(' + component.getColour(true).join(', ') + ')<br>' + rgb + '</td></tr>';
            }

            if (component instanceof Circuit.Connector) {
                if (!component._isEnd) {
                    document.getElementById('c-resistance').innerHTML = '<abbr title=\'Resistance of connected circuits in parallel\'>' + component.getResistance() + '</abbr>';
                }

                // Only show inputs/output count if not TwoWaySwitch
                if (!(component instanceof Circuit.TwoWaySwitch)) {
                    document.getElementById('c-other').innerHTML += `<tr><th>Type</th><td>${component._isEnd ? 'Joiner' : 'Splitter'}</td></tr>
                                                                <tr><th>Inputs</th><td>${component._inputCount} / ${component._inputMax}</td></tr>
                                                                <tr><th>Outputs</th><td>${component._outputCount} / ${component._outputMax}</td></tr>`;
                }
            }

            if (component instanceof Circuit.TwoWaySwitch) {
                document.getElementById('c-other').innerHTML += '<tr><th>Executing</th><td>' + component._exec + '</td></tr>';
            }

            if (component instanceof Circuit.Capacitor) {
                document.getElementById('c-other').innerHTML += `<tr><th><abbr title='MicroFarads'>Capacitance</abbr></th><td>${component._capacitance} ${Circuit.MICRO}F</td></tr>
                                                                <tr><th>Target Voltage</th><td>${component.targetVoltage} V</td></tr>
                                                                <tr><th>Path Resistance</th><td>${component.getPathResistance()} V</td></tr>
                                                                <tr><th>State</th><td>${component.getState()}</td></tr>`;
            }

            if (component instanceof Circuit.Motor) {
                document.getElementById('c-other').innerHTML += `<tr><th><abbr title='If current = maxCurrent '>Max Speed</abbr></th><td>${roundTo(rad2deg(component.K), 1)}°</td></tr>
                                                                <tr><th>Speed</th><td>${roundTo(rad2deg(component.delta()), 2)}° / frame</td></tr>
                                                                <tr><th>Angle</th><td>${component.angle()}</td></tr>`;
            }

            if (component instanceof Circuit.Heater) {
                document.getElementById('c-other').innerHTML += `<tr><th>Temperature (°C)</th><td>${component.temp()}</td></tr>
                                                                <tr><th>Max Temp (°C)</th><td>${component.maxTemp()} °C</td></tr>
                                                                <tr><th>Percent</th><td>${roundTo(component.percent(), 3)}%</td></tr>
                                                                <tr><th>Efficiency</th><td >${component._efficiency}%</td></tr>`;
            }

            if (component instanceof Circuit.Thermistor) {
                document.getElementById('c-other').innerHTML += `<tr><th>temp:resistance</th><td>${component._mode === Circuit.Thermistor.NTC ? 'Negative' : 'Positive '} Correlation</td></tr>
                                                                <tr><th>Temp Range (°C)</th><td>${component._min}°C to ${component._max}°C</td></t`;
            }

            const circuit = component._circuit;
            document.getElementById('cr-depth').innerHTML = circuit._depth;
            document.getElementById('cr-components').innerHTML = circuit.components.length;
            document.getElementById('cr-broken').innerHTML = getHtmlBoolString(circuit._isBroken);
            document.getElementById('cr-voltage').innerHTML = circuit.getVoltage();
            document.getElementById('cr-resistance').innerHTML = circuit.getResistance();
            document.getElementById('cr-current').innerHTML = circuit.getCurrent();
            document.getElementById('cr-power').innerHTML = circuit.power();
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
            document.getElementById('c-isOn').innerHTML = '';
            document.getElementById('c-isBlown').innerHTML = '';

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
     * Start draw() loop
     * @param  {Number} [fps=this._fps]     FPS of draw cycle
     * @return {Control} this
     */
    start(fps = null) {
        if (!this._running) {
            fps = (typeof fps === 'number') ? clamp(fps, 1, 60) : this._fps;

            // Find _head
            if (!Control.isComponent(this._head)) {
                for (let component of this.components) {
                    if (Control.isPowerSource(component)) {
                        this._head = component;
                        break;
                    }
                }
            }

            // Update _lightRecieving of all components
            this.updateLightLevel();

            // Update _externalTemp of all thermistors
            this.updateTemp();

            // Do all P5 stuff
            this._running = true;
            if (typeof fps === 'number') this.frameRate(fps);
            this._p5.loop();

            // Show debug table
            document.getElementById('circuit_debug_info').removeAttribute('hidden');
        } else {
            console.warn(`Cannot invoke start() when running is already true`);
        }
        return this;
    }

    /**
     * Evaluate the circuit
     * @return {Boolean} Was it succesfully evaluated?
     */
    eval() {
        if (!this._running) {
            console.warn(`Cannot invoke eval() when running is false`);
            return false;
        }

        if (!(this._head instanceof Circuit.Battery) && !(this._head instanceof Circuit.Cell)) {
            throw new TypeError(`_head component must be a power source, got`, this._head);
        }

        // Calculate current
        // I = V / R
        const current = this._circuit.getCurrent();
        this._circuit.current = current;

        // this._circuit.eval();
        this._head.eval();
        this.render();

        // Make sure we update light level on the next frame to when it was set
        if (typeof this._updateLightNext === 'number' && this._p5.frameCount !== this._updateLightNext) {
            this._updateLightNext = false;
            this.updateLightLevel(true); // With now = true
        }

        // Make sure we update external temperature on the next frame to when it was set
        if (typeof this._updateTempNext === 'number' && this._p5.frameCount !== this._updateTempNext) {
            this._updateTempNext = false;
            this.updateTemp(true); // With now = true
        }

        // Update showDebugInfo
        // if (this._componentShowingInfo instanceof Circuit.Component) {
        //     this.showDebugInfo(this._componentShowingInfo);
        // }

        return true;
    }

    /**
     * Render every component in this.components
     */
    render() {
        const p = this._p5;

        if (this._mode === Control.LIGHT) {
            // Render luminous
            this.components.forEach(c => {
                if (Control.isLuminous(c) && c.isOn()) {
                    const lumens = c.luminoscity();

                    const d = Control.calcLumenRadius(lumens) / 2;
                    const start = p.color(...c.getColour());
                    const end = p.color(...hsb2rgb(p.hue(start), 100, c.control._lightLevel));
                    c.control.radialGradient(c._x, c._y, d, d, start, end, 50);


                    if (c._debug) {
                        p.stroke(255, 0, 255);
                        p.strokeWeight(1);
                        p.noFill();
                        p.rect(c._x, c._y, d / 2, d / 2);

                        p.noStroke();
                        p.fill(255, 0, 255);
                        p.textSize(15);
                        p.textAlign(p.CENTER);
                        let lm = roundTo(lumens, 2);
                        p.text(lm + ' lm', c._x, c._y);
                        p.textAlign(p.LEFT);
                    }
                }
            });
        } else if (this._mode === Control.HEAT) {
            // Render heat sphere
            this.components.forEach(c => {
                if (Control.isHeatEmitter(c) && c._joules !== 0) {
                    const deg = c.celcius();

                    const d = Control.calcTempRadius(deg) * 2;
                    const start = p.color(...c.getColour());
                    // const end = p.color(...hsb2rgb(p.hue(start), 100, c.control._temperature));
                    const end = p.color(250);
                    c.control.radialGradient(c._x, c._y, d, d, start, end, 50);

                    if (c._debug) {
                        p.stroke(255, 0, 255);
                        p.strokeWeight(1);
                        p.noFill();
                        p.rect(c._x, c._y, d, d);

                        p.noStroke();
                        p.fill(0, 0, 255);
                        p.textSize(15);
                        p.textAlign(p.CENTER);
                        let temp = c.temp();
                        p.text(temp, c._x, c._y);
                        p.textAlign(p.LEFT);
                    }
                }
            });
        }

        // Render as normal
        this.components.forEach(c => c.render());
    }

    /**
     * Stop draw() loop
     * @return {Control} this
     */
    stop() {
        if (this._running) {
            this._running = false;
            this._p5.noLoop();
            this.showDebugInfo(null);
            document.getElementById('circuit_debug_info').setAttribute('hidden', 'hidden');
        } else {
            console.warn(`Cannot invoke stop() when running is already false`);
        }
        return this;
    }

    /**
     * Set debug mode of control
     * @param  {Boolean} bool
     */
    debug(bool) {
        bool = bool === true;
        if (bool !== this._debug) {
            this._debug = bool;
            control.forEach(c => c._debug = bool);
            control.forEachWire(w => w._debug = bool);
        }
    }

    /**
     * Set ambient light level of control
     * @param {Number} lvl The new light level (%)
     */
    setLightLevel(lvl) {
        if (typeof lvl !== 'number') return;
        this._lightLevel = lvl;

        // Update all components
        this.updateLightLevel();
    }

    /**
     * Update _lightRecieving of all components
     * @param {Boolean} now     SHould we update it now? or next execution cycle
     */
    updateLightLevel(now = false) {
        if (now === true) {
            this.forEach(c => {
                c._lightRecieving = c.lightRecieving();
            });
        } else {
            this._updateLightNext = this._p5.frameCount;
        }
    }

    /**
     * Set the background temperature
     * @param {Number} deg Temperature
     */
    setTemp(deg) {
        if (typeof deg !== 'number') return;
        deg = clamp(deg, Control.MIN_TEMP, Control.MAX_TEMP);
        this._temperature = deg;

        // Update all components
        this.updateTemp();
    }

    /**
     * Update _externalTemp of all thermistors
     * @param {Boolean} now     Should we update it now? or next execution cycle
     */
    updateTemp(now = false) {
        if (now === true) {
            this.forEach(c => {
                c._externalTemp = c.heatRecieving();
            });
        } else {
            if (typeof this._updateTempNext !== 'number') {
                this._updateTempNext = this._p5.frameCount;
            }
        }
    }

    /**
     * a.connectTo(b)
     * @param  {Component[]} array  Components to connect
     */
    connect(...array) {
        for (let i = 0; i < array.length - 1; i++) {
            if (!Control.isComponent(array[i])) throw new TypeError(`connect: array[${i}] is not a component`);
            if (!Control.isComponent(array[i + 1])) throw new TypeError(`connect: array[${i + 1}] is not a component`);
            array[i].connectTo(array[i + 1]);
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
     * Convert seconds to frames (duration)
     * @param  {Number} secs
     * @return {Number} frames
     */
    secs2frames(secs) {
        return Math.ceil(secs * this._fps);
    }

    /**
     * Convert frames to seconds (duration)
     * @param  {Number} frames
     * @return {Number} seconds
     */
    frames2secs(frames) {
        return frames / this._fps;
    }

    /**
     * Renders a radial gradient.
     * @param {Number} x            X position
     * @param {Number} y            Y position
     * @param {Number} w            width
     * @param {Number} h            height
     * @param {Color} inner         Inner colour
     * @param {Color} outer         Outer colour
     * @param {Number} opacity      Opacity
     */
    radialGradient(x, y, w, h, inner, outer, opacity = 255) {
        if (!this._running) {
            console.warn('Cannot invoke radialGradient() when p5 is not running');
            return;
        }

        const p = this._p5;
        const max = Math.max(w, h);

        p.noStroke();
        for (let i = max; i > 0; i--) {
            const step = i / max;
            const colour = p.lerpColor(inner, outer, step);
            colour.setAlpha(opacity);
            p.fill(colour);
            p.ellipse(x, y, step * w, step * h);
        }
    }

    /**
     * Is the provided object a component?
     * @param  {any} x     Object to test
     * @return {Boolean} Well?
     */
    static isComponent(x) {
        return (x instanceof Circuit.Component);
    }

    /**
     * Is the provided component a power source?
     * @param  {any} x     Object to test
     * @return {Boolean} Well?
     */
    static isPowerSource(x) {
        return (
            x instanceof Circuit.Cell ||
            x instanceof Circuit.Battery ||
            x instanceof Circuit.ACPowerSupply ||
            x instanceof Circuit.DCPowerSupply);
    }

    /**
     * Is the provided component a heat-emmittent one?
     * @param  {any} x     Object to test
     * @return {Boolean} Well?
     */
    static isHeatEmitter(x) {
        return (x instanceof Circuit.Heater);
    }

    /**
     * Is the provided component a luminous one?
     * @param  {any} x     Object to test
     * @return {Boolean} Well?
     */
    static isLuminous(x) {
        return (
            x instanceof Circuit.Bulb ||
            x instanceof Circuit.LightEmittingDiode);
    }

    /**
     * given a temperature, return the given radius of influence
     * @param  {Number} deg Temperature in degrees C
     * @return {Number}     Radius in px
     */
    static calcTempRadius(deg) {
        return deg * 5;
    }

    /**
     * Given a brightness, return the given radius of influence
     * @param  {Number} lumen Brightness in lumens
     * @return {Number}       Radius in px
     */
    static calcLumenRadius(lumen) {
        return lumen / 1.7;
    }
}

(function() {
    Control._defaultFPS = 25;
    Control.RTP = 20;
    Control.MIN_TEMP = -50;
    Control.MIN_TEMP_COLOUR = [0, 0, 250];
    Control.MAX_TEMP = 100;
    Control.MAX_TEMP_COLOUR = [250, 0, 0];

    // Enum for control._mode
    Control.NORMAL = 0;
    Control.LIGHT = 1;
    Control.HEAT = 2;
})();
