import * as utils from 'assets/utils';
import { Control, ControlMode } from './control';
import Circuit from './circuit';
import CircuitItem from './circuitItem';
import Component from './component/Component';
import { IConnectionData } from 'models/saveData';
import IMaterial from 'models/material';
import p5 from 'p5';
import Vars from 'page/vars';

/**
 * Wire - a connection between two components
 *
 * @property x1
 * @property y1
 * @property x2
 * @property y2
 * @property _path                      Extra points in the wire's path
 * @property hasResistance             Does this wire have resistance?
 * @property _material                  Determines the wires resistance, when hasResistance === true
 * @property _r                         Radius of cross-section of wire
 * @property (readonly) resistance      Get resistance of wire
 * @property (readonly) length          Get length of wire (px)
 * @property (readonly) material        Get materials name
 *
 * @method toString()       String representation of wire
 * @mathod volume()         Get volume of wire in cm or px
 * @method contains(x, y)   Are the provided coordinates on the wire?
 * @method render()         Render the connection to the global canvas
 * @method remove()         Remove the connection
 * @method radiusPx()       Get / Set radius in px
 * @method radiusCm()       Get / Set radius in cm
 * @method onHandle(x, y)   Is the given (x, y) on a handle?
 * @method addHandle(x, y)  Add handle at (x, y)
 * @method removeHandle(h)  Remove the given handle (result from onHandle)
 * @method insertComponent(c)   Insert component. If on wire, split it
 * @method getData()        Get data resembling this wire
 */

export class Wire extends CircuitItem {
  public input: Component; // Input to wire
  public output: Component; // Output of wire
  public hasResistance: boolean = false;

  private _path: number[][] = [];
  private _material: number = Wire.MATERIALS_KEYS.indexOf("copper");
  private _r: number = Wire.DEFAULT_RADIUS;

  protected static _prototypeChain: string[] = [...CircuitItem._prototypeChain, "Wire"];

  public constructor(parentCircuit: Circuit, input: Component, output: Component, initData?: IConnectionData) {
    super(parentCircuit);

    this.input = input;
    if (!(this.input instanceof Component)) throw new TypeError(`Wire: cannot resolve argument 'input' to a Component instance`);

    this.output = output;
    if (!(this.output instanceof Component)) throw new TypeError(`Wire: cannot resolve argument 'output' to a Component instance`);

    // Load data if present
    if (initData !== undefined) {
      this._path = initData.path;
      if (initData.material !== undefined) this._material = initData.material;
      if (initData.r !== undefined) this._r = initData.r;
    }

    // Is path OK?
    if (!Array.isArray(this._path)) throw new TypeError(`Wire: invalid path: path must be array, got ${this._path}`);

    if (this._path.length !== 0) {
      for (let point of this._path) {
        if (!Array.isArray(point) || point.length !== 2) throw new TypeError(`Wire: invalid path: path must be array of number[2], got '${point}'`);
      }
    }
  }

  public get x1(): number { return this.input.getOutputCoords()[0]; }
  public get y1(): number { return this.input.getOutputCoords()[1]; }
  public get x2(): number { return this.output.getInputCoords()[0]; }
  public get y2(): number { return this.output.getInputCoords()[1]; }

  public get materialName(): string { return Wire.MATERIALS_KEYS[this._material]; }
  public set materialName(name: string) {
    const index: number = Wire.MATERIALS_KEYS.indexOf(name);
    if (index === -1) {
      throw new TypeError(`set materialName: unknown material '${name}'`);
    } else {
      this._material = index;
    }
  }

  public get materialIndex(): number { return this._material; }
  public set materialIndex(index: number) { this._material = utils.clamp(index, 0, Wire.MATERIALS_KEYS.length); }

  // Get resistance of wire. If hasResistance, dependant upon material
  public get resistance(): number {
    if (this.hasResistance) {
      const info: IMaterial = Wire.MATERIALS[this._material];
      let r = info.resistance;
      r = (r < 0) ? (r / this.volume(true)) : (r * this.volume(true));
      return r;
    } else {
      return 0;
    }
  }

  // Get length of wire in pixels
  public get length() {
    let length: number = 0;

    if (this._path.length === 0) {
      const c1: number[] = this.input.getOutputCoords();
      const c2: number[] = this.output.getInputCoords();

      length = utils.distance(c1[0], c1[1], c2[0], c2[1]);
    } else {
      const path: number[][] = [
        this.input.getOutputCoords(),
        ...this._path,
        this.output.getInputCoords()
      ];

      for (let i = 0; i < path.length - 2; i++) {
        length += utils.distance(path[i][0], path[i][1], path[i + 1][0], path[i + 1][1]);
      }
    }
    return length;
  }

  /**
   * Strigng representation of wire
   * @return {String}
   */
  public toString(): string {
    let str: string = 'Wire#' + this.input.id + ':' + this.output.id;
    if (this.hasResistance) str = utils.nicifyString(this.materialName, '') + str;
    return str;
  }

  /**
   * Get volume of wire in cm
   * - volume of cylinder = π(r**2)h
   * @param  {Boolean} inCm   CM (true) or PX (false)?
   * @return {Number} Volume in PX or CM
   */
  public volume(inCm: boolean = false): number {
    const h: number = (inCm) ? (this.length / this.control.pixelsPerCm) : this.length;
    const r: number = (inCm) ? (this._r / this.control.pixelsPerCm) : this._r;
    return Math.PI * Math.pow(r, 2) * h;
  }

  /**
   * Are the provided (x, y) coordinates on this wire?
   * @param  {Number} x X coordinate to test
   * @param  {Number} y Y coordinate to test
   * @return {Boolean}
   */
  public contains(x: number, y: number): boolean {
    const delta = (this.hasResistance) ? (this._r / 2) : Wire.DEFAULT_RADIUS;

    let on: boolean = false;
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
        if (utils.isNearLine(p[i][0], p[i][1], p[i + 1][0], p[i + 1][1], x, y, delta)) {
          on = true;
          break;
        }
      }
      // console.log("MULTIPLE: ", on);
    }
    return on;
  }

  /**
   * Render the connection
   */
  public render() {
    const p: p5 = this.p5;

    p.strokeWeight(this.hasResistance ? this._r / 2 : Wire.DEFAULT_RADIUS);

    if (this.highlighted) {
      p.stroke(200, 115, 80);
    } else if (this.control.mode === ControlMode.Normal) {
      if (this.hasResistance) {
        const colour: [number, number, number] | null = Wire.MATERIALS[this._material].colour;
        if (colour != null) p.stroke(...colour);
      } else {
        p.stroke(1);
      }
    } else {
      p.stroke(170);
    }

    p.noFill();
    p.beginShape();

    let outputNo: number = this.input.outputs.indexOf(this);
    const outputCoords: number[] = this.input.getOutputCoords(outputNo);
    p.vertex(outputCoords[0], outputCoords[1]);
    for (let coord of this._path) {
      p.vertex(coord[0], coord[1]);
    }

    let inputNo: number = this.output.inputs.indexOf(this);
    const inputCoords: number[] = this.output.getInputCoords(inputNo);
    p.vertex(inputCoords[0], inputCoords[1]);
    p.endShape();

    if (this.debug && this.control.mode === ControlMode.Normal) {
      p.noStroke();
      p.fill(255, 100, 100);

      let i = 0;
      for (let coord of this._path) {
        p.ellipse(coord[0], coord[1], 5, 5);
        p.text(i, coord[0], coord[1]);
        i++;
      }
    }

    // If over a point...
    if (this.control.isOver(this)) {
      const handle = this.onHandle(p.mouseX, p.mouseY);
      if (Array.isArray(handle)) {
        p.noStroke();
        p.fill(255, 170, 0);

        let d = Wire.HANDLE_RADIUS * 2;
        p.ellipse(handle[0], handle[1], d, d);
      }
    }
  }

  /**
   * Remove the connection
   */
  public remove() {
    // Remove inputs' connection to output
    // let index = this._input._outputs.indexOf(this);
    // if (index !== -1) {
    //   this._input._outputs.splice(index, 1);
    //   this._input._outputCount--;
    // }
    this.input.removeWire(this, "output");

    // Remove outputs' connection from input
    // index = this._output._inputs.indexOf(this);
    // if (index !== -1) {
    //   this._output._inputs.splice(index, 1);
    //   this._output._inputCount--;
    // }
    this.output.removeWire(this, "input");

    this.control.removeItem(this);
  }

  /**
   * Get / Set radius of wire in px
   * @param  {Number} px   If present: value to set radius to
   * @return {Number} Radius in px
   */
  public radiusPx(px?: number): number {
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
  public radiusCm(cm?: number): number {
    if (typeof cm === 'number') {
      const px: number = cm * this.control.pixelsPerCm;
      this._r = utils.clamp(px, Wire.MIN_RADIUS, Wire.MAX_RADIUS);
    }
    return this._r / this.control.pixelsPerCm;
  }

  /**
   * Is the given (x, y) on a handle? (i.e. a certain radius from a point in the path)
   * @param  {Number} x    X coordinate
   * @param  {Number} y    y coordinate
   * @return {Number[]}    Return the handle's point
   */
  public onHandle(x: number, y: number): [number, number] | null {
    const r: number = Wire.HANDLE_RADIUS;
    for (let point of this._path) {
      let intersect: boolean = x > point[0] - r && x < point[0] + r && y > point[1] - r && y < point[1] + r;
      if (intersect) return <[number, number]>point;
    }
    return null;
  }

  /**
   * Add a hanel at (x, y)
   * @param  {Number} x    X coordinate
   * @param  {Number} y    y coordinate
   * @return {Number}     At what index in _path was the point inserted at?
   */
  public addHandle(x: number, y: number): number {
    const point: [number, number] = [x, y];
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
      const delta = (this.hasResistance) ? (this._r / 2) : Wire.DEFAULT_RADIUS;
      for (let i = 0; i <= p.length - 2; i++) {
        if (utils.isNearLine(p[i][0], p[i][1], p[i + 1][0], p[i + 1][1], x, y, delta)) {
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
   * Remove a given handle
   * @param  {Number[]} handle  Handle; result from this.onHandle
   * @return {Boolean} Removed handle?
   */
  public removeHandle(handle: number[]): boolean {
    return utils.arrRemove<number[]>(handle, this._path);
  }

  /**
   * Insert component only if on wire. If on wire, split the wire around component.
   * @param  {Component} component    Component to insert
   * @return {Boolean} Inserted the component?
   */
  public insertComponent(component: Component): boolean {
    const pos: [number, number] = component.pos();

    // If we contain the position...
    if (this.contains(...pos)) {
      const p = [
        [this.x1, this.y1],
        ...this._path,
        [this.x2, this.y2]
      ];

      // Contain node directly before the split should be
      let nodeBeforeSplitPos = -1;
      const delta = (this.hasResistance) ? (this._r / 2) : Wire.DEFAULT_RADIUS;
      for (let i = 0; i <= p.length - 2; i++) {
        if (utils.isNearLine(p[i][0], p[i][1], p[i + 1][0], p[i + 1][1], pos[0], pos[1], delta)) {
          nodeBeforeSplitPos = i - 1;
          break;
        }
      }

      const pathBefore: number[][] = this._path.slice(0, nodeBeforeSplitPos + 1);
      const pathAfter: number[][] = this._path.slice(nodeBeforeSplitPos + 1);
      // console.log(pathBefore, pathAfter);

      const componentBefore: Component = this.input;
      const componentAfter: Component = this.output;
      this.remove();

      componentBefore.connectTo(component, { path: pathBefore });
      component.connectTo(componentAfter, { path: pathAfter });
    }

    return false;
  }

  /**
   * Return data representation of this object
   * @return {object} data
   */
  public getData(): IConnectionData {
    const index: number = this.control.components.indexOf(this.output);

    return {
      index,
      path: this._path,
      hasRes: this.hasResistance,
      material: this._material,
      r: this._r
    };
  }


  public static readonly MATERIALS: IMaterial[] = [];
  public static readonly MATERIALS_KEYS: string[] = [];
  public static DEFAULT_RADIUS: number = 1.5;
  public static MIN_RADIUS: number = 0.4;
  public static MAX_RADIUS: number = 15;
  public static HANDLE_RADIUS: number = 4;

  // Load material array from Vars
  public static getMaterials(): void {
    Wire.MATERIALS.length = 0;
    Wire.MATERIALS.push(...Vars.materials.filter(m => m.wire));

    Wire.MATERIALS_KEYS.length = 0;
    Wire.MATERIALS_KEYS.push(...Wire.MATERIALS.map(m => m.name));
  }
}

export default Wire;