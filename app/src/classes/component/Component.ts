import * as utils from 'assets/utils';
import Control, { ControlMode } from 'classes/control';
import type Circuit from 'classes/circuit';
import CircuitItem from 'classes/circuitItem';
import Wire from 'classes/wire';
import { IConnectionData, IComponentData, IAdditionalComponentData } from 'models/saveData';
import { ConnectionError } from 'classes/errors';
import p5 from 'p5';
import Sounds from 'assets/sounds';
import Popup, { PopupMode } from 'classes/popup';
import { Direction, CircuitExec } from 'models/enum';
import Page from 'page/index';
import IConfig from 'models/Config';
import { IComponentInfo } from 'models/ComponentInfo';
import Vars from 'page/vars';

var nextID: number = 0;

/**
 * Template to all components
 *
 * @property _x             x position of the Cell
 * @property _y             y position of the Cell
 * @property _w             Width of the bounding box
 * @property _h             Height of the bounding box
 * @property _outputCount   How many outputs are there?
 * @property _outputMax     How many outputs can this be connected to?
 * @property _outputs       Array of components that this is connected to (output)
 * @property _inputCount    How many inputs are there?
 * @property _inputMax      How many inputs can this be connected to?
 * @property _inputs        Array of components that this is connected to (input)
 * @property _angle         Angle of rotation (radians)
 * @property _lightRecieving Light (lumens) that this component is recieving
 * @property _externalTemp  External temperature
 * @property _lpw           Lumens per Watt
 * @property _maxCurrent    Maximum current we can handle
 * @property _blown         Is this component blown?
 * @property _voltage       Is this component emitting a fixed voltage (if not NaN, is a power source)
 *
 * @property resistance         Components' resistance
 * @property (readonly) voltage The voltage across the component
 * @property current            Get current running through the component
 * @property maxCurrent         What is the max current this component can handle?
 * @property direction          Get direction of power source
 * @property configPopup        Popup for configuration
 *
 * @method toString()           String representation of object
 * @method move(x, y)           Change coordinates of component
 * @method pos()                Get {x, y} position of component
 * @method render(fn)           Render wrapper
 * @method rotate(deg)          Rotate by x degrees
 * @method contains(x, y)       Are the provided [x, y] inside this component?
 * @method distSq(component)    Return distance squared to the provided component
 * @method connectTo(component) Attempt to connect this to a component
 * @method pushConnection()     Add connection directly. Used by <Connector>
 * @method getInputCoords()     Coordinates to connect the input from.
 * @method getOutputCoords()    Coordinates to connect the output to.
 * @method getData()            Get data for this component
 * @method apply(data)          Apply a settings interface to this object
 * @method isOn()               Is this component being 'on'?
 * @method isLuminous()         Is this component luminous?
 * @method isBlowable()         Is this component able to be blown?
 * @method isBlown()            Is this component 'blown'
 * @method isPowerSource()      Is this component a power source?
 * @method isConnector()        Is this component a connector?
 * @method blow()               Blow the component
 * @method power()              Calculate wattage of component
 * @method flip()               Flip direction of power source
 * @method luminoscity()        Get lumens (only with components with _lpw property)
 * @method lightRecieving()     How many lumens is this component recieving from the surroundings?
 * @method getHeat(t)           Calculate heat of conduction through component
 * @method heatRecieving()      How many degrees celcius is this component recieving from the surroundings?
 * @method passable()           Is thie component 'passable' (i.e. not blown, shut etc...)
 * @method traceForward(c)      Trace through the circuit until reached component
 * @method traceBackward(c)     Trace through the circuit backwards until reached component
 * @method roundTrip(v)         Find the round trip and calculate stuff from it (v)
 * @method remove()             Remove the component
 * @method _updateConfigPopup() Update config popup
 * @method openConfigPopup()    Update and open the config popup
 * @method onClick(e)           Event for canvas, when user clicks on component
 * @method onMouseEnter()       Event for canvas, when mouse enters the component
 * @method onMouseLeave()       Event for canvas, when mouse leaves the component
 * @method onScroll(e)          Event for camvas, when user scrolls over component
 */
export class Component extends CircuitItem {
  public readonly configOptions: IConfig[] = [];
  public configPopup: Popup;

  protected _id: number;
  protected _x: number = -1; // X-position of component
  protected _y: number = -1; // Y-position of component
  protected _w: number = 0; // Width of component
  protected _h: number = 0; // Height of component
  protected _outputCount: number = 0; // How many outputs do we have?
  protected _outputMax: number = 1; // How many outputs can we have?
  protected _outputs: Wire[] = []; // Array of output connections
  protected _inputCount: number = 0; // How many inputs do we have?
  protected _inputMax: number = 1; // How many inputs can we have?
  protected _inputs: Wire[] = []; // Array of input connections
  protected _angle: number = 0; // Angle of rotation (radians)
  protected _lightRecieving: number = 0; // External light we are recieving
  protected _externalTemp: number; // External heat we are recieving
  protected _resistance: number = 0; // Resistance of component
  protected _current: number = 0; // Current through component

  protected _lpw: number = NaN; // Lumens per watt (luminous components only). NaN = not luminous
  protected _maxCurrent: number = NaN; // Max current we can handle before blowing. NaN = not able to be blown
  protected _blown: boolean = false; // Are we blown?
  protected _voltage: number = NaN; // Voltage emitting. !NaN = power source

  public constructor(parentCircuit: Circuit) {
    super(parentCircuit);

    this._id = nextID++;
    this._externalTemp = this.control.temperature();

    this._w = Component.DEFAULT_WIDTH;
    this._h = this._w;

    this.configPopup = new Popup("Configure " + this.toString(), "No configuration options are available at the moment.")
      .autoDelete(false);
  }

  public get id(): number { return this._id; }
  public get inputs(): Wire[] { return [...this._inputs]; }
  public get outputs(): Wire[] { return [...this._outputs]; }
  public get lumensPerWatt(): number { return this._lpw; }
  public get direction(): Direction | null {
    if (this.isPowerSource()) {
      // Right-facing is positive
      return this._voltage < 0 ? Direction.Right : Direction.Left;
    } else { return null; }
  }

  // Sanitise resistance input
  public get resistance(): number { return this._resistance; }
  public set resistance(r: number) {
    if (typeof r !== "number" || isNaN(r)) return;
    if (r <= 0) r = Component.ZERO_RESISTANCE;
    this._resistance = r;
  }

  // Return voltage emitting, else calculate voltage across component; V = IR
  public get voltage(): number {
    return this.isPowerSource() ? this._voltage : this.current * this.resistance;
  }

  public get current(): number { return this._current; } // Current running through component
  public set current(c: number) { this._current = c; }

  public get maxCurrent(): number { return this._maxCurrent; } // Max current this component can handle
  public set maxCurrent(v: number) {
    if (!this.isBlowable() || typeof v !== "number" || isNaN(v)) return;
    if (v <= 0) v = 1;
    this._maxCurrent = v;
  }

  public setCurrent(c: number): void {
    this._current = c;
  }


  /**
   * Return string representation of component
   * @return {String} name + '#' + id
   */
  public toString(): string {
    return this.constructor.name + "#" + this.id;
  }

  /**
   * Move position of component
   * @param {Number} x X coordinate of the Cell
   * @param {Number} y Y coordinate of the Cell
   * @return {Component}    Return this (chainable
   */
  public move(x: number, y: number): Component {
    let pad: number = this._w / 2;
    [this._x, this._y] = this.control.clampCoords(x, y, pad);
    return this;
  }

  /**
   * Get position of component
   * @return {Number[]}
   */
  public pos(): [number, number] {
    return [this._x, this._y];
  }

  /**
   * Evaluate component
   * @param {Function} fn         Contains customised evaluating info
   */
  public eval(fn?: (circuitBroken: boolean) => void): void {
    const isBlown = this.isBlown();
    const isCircuitBroken = this.circuit.isBroken();

    // Is circuit broken (once broken, always broken)
    if (!isCircuitBroken && isBlown) {
      this.blow();
    }

    if (typeof fn === "function") fn(isCircuitBroken);

    // Bubble forward
    for (let component of this._outputs) {
      if (component.output == this.circuit.control.head) break;
      if (typeof component.output.eval === "function") {
        component.output.eval();
      }
    }
  }

  /**
   * Render wrapper
   * @param {Function} fn         Contains personalised rendering info
   */
  render(fn?: (p: p5, colour: p5.Color, circuitRunning: boolean) => void): void {
    if (!Page.isLoaded) {
      console.warn("Please wait for the oage to load before rendering...");
      return;
    }

    const p: p5 = this.p5;

    // Sort out connections
    for (let i = 0; i < this._outputs.length; i++) {
      this._outputs[i].render();
    }

    p.push();
    p.translate(this._x, this._y);

    if (this.control.mode === ControlMode.Light && this.isLuminous() && this.isOn()) {
      // DRAWING LIGHT SPHERE WAS SORTED OUT BEFOREHAND
    } else if (this.control.mode === ControlMode.Heat && this.constructor.name === "Heater" && (<any>this).temp() != "0°C") {
      // DRAWING HEAT SPHERE WAS SORTED OUT BEFOREHAND
    } else {
      /* Else, draw as normal */
      // Function - assitional render code
      if (typeof fn === "function") {
        let colour = p.color(51);
        if (this.control.mode !== ControlMode.Normal) colour = p.color(150);
        if (this.highlighted) {
          colour = p.color(200, 115, 80);
        } else if (this._blown) {
          colour = p.color(255, utils.randomInt(50, 200), 0);
        }

        fn(p, colour, this.control.isRunning); // Other rendering shenanigans
      }

      if (this.debug) {
        // Show angle
        p.fill(255, 0, 0);
        p.noStroke();
        p.circle(0, 0, 5);

        p.noFill();
        p.stroke(0, 0, 255);
        p.line(0, 0, ...utils.polToCart(this._angle, this._w));

        // Bounding box
        p.stroke(255, 0, 255);
        p.rect(0, 0, this._w, this._h);

        if (this.highlighted) {
          p.noFill();
          p.strokeWeight(0.5);
          p.text("#" + this._id, -this._w / 2, -this._h / 2);
        }
      }
    }

    p.pop();
  }

  /**
   * Rotate component by x degrees, from 0, or get angle
   * @param  {Number} deg     Degrees to rotate by
   * @return {Number}     New rotation angle (radians)
   */
  public rotate(angleMode: "deg" | "rad", newAngle?: number): number {
    if (newAngle !== undefined) {
      this._angle = angleMode === "deg" ? utils.deg2rad(newAngle) : newAngle;
      return newAngle;
    } else {
      return angleMode === "deg" ? utils.rad2deg(this._angle) : this._angle;
    }
  }

  /**
   * Are the provided (x, y) coordinates inside this component?
   * @param  {Number} x X coordinate to test
   * @param  {Number} y Y coordinate to test
   * @return {Boolean}  Does this component contain the given coordinates?
   */
  public contains(x: number, y: number): boolean {
    const dx: number = this._w / 2;
    const dy: number = this._h / 2;
    return (
      x > this._x - dx &&
      x < this._x + dx &&
      y > this._y - dy &&
      y < this._y + dy
    );
  }

  /**
   * Return distance (squared) between this and component
   * @param  {Component} component Component
   * @return {Number}             Distance squared
   */
  public distSq(component: Component): number {
    const dx: number = component._x - component._w - (this._x + this._w);
    const dy: number = component._y - this._y;
    const d: number = (dx * dx) + (dy * dy); // Pythag without sqrt as its a slow operation
    return d;
  }

  /**
   * Attempt to connect this to a component
   * this -> component
   * @param  {Component} component Component to connect
   * @param  {Number[][]} wirePath Path of point for the path
   * @param  {IConnectionData} data         Additional wire data
   * @return {Wire}                Wire created
   */
  public connectTo(component: Component, data?: IConnectionData): Wire | null {
    if (!(component instanceof Component)) throw new ConnectionError(`Cannot connect component to a non-component`);
    if (component === this) throw new ConnectionError(`Cannot connect component: cannot connect to oneself. ` + component.toString() + "->" + this.toString());

    // Check that connections between these two doesn't already exist
    for (let conn of this._outputs) {
      if (conn instanceof Wire && conn.output == component) {
        throw new ConnectionError(`Cannot connect component: already connected to component (output).` + component.toString() + "->" + this.toString());
      }
    }
    // for (let conn of this._inputs) {
    //     if (conn instanceof Circuit.Wire && conn._input == component) {
    //         console.warn(`Cannot connect component: already connected to component (input).`, component, '->', this);
    //         return;
    //     }
    // }

    // Create connection is possible
    let circuit: Circuit = this.circuit; //Circuit that we are connecting in

    /** == If connecting FROM junction == **/
    if (this.isConnector() && !component.isConnector()) {
      /** == At the end. Elevate component back to original circuit **/
      if ((<any>this).isEnd) {
        // console.log("Connect FROM (isEnd): ", circuit, this.toString(), "->", component.toString());
        circuit = this.circuit;
      } else {
        // console.log("Connect FROM (!isEnd): ", circuit, this.toString(), "->", component.toString());

        /** == Is not the end: beginning. Set-up conn to sub-circuit **/
        // Get which output this is
        const outputNo: number = this._outputCount;

        if (outputNo === 0) {
          return (<any>this).setupConn1(component, data);
        } else if (outputNo === 1) {
          return (<any>this).setupConn2(component, data);
        } else {
          console.warn(`Cannot connect component: connector may only have 2 connections.`, this);
          return null;
        }
      }
    }

    /** == If connecting TO junction, set up connection from sub-circuit == **/
    // If this' circuit's depth is above 0 and the circuit we are in is component._circuit...
    else if (component.isConnector() && !this.isConnector() && this.circuit.depth > 0) {
      // console.log("Connect TO: ", circuit, this.toString(), "->", component.toString());

      // Original circuit must be depth - 1, so find that
      const originalDepth: number = this.circuit.depth - 1;
      let originalCircuit: Circuit | null = null;
      for (let i = this.control.components.length - 1; i >= 0; i--) {
        const component: Component = this.control.components[i];
        if (component.circuit != null && component.circuit.depth === originalDepth) {
          originalCircuit = component.circuit;
          break;
        }
      }

      // Continue back to normal if originalCircuit not found
      if (originalCircuit != null) {
        circuit = originalCircuit;
        (<any>component).end(); // End of line for Connector
      } else {
        throw new ConnectionError(`Original circuit could not be found (depth: ${originalDepth})`);
      }
    }

    // No special connections here; must abide by rules
    else if (this._outputCount > this._outputMax && component._inputCount > component._inputMax) {
      console.warn(`Cannot connect component: too many connections: ${this._outputCount} < ${this._outputMax} && ${component._inputCount} < ${component._inputMax} (${this.toString()} -> ${component.toString()})`);
      return null;
    }

    // Default connection
    const wire: Wire = new Wire(circuit, this, component, data);
    // console.log("Connect Normally: ", circuit, this.toString(), "->", component.toString());

    this._outputCount++;
    this._outputs.push(wire);

    component.circuit = circuit;
    component._inputs.push(wire);
    component._inputCount++;

    circuit.components.push(component);
    circuit.wires.push(wire);
    this.control.wires.push(wire);

    return wire;
  }

  /**
   * Directly add connection
   * @param  {String} conn  Which connection?
   * @param  {Wire} wire    Wire to add
   */
  public pushConnection(conn: "input" | "output", wire: Wire): void {
    if (conn === "input") {
      this._inputs.push(wire);
      this._inputCount++;
    } else if (conn === "output") {
      this._outputs.push(wire);
      this._outputCount++;
    } else {
      throw new TypeError(`Invalid enum value for conn: '${conn}'`);
    }
  }

  /**
   * Connect coordinates for inputs
   * - Should be overridden for each component, but here just in case :)
   * @param  {Number} no  Input number
   * @return {Number[]} Coordinates [x, y]
   */
  public getInputCoords(no?: number): [number, number] {
    const move = utils.polToCart(this._angle, -this._w / 2);
    return [this._x + move[0], this._y + move[1]];
  }

  /**
   * Connect coordinates for outputs
   * - Should be overridden for each component, but here just in case :)
   * @param  {Number} no  Input number
   * @return {Number[]} Coordinates [x, y]
   */
  public getOutputCoords(no?: number): [number, number] {
    const move = utils.polToCart(this._angle, this._w / 2);
    return [this._x + move[0], this._y + move[1]];
  }

  /**
   * Get data for this component
   * @param  {IAdditionalComponentData} customData Additional data
   * @return {IComponentData} JSON data
   */
  public getData(customData?: IAdditionalComponentData): IComponentData {
    let data: IComponentData = {
      type: this.constructor.name,
      pos: [this._x, this._y],
      data: customData,
      conns: []
    };

    if (data.data === undefined) data.data = {};
    if (this._angle !== 0) data.data.angle = this._angle;

    // Depending on purpose, add different things
    if (this.isBlowable()) {
      data.data.maxCurrent = this._maxCurrent;
    }
    if (this.isLuminous()) {
      data.data.lpw = this._lpw;
    }
    if (this.isPowerSource()) {
      data.data.voltage = this._voltage;
    }

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

    if (data.data != null && Object.keys(data.data).length === 0) delete data.data;

    return data;
  }

  /**
   * Apply a settings interface to this object
   * @param  {IAdditionalComponentData} data
   * @return {Component} this
   */
  public apply(data: IAdditionalComponentData): Component {
    if (this.isBlowable()) {
      if (typeof data.maxCurrent === 'number' && !isNaN(data.maxCurrent)) this._maxCurrent = data.maxCurrent;
    }

    if (this.isLuminous()) {
      if (typeof data.lpw === 'number' && !isNaN(data.lpw)) this._lpw = data.lpw;
    }

    if (this.isPowerSource()) {
      if (typeof data.voltage === 'number' && !isNaN(data.voltage)) this._voltage = data.voltage;
    }
    return this;
  }

  /**
   * Is this component 'on'?
   */
  public isOn(): boolean {
    return this._current !== 0 && !this._blown;
  }

  /**
   * Is this component luminous?
   */
  public isLuminous(): boolean {
    return !isNaN(this._lpw);
  }

  /**
   * Is this component blowable (able to be blown)?
   */
  public isBlowable(): boolean {
    return !isNaN(this._maxCurrent);
  }

  /**
   * Is this component blown?
   * @return {Boolean} Blown?
   */
  public isBlown(): boolean {
    if (this.isBlowable()) {
      return (
        this._blown ||
        Math.abs(this.current) > this.maxCurrent ||
        Math.abs(this.current) > Number.MAX_SAFE_INTEGER
      );
    } else {
      return this._blown; // Still give non-blowable components ability to be blown.
    }
  }

  /**
   * Is this component a power source?
   */
  public isPowerSource(): boolean {
    return !isNaN(this._voltage);
  }

  /**
   * Is this component a connector?
   */
  public isConnector(): boolean {
    return false;
  }

  /**
   * Blow the component
   * @param {String} msg  Msg to show to user
   */
  public blow(msg?: string) {
    if (typeof msg !== "string") {
      if (this.isBlown()) {
        msg = `Component ${this.toString()} blew on ${this.current}A, exceeding its limit of ${this.maxCurrent}A`;
      } else {
        msg = `Component ${this.toString()} was manually blown`;
      }
    }

    this.circuit.break(this);

    if (!this._blown) {
      this._blown = true;
      Sounds.Play("Blow");
      this.control.updateLightLevel();
    }

    if (ShowPopupOnBlow) {
      new Popup("Component Blew!", msg, "Refresh the webpage to repair component")
        .mode(PopupMode.Error)
        .extraButton("Reload Page", () => window.location.reload())
        .open();
    } else {
      console.log("%c" + msg, "font-size: 1.1em; color: magenta; font-weight: bold;");
    }
  }

  /**
   * Calculate wattage (power) of component
   * W = V * I
   * @return {Number} Component's wattage (in W, J/s)
   */
  public power(): number {
    if (!this.isOn()) return 0;
    const v: number = this.voltage;
    const i: number = this.current;
    return v * i;
  }

  /**
   * Flip direction of power source
   * @param  {Boolean} playSound Should we play the toggle sound?
   * @return {Direction} direction of power source
   */
  public flip(playSound: boolean = false): Direction | null {
    if (this.isPowerSource()) {
      // Flip voltage
      this._voltage *= -1;

      this.circuit.unlockAllDiodes();
      if (playSound && Page.playSounds) Sounds.Play("toggle-" + (this._voltage >= 0 ? "off" : "on"));
      this.control.updateLightLevel();
      return this.direction;
    } else {
      return null;
    }
  }

  /**
   * Calculate luminoscity of component
   * - Only works with luminous components (if component has _lpw property)
   * ΦV(lm) = P(W) * η(lm/W)
   * @return {Number} Component's wattage
   */
  public luminoscity(): number {
    if (isNaN(this._lpw) || !this.isOn()) return 0;
    const P: number = this.power();
    const η: number = this._lpw;
    const ΦV: number = P * η;
    return ΦV;
  }

  /**
   * How much light is this component receivng from the surroundings?
   * @param  {Boolean} update   Update this._lightRecieving?
   * @return {Number} Light level (lumens)
   */
  public lightRecieving(update: boolean = false): number {
    if (!update) return this._lightRecieving;

    // Assemble array of all luminous components
    let luminous: Component[] = [];
    this.control.components.forEach((c) => {
      if (c.isLuminous()) luminous.push(c);
    });

    const backgroundLight: number = this.control.lightLevel();
    if (luminous.length > 0) {
      // Get all components which are shining on me
      let shining: number[] = [backgroundLight];
      for (let comp of luminous) {
        const d: number = this.distSq(comp) - this._w ** 2;
        const lumens: number = comp.luminoscity();
        const radius: number = Control.calcLumenRadius(lumens);
        if (d < radius ** 2) {
          // Calculate heat at a distance
          const sqrtD: number = Math.sqrt(d);
          const fract: number = (radius - sqrtD) / radius; // Percentage into sphere
          const brightness: number = fract * lumens; // Multiply distance of penetration by lumens
          shining.push(backgroundLight + brightness);
        }
      }

      // Calculate combined brightness
      shining = shining.filter(n => !isNaN(n));
      let avg: number = shining.reduce((acc, current) => acc + current);
      if (isNaN(avg)) avg = backgroundLight;

      // Update if asked for
      if (update) this._lightRecieving = avg;

      return avg;
    } else {
      // No luminous components; return ambient light
      if (update) this._lightRecieving = backgroundLight;
      return backgroundLight;
    }
  }

  /**
   * Calculate heat due to conduction through the component, given t (time in seconds)
   * - Called Joule's Equation of Electrical Heatomg
   * @param  {Number} t Time (conduction time)
   * @return {Number}   The heat energy in Joules
   */
  public getHeat(t: number = 1): number {
    const i = this.current;
    const r = this.resistance;
    return i * i * r * t;
  }

  /**
   * How many degrees celcius are we reciecing from the surroundings?
   * @param  {Boolean} update   Update this._lightRecieving?
   * @return {Number} External heat reciving
   */
  public heatRecieving(update: boolean = false): number {
    if (!update) return this._externalTemp;

    // Get all heat-emmitent components
    const emitters: Component[] = [];
    this.control.components.forEach((c) => {
      if (c.constructor.name === 'Heater') emitters.push(c);
    });

    const backgroundTemp: number = this.control.temperature();
    if (emitters.length > 0) {
      // Get all components which are in temperature range of me
      let temps: number[] = [backgroundTemp];
      for (let comp of emitters) {
        const d: number = this.distSq(comp);
        const deg: number = (<any>comp).degreesCelcius;
        const radius: number = Control.calcTempRadius(deg);
        if (d < radius ** 2) {
          // Calculate heat at a distance
          const sqrtD: number = Math.sqrt(d);
          const fract: number = (radius - sqrtD) / radius;
          const temp: number = fract * deg;
          temps.push(backgroundTemp + temp);
        }
      }

      // Calculate maximum temperature
      const max = temps.length === 1 ? temps[0] : Math.max(...temps);

      if (update) this._externalTemp = max;
      return max;
    } else {
      // No heat emitters; return background temp
      return backgroundTemp;
    }
  }

  /**
   * Is this component passable (used in traces)?
   * @return {Boolean} true/false
   */
  public passable(): boolean {
    return !this.isBlown() && !this.circuit.brokenByMe(this);
  }

  /**
   * Trace forwards to a component
   * @param  {Component} component Component we're trying to find
   * @param  {Number} [depth=0]    Current recursion depth !! INTERNAL USE ONLY !!
   * @return {Component[]}         Array of trace components
   */
  public traceForward(component: Component, depth: number = 0): Component[] | null {
    if (depth !== 0 && this === component) return [];
    if (!this.passable()) return null;

    for (let wire of this._outputs) {
      if (wire instanceof Wire) {
        let result: Component[] | null = wire.output.traceForward(component, depth + 1);

        if (result != null) return depth === 0 ? result : [this, ...result];
      }
    }

    return null;
  }

  /**
   * Trace backwards to a component
   * @param  {Component} component Component we're trying to find
   * @param  {Number} [depth=0]    Current recursion depth !! INTERNAL USE ONLY !!
   * @return {Component[]}         Array of trace components
   */
  public traceBackward(component: Component, depth: number = 0): Component[] | null {
    if (depth !== 0 && this === component) return [component];
    if (!this.passable()) return null;

    let path: Component[] = [this];
    for (let wire of this._inputs) {
      if (wire instanceof Wire) {
        let result: Component[] | null = wire.input.traceBackward(component, depth + 1);
        if (result != null) {
          path = path.concat(result);
          return path;
        }
      }
    }
    return null;
  }

  /**
   * Trace logically to a component
   * @param  {Component} component Component we're trying to find
   * @param  {Boolean} checkPassable  Check is component is passable (basically, should electricity be able to do this route?)
   * @param  {Boolean} isRestrained Is the trace restrained to only go forward (true), or can we go backwards as well (false)?
   * @param  {Number} [depth=0]    Current recursion depth !! INTERNAL USE ONLY !!
   * @param  {Wire[]} [scannedWires=null] Array of scanned wires !! INTERNAL USE ONLY !!
   * @return {Component[]}         Array of trace components
   */
  public trace(component: Component, checkPassable: boolean = true, isRestrained: boolean = true, depth: number = 0, scannedWires: Wire[] = []): Component[] | null {
    if (depth !== 0 && this === component) return [];

    // Is component passable?
    if (checkPassable && !this.passable()) {
      // console.log("Broke on", this);
      return null;
    }

    // Only get shorted path
    let shortest_length: number = Number.MAX_SAFE_INTEGER;
    let shortest_path: Component[] | null = null;

    // Array of components to scan, and which property to access in Wire object
    let toScan = isRestrained ? this._outputs : [...this._outputs, ...this._inputs];

    for (let i = 0; i < toScan.length; i++) {
      let wire: Wire = toScan[i];
      let comp: Component = ((!isRestrained && i >= this._outputs.length) ?
        // If not restrained, scanning both inputs and outputs.
        // After scanned outputs, switch to inputs, and so change wire property to access as well.
        wire.input :
        wire.output);

      if (wire instanceof Wire) {
        // Should we skip?
        {
          let skip: boolean = false;
          skip = scannedWires.indexOf(wire) !== -1;

          // If TwoWaySwitch, only scan the _exec circuit
          if (this.constructor.name === "TwoWaySwitch") {
            const twoWaySwitch: any = <any>this; // TwoWaySwitch, but importing will result in circular import
            skip = skip || (twoWaySwitch._exec === CircuitExec.One && comp.circuit === twoWaySwitch._circuit2);
            skip = skip || (twoWaySwitch._exec === CircuitExec.Two && comp.circuit === twoWaySwitch._circuit1);
          }

          if (skip) continue;
        }

        scannedWires.push(wire);
        let result: Component[] | null = comp.trace(component, checkPassable, isRestrained, depth + 1, [...scannedWires]);

        if (result !== null && result.length < shortest_length) {
          shortest_length = result.length;
          shortest_path = result;
        }
      }
    }

    if (shortest_path == null) {
      return null;
    } else {
      return depth === 0 ? shortest_path : [this, ...shortest_path];
    }
  }

  /**
   * Remove component
   * @return {Component} this
   */
  public remove(): Component {
    for (let input of this._inputs) input.remove();
    for (let output of this._outputs) output.remove();

    this.control.removeItem(this);
    return this;
  }

  /**
   * Remove wire from a given input/output array
   * @param  {Wire} wire  Wire to remove]
   * @param  {String} Xput  Input or Output
   * @return {Boolean} Was the wire removed?
   */
  public removeWire(wire: Wire, Xput: "input" | "output"): boolean {
    let removed: boolean = false;
    if (Xput === "input") {
      removed = utils.arrRemove<Wire>(wire, this._inputs);
      if (removed) this._inputCount--;
    } else if (Xput === "output") {
      removed = utils.arrRemove<Wire>(wire, this._outputs);
      if (removed) this._outputCount--;
    }
    return removed;
  }

  /**
   * Update configPopup
   */
  protected _updateConfigStuff(clear: boolean = true): void {
    if (this.configOptions.length === 0) {
      this.configPopup.htmlContent = null;
      this.configPopup.msg(this.constructor.name + " is not configurable.");
    } else {
      this.configPopup.msg("");
      this.configPopup.htmlContent = document.createElement("center");

      const table: HTMLTableElement = document.createElement("table");
      table.setAttribute("border", "1");
      table.style.borderCollapse = "collapse";
      table.insertAdjacentHTML('beforeend', '<tr><th>Field</th><th>Value</th></tr>');

      for (let config of this.configOptions) {
        const row: HTMLTableRowElement = document.createElement("tr");
        row.appendChild(config.th);
        row.appendChild(config.td);
        table.appendChild(row);
      }

      this.configPopup.htmlContent.appendChild(table);
    }
  }

  /**
   * Update and open the configuration popup
   */
  public openConfigPopup(): void {
    this._updateConfigStuff();
    this.configPopup.open();
  }

  /**
   * Canvas-triggered events (see control.ts)
   */
  public onMouseDown(event: MouseEvent): void { }
  public onMouseUp(event: MouseEvent): void { }

  public onMouseEnter(event: MouseEvent): void { }
  public onMouseLeave(event: MouseEvent): void { }
  public onScroll(event: WheelEvent): void { }

  public static SMALL_TEXT: number = 11.5; // Text size for volts etc...
  public static readonly DEFAULT_WIDTH: number = 50; // Default width of component
  public static readonly ZERO_RESISTANCE: number = 1e-10; // "0" resistance to stop things breaking
  public static readonly LOW_RESISTANCE: number = 0.001; // "Low" resistance for e.g. ammeter. Not actually zero, but so small it is considered irrelevant.
  public static readonly INFIN_RESISTANCE: number = 7500000000000000; // "Infinite" resistance (max safe integer a float can represent and still so maths on)

  /**
   * Find angle between two components in radians
   * https://math.stackexchange.com/questions/1201337/finding-the-angle-between-two-points
   */
  public static angleBetween(c1: Component, c2: Component, degrees: boolean = false): number {
    const coords1: [number, number] = c1.getOutputCoords();
    const coords2: [number, number] = c2.pos();

    const dx: number = Math.abs(coords2[0] - coords1[0]);
    const dy: number = Math.abs(coords2[1] - coords1[1]);
    const angle: number = Math.atan(dx / dy);
    // console.log(`(${c2._x}, ${c2._y}) - (${c1._x}, ${c2._y}) => (${dx}, ${dy}).\n${dx} / ${dy} = ${angle}`);
    return degrees ? utils.rad2deg(angle) : angle;
  }
}

const ShowPopupOnBlow = true;

export default Component;