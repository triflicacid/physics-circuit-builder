import * as utils from '../util/utils.js';
import Circuit from './circuit.js';
import Page from '../page/index.js';


/**
 * Wrapper for controlling a circuit
 *
 * @property _circuit           The topmost Circuit object
 * @property _file              Are we loaded from a file? Is so, the file name?
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
 * @property _gridSnapping      Do grid snapping?
 * @property _bb                Bounding box of canvas
 * @property PIXELS_PER_CM      How many pixels in a cm?
 *
 * @method getData()            Get circuit data
 * @method load(data)           Load from JSON data
 * @method terminate()          Terminate the cirucit
 *
 * @method setup(...)           Get ready to draw (prepare P5 instance). To initiate, call '.draw()' on result
 * @method createComponent(name, x, y)  Create a <name> component at (x, y)
 * @method frameRate(rate)      Set frame rate of p5
 * @method select(x, y)                 Select component at (x, y)
 * @method render()         Renders all components in this.components array
 * @method forEach(fn: component, index)     Loop through all components
 * @method forEachWire(fn: component, index) Loop through all wires
 * @method find()               Return component given its toString() value
 * @method start()              Start render loop
 * @method eval()               Evaluate the circuit
 * @method stop()               Stop render loop
 * @method debug(bool)          Set debug mode true/false
 * @method american(bool)       Set american to true/false
 * @method setLightLevel(lvl)   Set the universal ambient light level
 * @method updateLightLevel()   Update _lightRecieving of all components
 * @method setTemp(deg)         Set the background temperature
 * @method updateTemp()         Update _tempRecieving of all Thermistors
 * @method connect(a, b)        a.connectTo(b)
 * @method connectAll()         Connect all components in top-level circuit. DEBUG only
 * @method secs2frames(secs)    Convert N seconds to N frames
 * @method frames2secs(secs)    Convert N frames to N seconds
 * @method radialGradient(...)  Create a radial gradient
 * @method coordsOnCanvas(x,y)  Given coordinates on the page, return relative to canvas
 * @method contains(x,y)        Given coordinates on the page, does the canvas contain them?
 *
 * @static isComponent(x)       Is provided value a component?
 */
export class Control {
    constructor() {
        this._file = null;
        this._circuit = null;

        this.components = [];
        this.wires = [];

        // Drawing / Rendering managment variables
        this._selected = null;
        this._isDragging = false;
        this._isCreatingWire = false;
        this._enableCreateWire = false;
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
        this._gridSnapping = false;

        /** @type DOMRect */
        this._bb = undefined;

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

        this.PIXELS_PER_CM = 2.5; // How many pixels in a cm?
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
            components: [],
        };

        // Do not set stuff if they're just at the default
        if (this._mode !== Control.NORMAL) data.mode = this._mode;
        data.pxcm = this.PIXELS_PER_CM;
        data.temp = this._temperature;
        data.light = this._lightLevel;

        for (let component of this.components) {
            if (typeof component.getData === "function") {
                let cdata = component.getData();
                data.components.push(cdata);
            }
        }

        return asJson ? JSON.stringify(data, false, "  ") : data;
    }

    /**
     * Load circuit data
     * @param  {Object} data Data to load from
     * @param  {Function} callback  Function to execute after loaded
     * @return {Control} this
     */
    load(data, callback = undefined) {
        if (typeof data !== "object") data = {};
        const isEmpty = Object.keys(data).length === 0;

        let width = typeof data.width === "number" ? data.width : 800;
        let height = typeof data.height === "number" ? data.height : 800;
        if (typeof data.temp === "number") this._temperature = data.temp;
        if (typeof data.light === "number") this._lightLevel = data.light;
        if (typeof data.pxcm === 'number') this.PIXELS_PER_CM = data.pxcm;

        // __SETUP__ function
        const __setup__ = isEmpty ?
            undefined :
            function (ns, control) {
                // Load components
                for (let cdata of data.components) {
                    let c;
                    try {
                        c = control.createComponent(
                            cdata.type,
                            +cdata.pos[0],
                            +cdata.pos[1]
                        );
                    } catch (e) {
                        Page.circuitError("Unknown Component", "Corupted file: unknown component: '" + cdata.type + "'");
                        throw e;
                    }

                    // Set data
                    if (typeof cdata.data === "object") {
                        for (let ckey in cdata.data) {
                            if (cdata.data.hasOwnProperty(ckey)) {
                                c["_" + ckey] = cdata.data[ckey];
                            }
                        }
                    }
                }

                // Connect components
                for (let i = 0; i < data.components.length; i++) {
                    const me = control.components[i];
                    const conns = data.components[i].conns;
                    if (Array.isArray(conns) && conns.length !== 0) {
                        for (let conn of conns) {
                            if (typeof conn.index !== "number")
                                throw new TypeError(
                                    `load: expected conn to have numeric index property: `,
                                    conn
                                );
                            const target = control.components[conn.index];
                            const pathData = Array.isArray(conn.path) ?
                                conn.path : [];
                            me.connectTo(target, pathData, {
                                hasResistance: conn.hasRes,
                                material: conn.material,
                                r: conn.r
                            });
                        }
                    }
                }
            };

        // __DRAW__ function
        const __draw__ = function (ns, control) {
            const date = new Date();
            document.getElementById("lastUpdate").innerText = `${date
                .getHours()
                .toString()
                .padStart(2, "0")}:${date
                .getMinutes()
                .toString()
                .padStart(2, "0")}:${date
                .getSeconds()
                .toString()
                .padStart(2, "0")}.${date
                .getMilliseconds()
                .toString()
                .padStart(3, "0")}; Frames: ${ns.frameCount} (${utils.roundTo(
                ns.frameRate(),
                1
            )} fps)`;

            // control.debug(debugCheckbox.checked);
            // control._showInfo = showInfoCheckbox.checked;
            // control._enableCreateWire = wireCreationCheckbox.checked;

            try {
                control.eval();
            } catch (e) {
                control.stop();
                // ERROR!
                Page.circuitError("Fatal Circuit Error", e);
                console.error("==== [FATAL CIRCUIT ERROR] ====\n", e);
            }
        };

        const ready = this.setup(
            Page.container,
            width,
            height,
            __setup__,
            __draw__,
            callback
        );
        // const fps = (typeof data.fps === 'number') ? data.fps : Control._defaultFPS;
        //
        // ready.start(fps);
        return this;
    }

    /**
     * Terminate the circuit and p5 sketch
     * @return {Control} this
     */
    terminate() {
        this._p5.remove(); // Remove P5 sketch

        // Delete all unique properties of top-level circuit
        for (let prop in this._circuit) {
            if (this._circuit.hasOwnProperty(prop)) {
                delete this._circuit[prop];
            }
        }

        // Remove all unique properties
        for (let prop in this) {
            if (this.hasOwnProperty(prop)) {
                delete this[prop];
            }
        }

        document.getElementById("lastUpdate").innerHTML = "";

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
     * @param  {Function} callback  Function to execute after finished
     * @return {Control}       this (nb invoke start() to begin rendering)
     */
    setup(id, w, h, setup, draw, callback = undefined) {
        let e = document.getElementById(id);
        if (!(e instanceof HTMLElement))
            throw new TypeError(
                `Cannot resolve provided ID '${id}' to an HTMLElement`
            );
        this._container = e;

        document.body.setAttribute("oncontextmenu", "return false;");

        this._width = w;
        this._height = h;
        this._circuit = new Circuit(this);

        const control = this;
        const sketch = function (ns) {
            ns.setup = function () {
                control._canvas = ns.createCanvas(w, h);
                control._canvas.parent(id).doubleClicked(function () {
                    control._selected = control.select(ns.mouseX, ns.mouseY);
                    control._isDragging = true;
                });
                control._bb = control._canvas.elt.getBoundingClientRect();

                ns.rectMode(ns.CENTER);
                ns.ellipseMode(ns.CENTER);
                ns.strokeCap(ns.SQUARE);

                if (typeof setup === "function") setup(ns, control);
            };

            ns.draw = function () {
                // if (control._mode === Control.LIGHT) {
                //     ns.background(0);
                // } else {
                //     ns.background(250);
                // }
                ns.clear();
                control.render();
                if (typeof draw === "function") draw(ns, control);
            };

            // When mouse if pressed - is a component selected?
            ns.mousePressed = function () {
                // if (!control._running) return;

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
                            if (
                                Control.isComponent(lastSelected) &&
                                control._isCreatingWire
                            ) {
                                if (control._isCreatingWire) {
                                    try {
                                        lastSelected.connectTo(control._selected, control._wirePath);
                                    } catch (e) {
                                        Page.circuitError("Cannot Connect Components", e);
                                        console.error("==== [CONNECTION ERROR] ====\n", e);
                                    } finally {
                                        control._isCreatingWire = false;
                                        control._selected.unselect();
                                        control._selected = null;
                                        control._wirePath = [];
                                    }
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
                        let x = ns.mouseX;
                        let y = ns.mouseY;

                        // Snap position if enabled
                        if (control._gridSnapping) {
                            x = Math.round(x / Control.SNAP_COMPONENT) * Control.SNAP_COMPONENT;
                            y = Math.round(y / Control.SNAP_COMPONENT) * Control.SNAP_COMPONENT;
                        }
                        control._wirePath.push([x, y]);
                        return;
                    }

                    // Right clicking has some special actions on certain components
                    for (let component of control.components) {
                        let modified = false;

                        // Toggle component
                        if (
                            typeof component.toggle === "function" &&
                            component.contains(ns.mouseX, ns.mouseY)
                        ) {
                            component.toggle(true);
                            modified = true;
                        }

                        // Flip cell/battery/diode
                        else if (
                            (component instanceof Circuit.Cell ||
                                component instanceof Circuit.Battery ||
                                component instanceof Circuit.Diode) &&
                            component.contains(ns.mouseX, ns.mouseY)
                        ) {
                            component.flip(true);
                            modified = true;
                        }

                        // CHange units ammeter
                        else if (
                            typeof component.changeUnits === "function" &&
                            component.contains(ns.mouseX, ns.mouseY)
                        ) {
                            component.changeUnits();
                            modified = true;
                        }

                        // If modified, update analysis info
                        if (
                            modified &&
                            Page.controls.componentShowingInfo === component
                        ) {
                            Page.controls.analyse(component);
                        }
                    }

                    // If over wire, create node
                    if (control._over instanceof Circuit.Wire) {
                        control._over.addHandle(ns.mouseX, ns.mouseY);
                    }
                }
            };

            // When the mouse is dragged - is a component being dragged?
            ns.mouseDragged = function () {
                // if (!control._running) return;

                if (Control.isComponent(control._selected)) {
                    // If dragging, move component...
                    if (control._isDragging) {
                        control._isCreatingWire = false;

                        let x = ns.mouseX;
                        let y = ns.mouseY;

                        // Snap position if enabled
                        if (control._gridSnapping) {
                            x = Math.round(x / Control.SNAP_COMPONENT) * Control.SNAP_COMPONENT;
                            y = Math.round(y / Control.SNAP_COMPONENT) * Control.SNAP_COMPONENT;
                        }
                        control._selected.move(x, y);
                    }
                } else if (
                    control._selected instanceof Circuit.Wire &&
                    Array.isArray(control._dragPoint)
                ) {
                    // Dragging wire point
                    const pad = control._selected._handleRadius * 3;
                    let x = utils.clamp(ns.mouseX, pad, ns.width - pad);
                    let y = utils.clamp(ns.mouseY, pad, ns.height - pad);

                    // Snap position if enabled
                    if (control._gridSnapping) {
                        x = Math.round(x / Control.SNAP_WIRE) * Control.SNAP_WIRE;
                        y = Math.round(y / Control.SNAP_WIRE) * Control.SNAP_WIRE;
                    }
                    control._dragPoint[0] = x;
                    control._dragPoint[1] = y;
                }
            };

            ns.mouseMoved = function () {
                if (control._canvas.elt instanceof HTMLElement)
                    control._bb = control._canvas.elt.getBoundingClientRect();

                if ((ns.mouseX < 0 || ns.mouseY < 0) ||
                    ns.mouseX > control._bb.width || ns.mouseY > control._bb.height) {
                    // (x, y) is off-canvas
                } else {
                    // (x, y) on cavnvas! Begin checks
                    if (control._over != null && control._over.contains(ns.mouseX, ns.mouseY) === true) {
                        // Old _over still contains us! No need to check again.
                    } else {
                        // Find new _over
                        if (control._over != null) {
                            control._over.unselect();
                            control._over = null;
                        }

                        // Highlight any components we are over
                        for (let component of control.components) {
                            if (component === control._selected) continue;
                            if (component.contains(ns.mouseX, ns.mouseY)) {
                                component.select();
                                Page.controls.analyse(component);
                                control._over = component;
                                return;
                            }

                        }

                        // Check output wires of each component
                        // Do this after, because this calculation is more costly, so check all the components themselves first (sqrt)
                        for (let component of control.components) {
                            for (let wire of component._outputs) {
                                if (wire.contains(ns.mouseX, ns.mouseY)) {
                                    wire.select();
                                    Page.controls.analyse(wire);
                                    control._over = wire;
                                    return;
                                }
                            }
                        }
                    }
                }
            };

            ns.mouseReleased = function () {
                // Stop dragging
                document.body.style.cursor = "default";
                if (
                    Control.isComponent(control._selected) &&
                    control._isDragging
                ) {
                    control._selected.unselect();
                    control._selected = null;
                    control._isDragging = false;
                } else if (control._selected instanceof Circuit.Wire) {
                    control._selected = null;
                    control._dragPoint = null;
                }
            };

            ns.mouseWheel = function (event) {
                if (Control.isComponent(control._over)) {
                    if (typeof control._over.onScroll === "function") {
                        event.preventDefault();
                        control._over.onScroll(event);
                        Page.controls.analyse(control._over);
                    }
                }
            };

            ns.keyPressed = function (event) {
                if (ns.key === "Delete" || ns.key === 'Backspace') {
                    // If over component...
                    if (Control.isComponent(control._over)) {
                        if (window.confirm(`Remove component '${control._over.toString()}' from the circuit?`)) {
                            control._over.remove();
                        }
                    }

                    // If over wire...
                    else if (control._over instanceof Circuit.Wire) {
                        // If on any handle...
                        const handle = control._over.onHandle(ns.mouseX, ns.mouseY);
                        if (Array.isArray(handle) && window.confirm(`Delete wire handle at (${Math.round(handle[0])}, ${Math.round(handle[1])}) ?`)) {
                            utils.arrRemove(handle, control._over._path);
                        } else if (window.confirm(`Remove wire connecting ${control._over._input.toString()} and ${control._over._output.toString()} from the circuit?`)) {
                            control._over.remove();
                        }
                    }

                    // ELse, popup to delete file?
                    else {
                        Page.file.delete();
                    }
                } else {
                    switch (ns.key) {
                        case "a":
                            Page.tab.select(Page.tab.analyse);
                            break;
                        case "c":
                            Page.tab.select(Page.tab.components);
                            break;
                        case "Control":
                            Page.tab.select(Page.tab.control);
                            break;
                        case 'e':
                            Page.controls.showInfo.click();
                            break;
                        case "f":
                            Page.tab.select(Page.file.tabLink);
                            break;
                        case 'r':
                            Page.controls.isRunning.click();
                            break;
                        case "s":
                            Page.file.save();
                            break;
                        case 'w':
                            Page.controls.wireCreation.click();
                            break;
                        default:
                            console.log(("Unknown key: " + ns.key));
                    }
                }
            };
        };

        // Initiate P5
        this._p5 = new p5(sketch);
        // this._p5.noLoop();
        this._p5.frameRate(this._fps);

        if (typeof callback === 'function') callback(this);

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
        let name = utils.toClassName(rawName);
        let origName = name;
        let lowName = name.toLowerCase();

        if (lowName === "led") name = "LED";
        else if (lowName === "ldr" || lowName === "lightdependantresistor") name = "PhotoResistor";
        else if (lowName === "ntcthermistor") name = "Thermistor";
        else if (lowName === "ptcthermistor") name = "Thermistor";
        else if (lowName === "acpowersupply") name = "ACPowerSupply";
        else if (lowName === "dcpowersupply") name = "DCPowerSupply";

        let klass = Circuit[name];
        if (typeof klass !== "function")
            throw new ComponentError(`createComponent: component Circuit.${name} does not exist`);

        let component = new klass(this._circuit);

        // Check if instanceof Component
        if (!Control.isComponent(component))
            throw new ComponentError(`createComponent: component Circuit.${name} does not exist`);

        component.move(x, y);
        this.components.push(component);

        // If on wire...
        (function (control) {
            for (let c of control.components) {
                for (let wire of c._outputs) {
                    if (wire.contains(x, y)) {
                        // console.log(x, y, component._x, component._y);
                        wire.insertComponent(component);
                        return;
                    }
                }
            }
        })(this);

        // Additional names
        if (origName.toLowerCase() === "ntcthermistor") {
            component.mode(Circuit.Thermistor.NTC);
        } else if (origName.toLowerCase() === "ptcthermistor") {
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
        r = utils.clamp(r, 1, 60);
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
     * Given a component's toString() value, return the object
     * @param  {String} string    Value of <component>.toString()
     * @return {Component} the component
     */
    find(string) {
        try {
            const id = string.slice(string.lastIndexOf('#') + 1, string.length);
            const c = this.components[id];
            return c;
        } catch (e) {
            throw new TypeError(`Invalid string ID ('${string}'). Error: ${e}`);
        }
    }

    /**
     * Start draw() loop
     * @param  {Number} [fps=this._fps]     FPS of draw cycle
     * @return {Control} this
     */
    start(fps = null) {
        if (!this._running) {
            fps = typeof fps === "number" ? utils.clamp(fps, 1, 60) : this._fps;

            // Update _lightRecieving of all components
            this.updateLightLevel();

            // Update _externalTemp of all thermistors
            this.updateTemp();

            // Do all P5 stuff
            this._running = true;
            if (typeof fps === "number") this.frameRate(fps);
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
        if (!this._running) return false;
        if (this.components.length === 0) return false;

        // Find _head
        if (!Control.isPowerSource(this._head)) {
            for (let component of this.components) {
                if (Control.isPowerSource(component)) {
                    this._head = component;
                    break;
                }
            }
        }

        if (
            !(this._head instanceof Circuit.Battery) &&
            !(this._head instanceof Circuit.Cell)
        ) {
            throw new ComponentError(
                `_head component must be a power source, got ` + (Control.isComponent(this._head) ? this._head.toString() : '(null)')
            );
        }

        // Calculate current
        // I = V / R
        const current = this._circuit.getCurrent();
        this._circuit.current = current;

        // this._circuit.eval();
        this._head.eval();
        this.render();

        // Make sure we update light level on the next frame to when it was set
        if (
            typeof this._updateLightNext === "number" &&
            this._p5.frameCount !== this._updateLightNext
        ) {
            this._updateLightNext = false;
            this.updateLightLevel(true); // With now = true
        }

        // Make sure we update external temperature on the next frame to when it was set
        if (
            typeof this._updateTempNext === "number" &&
            this._p5.frameCount !== this._updateTempNext
        ) {
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
     * Render every components, environment etc...
     */
    render() {
        const p = this._p5;

        // Draw line from selected component to (x, y)
        if (Control.isComponent(this._selected) && this._isCreatingWire) {
            p.stroke(150, 0, 0);
            p.strokeWeight(1.5);

            p.beginShape();
            p.vertex(...this._selected.getOutputCoords());
            for (let coord of this._wirePath) {
                p.vertex(...coord);
            }
            p.vertex(p.mouseX, p.mouseY);
            p.endShape();
        }

        // Show ambient light
        {
            const roundness = 20;
            const h = 10;
            const ambient = utils.clamp(this._lightLevel, 0, 1000);
            if (ambient !== this._lastLightLevel) {
                const brightness = ambient / 10;
                this._lightLevelRgb = utils.hsb2rgb(60, 100, brightness);
                this._lastLightLevel = ambient;
            }
            p.noStroke();
            p.fill(...this._lightLevelRgb);
            p.rect(p.width / 2, h / 2, p.width, h, roundness);
            if (this._debug) {
                p.fill(255, 0, 255);
                p.textSize(13);
                p.text(ambient + " lm", p.width / 2, h);
            }

            // Show background heat
            const temp = utils.clamp(
                this._temperature,
                Control.MIN_TEMP,
                Control.MAX_TEMP
            );
            if (temp !== this._lastTemperature) {
                // this._temperatureRgb = utils.hsb2rgb(0, 100, temp);
                const from = p.color(...Control.MIN_TEMP_COLOUR);
                const to = p.color(...Control.MAX_TEMP_COLOUR);
                const decimal = utils.mapNumber(
                    temp,
                    Control.MIN_TEMP,
                    Control.MAX_TEMP,
                    0,
                    1
                );
                this._temperatureRgb = p.lerpColor(from, to, decimal);
                this._lastTemperature = temp;
            }
            p.noStroke();
            p.fill(this._temperatureRgb);
            p.rect(p.width / 2, p.height - h / 2, p.width, h, roundness);
            if (this._debug) {
                p.fill(250);
                p.textSize(13);
                p.text(temp + " °C", p.width / 2, p.height);
            }
        }

        if (this._mode === Control.LIGHT) {
            // Render luminous
            this.components.forEach((c) => {
                if (Control.isLuminous(c) && c.isOn()) {
                    const lumens = c.luminoscity();

                    const d = Control.calcLumenRadius(lumens) / 2;
                    const start = p.color(...c.getColour());
                    const end = p.color(
                        ...utils.hsb2rgb(p.hue(start), 100, c.control._lightLevel)
                    );
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
                        let lm = utils.roundTo(lumens, 2);
                        p.text(lm + " lm", c._x, c._y);
                        p.textAlign(p.LEFT);
                    }
                }
            });
        } else if (this._mode === Control.HEAT) {
            // Render heat sphere
            this.components.forEach((c) => {
                if (Control.isHeatEmitter(c) && c._joules !== 0) {
                    const deg = c.celcius();

                    const d = Control.calcTempRadius(deg) * 2;
                    const start = p.color(...c.getColour());
                    // const end = p.color(...utils.hsb2rgb(p.hue(start), 100, c.control._temperature));
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
        this.components.forEach((c) => c.render());
    }

    /**
     * Stop draw() loop
     * @return {Control} this
     */
    stop() {
        if (this._running) {
            this._running = false;
            // this._p5.noLoop();
            this.components.forEach((c) => (c._current = 0));
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
            this.forEach((c) => (c._debug = bool));
            this.forEachWire((w) => (w._debug = bool));
        }
    }

    /**
     * Set american mode of e.g. resistors
     * @param  {Boolean} bool
     */
    american(bool) {
        bool = bool === true;
        this.forEach((c) => {
            if (typeof c._american === "boolean") c._american = bool;
        });
    }

    /**
     * Set ambient light level of control
     * @param {Number} lvl The new light level (%)
     */
    setLightLevel(lvl) {
        if (typeof lvl !== "number") return;
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
            this.forEach((c) => {
                c._lightRecieving = c.lightRecieving();
            });
        } else {
            this._updateLightNext = this._p5 ? this._p5.frameCount : 0;
        }
    }

    /**
     * Set the background temperature
     * @param {Number} deg Temperature
     */
    setTemp(deg) {
        if (typeof deg !== "number") return;
        deg = utils.clamp(deg, Control.MIN_TEMP, Control.MAX_TEMP);
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
            this.forEach((c) => {
                c._externalTemp = c.heatRecieving();
            });
        } else {
            if (typeof this._updateTempNext !== "number") {
                this._updateTempNext = this._p5 ? this._p5.frameCount : 0;
            }
        }
    }

    /**
     * a.connectTo(b)
     * @param  {Component[]} array  Components to connect
     */
    connect(...array) {
        for (let i = 0; i < array.length - 1; i++) {
            if (!Control.isComponent(array[i]))
                throw new TypeError(`connect: array[${i}] is not a component`);
            if (!Control.isComponent(array[i + 1]))
                throw new TypeError(
                    `connect: array[${i + 1}] is not a component`
                );
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
            if (Control.isComponent(a) && Control.isComponent(b))
                a.connectTo(b);
        }
        utils.arrLast(this.components).connectTo(this.components[0], Circuit.LOOP);
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
            console.warn(
                "Cannot invoke radialGradient() when p5 is not running"
            );
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
     * Given coordinates on the page, return the relatove coordinates on the canvas
     * @param  {Number} x
     * @param  {Number} y
     * @return {Number[]} [x, y] on canvas
     */
    coordsOnCanvas(x, y) {
        if (this._canvas.elt instanceof HTMLElement)
            this._bb = this._canvas.elt.getBoundingClientRect();

        return (this._bb instanceof DOMRect) ? [x - this._bb.x, y - this._bb.y] : [NaN, NaN];
    }

    /**
     * Does the canvas contain the given coords?
     * @param  {Number} x X coordinate to test
     * @param  {Number} y Y coordinate to test
     * @return {Boolean}    Contains coords?
     */
    contains(x, y) {
        if (this._canvas.elt instanceof HTMLElement)
            this._bb = this._canvas.elt.getBoundingClientRect();

        return (this._bb instanceof DOMRect) ?
            (
                x > this._bb.left &&
                x < this._bb.right &&
                y > this._bb.top &&
                y < this._bb.bottom
            ) :
            false;
    }

    /**
     * Is the provided object a component?
     * @param  {any} x     Object to test
     * @return {Boolean} Well?
     */
    static isComponent(x) {
        return x instanceof Circuit.Component;
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
            x instanceof Circuit.DCPowerSupply
        );
    }

    /**
     * Is the provided component a heat-emmittent one?
     * @param  {any} x     Object to test
     * @return {Boolean} Well?
     */
    static isHeatEmitter(x) {
        return x instanceof Circuit.Heater;
    }

    /**
     * Is the provided component a luminous one?
     * @param  {any} x     Object to test
     * @return {Boolean} Well?
     */
    static isLuminous(x) {
        return (
            x instanceof Circuit.Bulb || x instanceof Circuit.LightEmittingDiode
        );
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

Control._defaultFPS = 20;
Control.RTP = 20;
Control.MIN_TEMP = -50;
Control.MIN_TEMP_COLOUR = [0, 0, 250];
Control.MAX_TEMP = 100;
Control.MAX_TEMP_COLOUR = [250, 0, 0];

// Enum for control._mode
Control.NORMAL = 0;
Control.LIGHT = 1;
Control.HEAT = 2;

Control.SNAP_COMPONENT = 10;
Control.SNAP_WIRE = 4;

/**
 * Error object for component errors
 */
export class ComponentError extends Error {
    constructor(message) {
        super(message);
        this.name = "ComponentError";
    }
}

export default Control;