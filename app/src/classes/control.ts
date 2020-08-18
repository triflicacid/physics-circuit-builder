import * as utils from 'assets/utils';
import Circuit from './circuit';
import CircuitItem from './circuitItem';
import Component from './component/Component';
import Wire from './wire';
import Page from 'page/index';
import { ISaveData, IComponentData, IConnectionData, IAdditionalComponentData } from 'models/saveData';
import Controls from 'page/controls';
import File from 'page/file';
import Tab from 'page/tab';
import p5 from 'p5';
import { ComponentError, NullError } from './errors';
import PowerSource from './component/PowerSource';
import Popup, { PopupMode } from './popup';
import { Heater } from './component/all/index';

/**
 * Wrapper for controlling a circuit
 *
 * @property circuit           The topmost Circuit object
 * @property file              Are we loaded from a file? Is so, the file name?
 * @property _selected          Selected component (on canvas)
 * @property _over              Component our mouse is over
 * @property _isDragging        Are we dragging the selected component?
 * @property _isCreatingWire    Are we creating a connection from _selected?
 * @property enableCreateWire   Enable wire creation?
 * @property _wirePath          Array of soordinates - path of wire if created
 * @property _dragPoint         Which poijt is being dragged (wire manipulation)
 * @property _head              Head component - must be power source
 * @property _p5                Contains p5 object
 * @property _fps               Frames per second
 * @property mode              Display mode of P5
 * @property _width             Width of canvas (alias of this._circuit._p5.width)
 * @property _height            Height of canvas (alias of this._circuit._p5.height)
 * @property _container         Container element
 * @property _canvas            Canvas element
 * @property showInfo          Show extra info (green boxes)?
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
 * @property _debug             Debug mode enabled? (use getter/setter)
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
 * @method find()               Return component given its toString() value
 * @method eval()               Evaluate the circuit
 * @method debug(bool)          Set debug mode true/false
 * @method american(bool)       Set american to true/false
 * @method lightLevel(lvl)      Get / Set the universal ambient light level
 * @method updateLightLevel()   Update _lightRecieving of all components
 * @method temperature(deg)     Get / Set the background temperature
 * @method updateTemp()         Update _tempRecieving of all Thermistors
 * @method connect(a, b)        a.connectTo(b)
 * @method secs2frames(secs)    Convert N seconds to N frames
 * @method frames2secs(secs)    Convert N frames to N seconds
 * @method radialGradient(...)  Create a radial gradient
 * @method coordsOnCanvas(x,y)  Given coordinates on the page, return relative to canvas
 * @method clampCoords(x,y,p)   Clamp coordinates inside the canvas
 * @method contains(x,y)        Given coordinates on the page, does the canvas contain them?
 * @method isOver(c)            Is the user hovering over the provided component?
 * @method removeItem(c)        Remove a given CircuitItem
 *
 * @static isComponent(x)       Is provided value a component?
 */
export class Control {
  public circuit: Circuit | null = null; // The topmost circuit object
  public file: string | null = null; // File currently open
  public components: Component[] = []; // Array of all components
  public wires: Wire[] = []; // Array of all wires
  public pixelsPerCm: number = 2.5; // Ratio of px:cm
  public mode: ControlMode = ControlMode.Normal; // Display mode of the canvss
  public showInfo: boolean = true; // Are the components showing extra info?
  public enableCreateWire: boolean = false; // Are we allowing the creation of wire?

  private _selected: CircuitItem | null = null; // Selected component on canvas
  private _over: CircuitItem | null = null; // Component that we are currently over
  private _isDragging: boolean = false; // Are we dragging a component?
  private _isCreatingWire: boolean = false; // Are we currently creating a wire?
  private _head: PowerSource | null = null; // Head component of circuit - power source
  private _wirePath: number[][] = []; // Path for new wire
  private _dragPoint: number[] | null = null; // Which point (node) is being dragged on the wire?
  private _p5: any; // P5 instance
  private _fps: number = 20; // FPS of P5 event loop
  private _width: number = -1; // Width of P5 canvas 
  private _height: number = -1; // Height of P5 canvas
  private _canvas: p5.Renderer | null = null; // Canvas element created by P5 (as so, we don't know the type)
  private _bb: DOMRect | null = null; // BoundingBoxRect of canvas
  private _container: HTMLElement | null = null;
  private _running: boolean = false; // Are we running the circuit?
  private _debug: boolean = false; // Debug mode?
  private _gridSnapping: boolean = false; // Is grid snapping enabled?

  private _lightLevel: number = 0; // Light level of the environment
  private _lastLightLevel: number = -1; // Last _lightLevel value
  private _lightLevelRgb: number[] = []; // RGB colour of the light strip on canvas
  private _updateLightNext: boolean = false; // Call this.updateLightLevel() the next P5 frame?

  private _temperature: number = 20; // Temperature of the environment
  private _lastTemperature: number = -1; // Last _temperature value
  private _temperatureRgb: p5.Color | null = null; // colour of the temperature strip on canvas (user p5.lerpColor)
  private _updateTempNext: boolean = false; // Call this.updateTemp() the next P5 frame?

  constructor() { }

  public get p5(): p5 { return this._p5; }
  public get head(): PowerSource | null { return this._head; }

  public get isRunning(): boolean { return this._running; }
  public set isRunning(v: boolean) {
    if (v && !this._running) {
      // |=== START RUNNING ===|
      this._running = true;

      // Update _lightRecieving of all components
      this.updateLightLevel();

      // Update _externalTemp of all thermistors
      this.updateTemp();
    } else if (!v && this._running) {
      // |=== STOP RUNNING ===|
      this._running = false;

      // Set current to 0 for all components
      this.components.forEach((c) => { c.setCurrent(0); });
    }
  }

  public get debug(): boolean { return this._debug; }
  // When set, set all debug values of children wires/components aswell
  public set debug(bool: boolean) {
    if (bool !== this._debug) {
      this._debug = bool;
      this.components.forEach((c) => c.debug = bool);
      this.wires.forEach((w) => w.debug = bool);
    }
  }

  /**
   * Order this.components to be in flow order
   * - Doesn't modify this.components
   * @param  comp Component we are currently scanning
   * @param  startComp Component we started with
   * @return The component array
   */
  public orderComponentArray(): Component[] {
    if (this._head == null) return [];

    // Order connected components
    const array: Component[] = [];
    this._orderComponentArray(this._head, this._head, array);

    // Add-in those that are left behind
    for (let component of this.components) {
      if (array.indexOf(component) === -1) {
        array.push(component);
      }
    }
    return array;
  }

  private _orderComponentArray(comp: Component, startComp: Component, compArray: Component[]): void {
    if (compArray.indexOf(comp) === -1) compArray.push(comp);

    for (let output of comp.outputs) {
      if (output.output === startComp) continue;
      this._orderComponentArray(output.output, startComp, compArray)
    }
  }

  /**
   * Get this._circuit's data
   * @return {ISaveData}
   */
  public getData(): ISaveData {
    if (this._head != null) this.components = this.orderComponentArray();

    let data: ISaveData = {
      width: this._p5.width,
      height: this._p5.height,

      components: [],

      pxcm: this.pixelsPerCm,
      temp: this._temperature,
      light: this._lightLevel,
    };

    for (let component of this.components) {
      if (typeof component.getData === "function") {
        let cdata: IComponentData = component.getData();
        data.components.push(cdata);
      }
    }

    return data;
  }

  /**
   * Load circuit data
   * @param  {Object} data Data to load from
   * @param  {Function} callback  Function to execute after loaded
   * @return {Control} this
   */
  public load(data?: ISaveData, callback?: Function): Control {
    const isEmpty = data === undefined;

    let width: number = 900;
    let height: number = 700;
    if (data !== undefined) {
      if (typeof data.width === 'number' && !isNaN(data.width)) width = data.width;
      if (typeof data.height === 'number' && !isNaN(data.height)) height = data.height;
      if (typeof data.temp === 'number' && !isNaN(data.temp)) this._temperature = data.temp;
      if (typeof data.light === 'number' && !isNaN(data.light)) this._lightLevel = data.light;
      if (typeof data.pxcm === 'number' && !isNaN(data.pxcm)) this.pixelsPerCm = data.pxcm;
    }

    // __SETUP__ function
    const __setup__: Function | undefined = data === undefined ?
      undefined :
      function (ns: any, control: Control) {
        // Load components
        if (Array.isArray(data.components)) {
          for (let cdata of data.components) {
            let c: Component;
            try {
              c = control.createComponent(cdata.type, cdata.pos[0], cdata.pos[1]);
            } catch (e) {
              Page.circuitError("Unknown Component", "Corupted file: unknown component: '" + cdata.type + "'");
              throw e;
            }

            if (cdata.data !== undefined) {
              try {
                c.apply(cdata.data);
              } catch (e) {
                new Popup("Save File - Error", `Invalid or malformed "data" for component ${c.toString()}`)
                  .mode(PopupMode.Error)
                  .open();
                throw e;
              }
            }
          }

          // Connect components
          for (let i = 0; i < data.components.length; i++) {
            const me: Component = control.components[i];
            const conns: IConnectionData[] = data.components[i].conns;
            if (Array.isArray(conns) && conns.length !== 0) {
              for (let conn of conns) {
                if (typeof conn.index !== "number") throw new TypeError(`load: expected conn to have numeric index property: ${conn}`);
                const target: Component = control.components[conn.index];
                me.connectTo(target, conn);
              }
            }
          }
        }
      };

    // __DRAW__ function
    const __draw__ = function (ns: any, control: Control) {
      // control.debug(debugCheckbox.checked);
      // control.showInfo = showInfoCheckbox.checked;
      // control.enableCreateWire = wireCreationCheckbox.checked;

      try {
        control.eval();
      } catch (e) {
        control.isRunning = false;
        // ERROR!
        Page.circuitError("Fatal Circuit Error", e);
        console.error("==== [FATAL CIRCUIT ERROR] ====\n", e);
      }
    };

    this.setup(Page.container, width, height, __setup__, __draw__, callback);
    // const fps = (typeof data.fps === 'number') ? data.fps : Control._defaultFPS;
    //
    // ready.start(fps);
    return this;
  }

  /**
   * Terminate the circuit and p5 sketch
   * @return {Control} this
   */
  public terminate(): Control {
    this._p5.remove(); // Remove P5 sketch

    // Remove all unique properties of this
    for (let prop in this) {
      if (this.hasOwnProperty(prop)) {
        delete this[prop];
      }
    }

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
  public setup(id: string, w: number, h: number, setup?: any, draw?: Function, callback?: Function) {
    let e: HTMLElement = utils.getElementById(id);
    if (!(e instanceof HTMLElement)) throw new TypeError(`Cannot resolve provided ID '${id}' to an HTMLElement`);
    this._container = e;

    document.body.setAttribute("oncontextmenu", "return false;");

    this._width = w;
    this._height = h;
    this.circuit = new Circuit(this);

    const control: Control = this;
    const sketch: ((ns: p5) => void) = (ns: p5): void => {
      ns.setup = function (): void {
        control._canvas = ns.createCanvas(w, h);
        control._canvas.parent(id).doubleClicked(function (): void {
          control._selected = control.select(ns.mouseX, ns.mouseY);
          control._isDragging = true;
        });
        control._bb = control._canvas.elt.getBoundingClientRect();

        ns.rectMode(ns.CENTER);
        ns.ellipseMode(ns.CENTER);
        ns.strokeCap(ns.SQUARE);

        if (typeof setup === "function") setup(ns, control);
      };

      ns.draw = function (): void {
        // if (control.mode === Control.LIGHT) {
        //     ns.background(0);
        // } else {
        //     ns.background(250);
        // }
        ns.clear();
        control.render();
        if (typeof draw === "function") draw(ns, control);
      };

      // When mouse if pressed - is a component selected?
      ns.mousePressed = function (event: MouseEvent): void {
        // if (!control._running) return;

        main: {
          // Only do stuff if no popups are open
          if (Page.openPopups.length !== 0) break main;

          // If not inserting wire, allow ANY click to trigger onMouseDown
          // (normally only ns.RIGHT mouse button will trigger the event)
          if (!control.enableCreateWire && !control._isCreatingWire && control._over instanceof Component) {
            control._over.onMouseDown(event);

            if (Controls.componentShowingInfo === control._over) Controls.reAnalyse();
          } else if (ns.mouseButton === ns.LEFT) {
            // Check if click on wire handle
            for (let wire of control.wires) {
              let on: number[] | null = wire.onHandle(ns.mouseX, ns.mouseY);
              if (on != null) {
                control._selected = wire;
                control._dragPoint = on;
                break main;
              }
            }

            // Else, check for selected component
            let lastSelected: CircuitItem | null = control._selected;
            control._selected = control.select(ns.mouseX, ns.mouseY);

            // If new one selected and there's an old one and creating wire...
            if (control._selected instanceof Component) {
              // Creating wire has different functionality event-wise to if disabled
              if (control.enableCreateWire) {
                if (lastSelected instanceof Component && control._isCreatingWire) {
                  if (control._isCreatingWire) {
                    try {
                      const data: IConnectionData = { path: control._wirePath };
                      lastSelected.connectTo(control._selected, data);
                    } catch (e) {
                      Page.circuitError("Cannot Connect Components", e);
                      console.error("==== [CONNECTION ERROR] ====\n", e);
                    } finally {
                      control._isCreatingWire = false;
                      control._selected.highlighted = false;
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
              let x: number = ns.mouseX;
              let y: number = ns.mouseY;

              // Snap position if enabled
              if (control._gridSnapping) {
                x = Math.round(x / Control.SNAP_COMPONENT) * Control.SNAP_COMPONENT;
                y = Math.round(y / Control.SNAP_COMPONENT) * Control.SNAP_COMPONENT;
              }
              control._wirePath.push([x, y]);
            }

            // If over wire, create node
            else if (control._over instanceof Wire) {
              control._over.addHandle(ns.mouseX, ns.mouseY);
            }

            // Right-click events are still fired
            else if (control._over instanceof Component) {
              control._over.onMouseDown(event);

              if (Controls.componentShowingInfo === control._over) {
                Controls.reAnalyse();
              }
            }
          }
        }
      };

      ns.mouseReleased = function (event: MouseEvent): void {
        main: {
          // Only do stuff if no popups are open
          if (Page.openPopups.length !== 0) break main;

          // Stop dragging
          if (control._selected instanceof Component && control._isDragging) {
            control._selected.highlighted = false;
            control._selected = null;
            control._isDragging = false;
          } else if (control._selected instanceof Wire) {
            control._selected = null;
            control._dragPoint = null;
          }

          if (control._over instanceof Component) {
            control._over.onMouseUp(event);
            if (Controls.componentShowingInfo === control._over) Controls.reAnalyse();
          }
        }

        return;
      };

      ns.mouseWheel = function (event: WheelEvent): void {
        // Only do stuff if no popups are open
        if (Page.openPopups.length !== 0) return;

        if (control._over instanceof Component) {
          event.preventDefault();
          control._over.onScroll(event);
          if (Controls.componentShowingInfo === control._over) Controls.reAnalyse();
        }
      };

      // When the mouse is dragged - is a component being dragged?
      ns.mouseDragged = function (): void {
        // Only do stuff if no popups are open
        if (Page.openPopups.length !== 0) return;

        if (control._selected instanceof Component) {
          // If dragging, move component...
          if (control._isDragging) {
            control._isCreatingWire = false;

            let x: number = ns.mouseX;
            let y: number = ns.mouseY;

            // Snap position if enabled
            if (control._gridSnapping) {
              x = Math.round(x / Control.SNAP_COMPONENT) * Control.SNAP_COMPONENT;
              y = Math.round(y / Control.SNAP_COMPONENT) * Control.SNAP_COMPONENT;
            }
            control._selected.move(x, y);
          }
        } else if (control._selected instanceof Wire && control._dragPoint != null) {
          // Dragging wire point
          const pad: number = Wire.HANDLE_RADIUS * 3;
          let x: number = utils.clamp(ns.mouseX, pad, ns.width - pad);
          let y: number = utils.clamp(ns.mouseY, pad, ns.height - pad);

          // Snap position if enabled
          if (control._gridSnapping) {
            x = Math.round(x / Control.SNAP_WIRE) * Control.SNAP_WIRE;
            y = Math.round(y / Control.SNAP_WIRE) * Control.SNAP_WIRE;
          }
          control._dragPoint[0] = x;
          control._dragPoint[1] = y;
        }
      };

      ns.mouseMoved = function (event: MouseEvent): void {
        // Only do stuff if no popups are open
        if (Page.openPopups.length !== 0) return;

        if (control._canvas == null) {
          console.warn("Canvas not yet rendered... cannot call mouseMoved");
          return;
        }

        control._bb = control._canvas.elt.getBoundingClientRect();
        if (control._bb == null) throw new NullError('control._bb', 'Expected bounding box for <canvas />');

        if ((ns.mouseX < 0 || ns.mouseY < 0) ||
          ns.mouseX > control._bb.width || ns.mouseY > control._bb.height) {
          // (x, y) is off-canvas
        } else {
          // (x, y) on cavnvas! Begin checks
          if ((control._over instanceof Component || control._over instanceof Wire) && control._over.contains(ns.mouseX, ns.mouseY)) {
            // Old _over still contains us! No need to check again.
          } else {
            // Find new _over
            if (control._over != null) {
              if (control._over instanceof Component) {
                control._over.onMouseLeave(event);
                if (Controls.componentShowingInfo === control._over) Controls.reAnalyse();
              }
              control._over.highlighted = false;
              control._over = null;
            }

            // Highlight any components we are over
            for (let component of control.components) {
              if (component === control._selected) continue;
              if (component.contains(ns.mouseX, ns.mouseY)) {
                component.highlighted = true;
                Controls.analyse(component);
                control._over = component;
                component.onMouseEnter(event);
                return;
              }
            }

            // Check output wires of each component
            // Do this after, because this calculation is more costly, so check all the components themselves first (sqrt)
            for (let component of control.components) {
              for (let wire of component.outputs) {
                if (wire.contains(ns.mouseX, ns.mouseY)) {
                  wire.highlighted = true;
                  Controls.analyse(wire);
                  control._over = wire;
                  return;
                }
              }
            }
          }
        }

        return;
      };

      ns.keyPressed = function (): void {
        // Only do stuff if no popups are open
        if (Page.openPopups.length !== 0) return;

        switch (ns.key) {
          case "Delete": {
            // If over component...
            if (control._over instanceof Component) {
              if (window.confirm(`Remove component '${control._over.toString()}' from the circuit?`)) {
                control._over.remove();
              }
            }

            // If over wire...
            else if (control._over instanceof Wire) {
              // If on any handle...
              const handle: number[] | null = control._over.onHandle(ns.mouseX, ns.mouseY);
              if (handle != null && window.confirm(`Delete wire handle at (${Math.round(handle[0])}, ${Math.round(handle[1])}) ?`)) {
                control._over.removeHandle(handle);
              } else if (window.confirm(`Remove wire connecting ${control._over.input.toString()} and ${control._over.output.toString()} from the circuit?`)) {
                control._over.remove();
              }
            }

            // ELse, popup to delete file?
            else {
              File.delete();
            }
            break;
          }
          case "a":
            Tab.select(Tab.analyse);
            break;
          case 'e':
            Controls.showInfo.click();
            break;
          case "h":
            // Component help
            if (Controls.componentShowingInfo != null && Controls.componentShowingInfo instanceof Component) {
              Controls.componentHelp(Controls.componentShowingInfo.constructor.name);
            }
            break;
          case "s":
            File.save();
            break;
          case 'w':
            Controls.wireCreation.click();
            break;
          default:
          // console.log(("Unknown key: " + ns.key));
        }

        return;
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
   * @param  {Object} data    Data to apply to component?
   * @return {Component}      Return the newly created component
   */
  public createComponent(rawName: string, x: number, y: number, data?: IAdditionalComponentData): Component {
    if (this.circuit == null) throw new NullError("Control.circuit", "Cannot create component on null circuit");

    // Transform to case naming convention
    // e.g. 'variable resistor' -> 'VariableResistor'
    let name: string = utils.toClassName(rawName);
    let lowName: string = name.toLowerCase();

    if (lowName === "led") name = "LightEmittingDiode";
    else if (lowName === "ldr" || lowName === "lightdependantresistor") name = "PhotoResistor";
    else if (lowName === "acpowersupply") name = "ACPowerSupply";
    else if (lowName === "dcpowersupply") name = "DCPowerSupply";

    const klass: typeof Component | null = Circuit.components[name];

    if (klass == null) throw new ComponentError(`Component name '${name}' does not exist`);

    const component: Component = new klass(this.circuit);
    component.move(x, y);
    if (data !== undefined) component.apply(data);
    this.components.push(component);

    // If on wire...
    (function (control) {
      for (let c of control.components) {
        for (let wire of c.outputs) {
          if (wire.contains(x, y)) {
            // console.log(x, y, component._x, component._y);
            wire.insertComponent(component);
            return;
          }
        }
      }
    })(this);

    return component;
  }

  /**
   * Get / Set frame rate of P5
   * @param  {Number} r The new frame rate
   * @return {Number}  The frame rate
   */
  public frameRate(r?: number): number {
    if (r !== undefined) {
      r = utils.clamp(r, 1, 60);
      if (this._running && this._p5) this._p5.frameRate(r);
      this._fps = r;
    }
    return this._fps;
  }

  /**
   * Select a component at given (x, y)
   * @param  {Number} x Target x coordinate
   * @param  {Number} y Target y coordinate
   * @return {Component}   Selected component or null
   */
  private select(x: number, y: number): Component | null {
    for (let component of this.components) {
      if (component.contains(x, y)) {
        component.highlighted = true;
        return component;
      }
    }
    return null;
  }

  /**
   * Given a component's toString() value, return the object
   * @param  {String} string    Value of <component>.toString()
   * @return {Component} the component
   */
  public find(string: string): Component {
    try {
      const id: number = +(string.slice(string.lastIndexOf('#') + 1, string.length));
      const c: Component = this.components[id];
      return c;
    } catch (e) {
      throw new TypeError(`Invalid string ID ('${string}'). Error: ${e}`);
    }
  }

  /**
   * Evaluate the circuit
   * @return {Boolean} Was it succesfully evaluated?
   */
  public eval(): boolean {
    if (this.circuit == null) throw new NullError("Control.circuit", "Cannot evaluate null circuit");
    if (!this._running) return false;
    if (this.components.length === 0) return false;

    // Find _head
    if (this._head == null) {
      for (let component of this.components) {
        if (component instanceof PowerSource) {
          this._head = component;
          break;
        }
      }

      // If still null
      if (this._head == null) {
        // throw new ComponentError(`Could not find power source to be circuit's head (_head)`);
        return false;
      }
    }


    // Check that power source has round trip
    if (this._head.trace(this._head, false, false) == null) {
      // this.isRunning = false;
      // throw new ComponentError(`Please connect all components before running the circuit simulation.`);
      return false;
    }

    // Calculate current
    // I = V / R
    const current: number = this.circuit.getCurrent();
    this.circuit.current = current;

    // this._circuit.eval();
    this._head.eval();
    this.render();

    // Make sure we update light level on the next frame to when it was set
    if (typeof this._updateLightNext === "number" && this._p5.frameCount !== this._updateLightNext) {
      this._updateLightNext = false;
      this.updateLightLevel(true); // With now = true
    }

    // Make sure we update external temperature on the next frame to when it was set
    if (typeof this._updateTempNext === "number" && this._p5.frameCount !== this._updateTempNext) {
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
  public render(): void {
    const p: p5 = this._p5;

    // Draw line from selected component to (x, y)
    if (this._selected instanceof Component && this._isCreatingWire) {
      p.stroke(150, 0, 0);
      p.strokeWeight(1.5);

      p.beginShape();
      p.vertex(...<[number, number]>this._selected.getOutputCoords());
      for (let coord of this._wirePath) {
        p.vertex(coord[0], coord[1]);
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
      p.fill(...<[number, number, number]>this._lightLevelRgb);
      p.rect(p.width / 2, h / 2, p.width, h, roundness);
      if (this.debug) {
        p.fill(255, 0, 255);
        p.textSize(13);
        p.text(ambient + " lm", p.width / 2, h);
      }

      // Show background heat
      const temp = utils.clamp(this._temperature, Control.MIN_TEMP, Control.MAX_TEMP);
      if (temp !== this._lastTemperature) {
        // this._temperatureRgb = utils.hsb2rgb(0, 100, temp);
        const from = p.color(...Control.MIN_TEMP_COLOUR);
        const to = p.color(...Control.MAX_TEMP_COLOUR);
        const decimal = utils.mapNumber(temp, Control.MIN_TEMP, Control.MAX_TEMP, 0, 1);
        this._temperatureRgb = p.lerpColor(from, to, decimal);
        this._lastTemperature = temp;
      }
      p.noStroke();
      if (this._temperatureRgb == null) throw new NullError("Control._temperatureRgb", "Expected p5.Color, but got null");
      p.fill(this._temperatureRgb);
      p.rect(p.width / 2, p.height - h / 2, p.width, h, roundness);
      if (this.debug) {
        p.fill(250);
        p.textSize(13);
        p.text(temp + " °C", p.width / 2, p.height);
      }
    }

    if (this.mode === ControlMode.Light) {
      // Render luminous
      this.components.forEach((c) => {
        if (c.isLuminous() && c.isOn()) {
          const anyC: any = <any>c;

          const lumens: number = c.luminoscity();

          // const d: number = Control.calcLumenRadius(lumens) / 2;
          const d: number = Control.calcLumenRadius(anyC.brightness() * 100);
          const colour: [number, number, number] = anyC.getColour(100);
          // const start: p5.Color = p.color(...colour);
          // const end = p.color(...utils.hsb2rgb(p.hue(start), 100, c.control._lightLevel));

          const pos: [number, number] = c.pos();
          // c.control.radialGradient(pos[0], pos[1], d, d, start, end, 50);
          p.noStroke();
          if (c.constructor.name === "Bulb") {
            p.fill(255, 255, 0); // Yellow
          } else if (c.constructor.name === "LightEmittingDiode") {
            p.fill(anyC.hue, 100, 100);
          } else {
            p.fill(255, 255, 0);
          }
          p.ellipse(pos[0], pos[1], d, d);

          if (c.debug) {
            p.stroke(255, 0, 255);
            p.strokeWeight(1);
            p.noFill();
            p.rect(pos[0], pos[1], d / 2, d / 2);

            p.noStroke();
            p.fill(255, 0, 255);
            p.textSize(15);
            p.textAlign(p.CENTER);
            let lm = utils.roundTo(lumens, 2);
            p.text(lm + " lm", pos[0], pos[1]);
            p.textAlign(p.LEFT);
          }
        }
      });
    } else if (this.mode === ControlMode.Heat) {
      // Render heat sphere
      this.components.forEach((c) => {
        if (c instanceof Heater && c.temp() != "0°C") {
          const deg: number = c.degreesCelcius;
          const pos: number[] = c.pos();
          const d: number = Control.calcTempRadius(deg) * 2;
          // const start = p.color(...c.getColour());
          // // const end = p.color(...utils.hsb2rgb(p.hue(start), 100, c.control._temperature));
          // const end: p5.Color = (this._temperatureRgb == null) ? p.color(250) : this._temperatureRgb;
          // c.control.radialGradient(pos[0], pos[1], d, d, start, end, 50);

          p.noStroke();
          p.fill(225, 50, 50);
          p.ellipse(pos[0], pos[1], d, d);

          if (c.debug) {
            p.stroke(255, 0, 255);
            p.strokeWeight(1);
            p.noFill();
            p.rect(pos[0], pos[1], d, d);

            p.noStroke();
            p.fill(0, 0, 255);
            p.textSize(15);
            p.textAlign(p.CENTER);
            let temp = c.temp();
            p.text(temp, pos[0], pos[1]);
            p.textAlign(p.LEFT);
          }
        }
      });
    }

    // Render as normal
    this.components.forEach((c) => c.render());
  }

  /**
   * Set american mode of e.g. resistors
   * @param  {Boolean} bool
   */
  public american(bool: boolean): void {
    /**
    * !TEMPORARY!
    * ? while port to TS is under way
    */
    // this.components.forEach((c) => c.config("american", bool));
  }

  /**
   * Get / Set ambient light level of control
   * @param  {Number} lvl The new light level (%)
   * @return {Number} The light level
   */
  public lightLevel(lvl?: number): number {
    if (typeof lvl === "number") {
      if (lvl < 0 || isNaN(lvl)) lvl = 0;
      this._lightLevel = lvl;

      // Update all components
      this.updateLightLevel();
    }
    return this._lightLevel;
  }

  /**
   * Update _lightRecieving of all components
   * @param {Boolean} now     SHould we update it now? or next execution cycle
   */
  public updateLightLevel(now: boolean = false): void {
    if (now) {
      // Update light recieving value with `true`
      this.components.forEach((c) => c.lightRecieving(true));
    } else {
      this._updateLightNext = this._p5 ? this._p5.frameCount : 0;
    }
  }

  /**
   * Get / Set the background temperature
   * @param {Number} deg Temperature to set to
   * @return {Number} The temperature
   */
  public temperature(deg?: number): number {
    if (typeof deg === "number") {
      deg = utils.clamp(deg, Control.MIN_TEMP, Control.MAX_TEMP);
      this._temperature = deg;

      // Update all components
      this.updateTemp();
    }

    return this._temperature;
  }

  /**
   * Update _externalTemp of all thermistors
   * @param {Boolean} now     Should we update it now? or next execution cycle
   */
  public updateTemp(now: boolean = false): void {
    if (now) {
      this.components.forEach((c) => c.heatRecieving(true));
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
  public connect(...array: Component[]): void {
    for (let i = 0; i < array.length - 1; i++) {
      if (!(array[i] instanceof Component))
        throw new TypeError(`connect: array[${i}] is not a component`);
      if (!(array[i + 1] instanceof Component))
        throw new TypeError(`connect: array[${i + 1}] is not a component`);
      array[i].connectTo(array[i + 1]);
    }
  }

  /**
   * Convert seconds to frames (duration)
   * @param  {Number} secs
   * @return {Number} frames
   */
  public secs2frames(secs: number): number {
    return Math.ceil(secs * this._fps);
  }

  /**
   * Convert frames to seconds (duration)
   * @param  {Number} frames
   * @return {Number} seconds
   */
  public frames2secs(frames: number): number {
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
  private radialGradient(x: number, y: number, w: number, h: number, inner: p5.Color, outer: p5.Color, opacity: number = 255): void {
    if (!this._running) {
      console.warn("Cannot invoke radialGradient() when p5 is not running");
    } else {
      const p: p5 = this._p5;
      const max: number = Math.max(w, h);

      p.noStroke();
      for (let i = max; i > 0; i--) {
        const step: number = i / max;
        const colour: p5.Color = p.lerpColor(inner, outer, step);
        colour.setAlpha(opacity);
        p.fill(colour);
        p.ellipse(x, y, step * w, step * h);
      }
    }
  }

  /**
   * Given coordinates on the page, return the relatove coordinates on the canvas
   * @param  {Number} x
   * @param  {Number} y
   * @return {Number[]} [x, y] on canvas
   */
  public coordsOnCanvas(x: number, y: number): [number, number] {
    if (this._canvas == null) {
      console.warn("Canvas not yet rendered... Cannot call coordsOnCanvas");
      return [x, y];
    }
    this._bb = this._canvas.elt.getBoundingClientRect();

    return (this._bb instanceof DOMRect) ? [x - this._bb.x, y - this._bb.y] : [NaN, NaN];
  }

  /**
  * Clamp provided coords inside the canvas
  * @param  {Number} x   x-coordinate
  * @param  {Number} y   y-coordinate
  * @param  {Number} p   Padding
  * @return {Number[]} Clamped coordinates
  */
  public clampCoords(x: number, y: number, padding: number = 0): [number, number] {
    return [
      utils.clamp(x, padding, this._width - padding),
      utils.clamp(y, padding, this._height - padding)
    ];
  }

  /**
   * Does the canvas contain the given coords?
   * @param  {Number} x X coordinate to test
   * @param  {Number} y Y coordinate to test
   * @return {Boolean}    Contains coords?
   */
  public contains(x: number, y: number): boolean {
    if (this._canvas == null) {
      console.warn("Canvas not yet rendered... Cannot call .contains");
      return false;
    }

    this._bb = this._canvas.elt.getBoundingClientRect();

    return (this._bb instanceof DOMRect) ?
      (
        x > this._bb.left &&
        x < this._bb.right &&
        y > this._bb.top &&
        y < this._bb.bottom
      ) : false;
  }

  /**
   * Is the user (_over) over the component?
   * @param  {CircuitItem} c    Component
   * @return {Boolean}
   */
  public isOver(c: CircuitItem): boolean {
    return this._over === c;
  }

  /**
   * Remove a given circuitItem
   * @param  {CircuitItem} item
   */
  public removeItem(item: CircuitItem): void {
    // Remove from respective arrays
    if (item instanceof Component) {
      utils.arrRemove<Component>(item, item.circuit.components);
      utils.arrRemove<Component>(item, this.components);
    } else if (item instanceof Wire) {
      utils.arrRemove<Wire>(item, item.circuit.wires);
      utils.arrRemove<Wire>(item, this.wires);
    }

    // Make sure e are not hovering or anything
    if (this._over === item) this._over = null;
    if (this._selected === item) this._selected = null;

    if (Controls.componentShowingInfo === item) {
      Controls.analyse(null);
    }
  }


  public static MIN_TEMP: number = -50;
  public static MIN_TEMP_COLOUR: [number, number, number] = [0, 0, 250];
  public static MAX_TEMP: number = 100;
  public static MAX_TEMP_COLOUR: [number, number, number] = [250, 0, 0];

  public static SNAP_COMPONENT: number = 10;
  public static SNAP_WIRE: number = 4;

  /**
   * given a temperature, return the given radius of influence
   * @param  {Number} deg Temperature in degrees C
   * @return {Number}     Radius in px
   */
  public static calcTempRadius(deg: number): number {
    return deg * 5;
  }

  /**
   * Given a brightness, return the given radius of influence
   * @param  {Number} lumen Brightness in lumens
   * @return {Number}       Radius in px
   */
  public static calcLumenRadius(lumen: number): number {
    return lumen;
  }
}

// View modes of control
export enum ControlMode {
  Normal,
  Light,
  Heat
}

export default Control;