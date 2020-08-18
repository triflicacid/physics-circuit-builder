import Component from "classes/component/Component";
import type Circuit from "classes/circuit";
import IMaterial from "models/material";
import Wire from "classes/wire";
import * as utils from 'assets/utils';
import p5 from "p5";
import { IAdditionalComponentData, IComponentData } from "models/saveData";
import IWireContainerData from "./interface";
import Vars from "page/vars";

/**
 * Container which holds a wire
 *
 * @property _material  What material are we? (WireContainer.MATERIALS index)
 * @property resistance Resistance of Material
 * @property _length    Length (width) of the wire
 * @property _update    Update resistance in eval() this interval?
 * @property _r         Cross-section radius of wire
 * @property changeMaterial  onScroll, change material or length?
 * @property material   Get name of the material
 * @property materialData   Get data for material
 *
 * @method volume()     Get volume of material
 * @method radiusPx()       Get / Set radius in px
 * @method radiusCm()       Get / Set radius in cm
 */
export class WireContainer extends Component {
  public static readonly materials: IMaterial[] = [];
  public static readonly materialKeys: string[] = [];
  public static readonly minLength: number = 1;
  public static readonly maxLength: number = 100;
  public static readonly minRadius = 1;
  public static readonly maxRadius = 10;

  protected _material: number;
  protected _length: number = 10;
  protected _r: number = Wire.DEFAULT_RADIUS * 2;
  public changeMaterial = false;
  public update: boolean = false;

  public constructor(parentCircuit: Circuit) {
    super(parentCircuit);
    this._w = 100;
    this._h /= 2;

    this._material = utils.randomInt(WireContainer.materialKeys.length);
  }

  public get material(): number { return this._material; }
  public set material(index: number) { this._material = utils.clamp(index, 0, WireContainer.materialKeys.length - 1); }

  public get materialData(): IMaterial { return WireContainer.materials[this._material]; }

  // Length of wire (px)
  public get length(): number { return this._length; }
  public set length(l: number) {
    this._length = utils.clamp(l, WireContainer.minLength, WireContainer.maxLength);
    this.update = true;
  }

  // Radius of wire (px)
  public get radius(): number { return this._r; }
  public set radius(r: number) {
    this._r = utils.clamp(r, WireContainer.minRadius, WireContainer.maxRadius);
    this.update = true;
  }

  /**
   * Get volume of wire in cm
   * - volume of cylinder = π(r**2)h
   * @param  {Boolean} inCm   CM (true) or PX (false)?
   * @return {Number} Volume in PX or CM
   */
  public volume(inCm: boolean = false): number {
    const h: number = (inCm) ? (this._length / this.control.pixelsPerCm) : this._length;
    const r: number = (inCm) ? (this._r / this.control.pixelsPerCm) : this._r;
    return Math.PI * Math.pow(r, 2) * h;
  }

  /**
   * Get / Set radius of wire in px
   * @param  {Number} px   If present: value to set radius to
   * @return {Number} Radius in px
   */
  public radiusPx(px?: number): number {
    if (px !== undefined) {
      this._r = utils.clamp(px, WireContainer.minRadius, WireContainer.maxRadius);
    }
    return this._r;
  }

  /**
   * Get / Set radius of wire in cm
   * @param  {Number} cm   If present: value to set radius to
   * @return {Number} Radius in cm
   */
  public radiusCm(cm?: number): number {
    if (cm !== undefined) {
      const px: number = cm * this.control.pixelsPerCm;
      this._r = utils.clamp(px, WireContainer.minRadius, WireContainer.maxRadius);
    }
    return this._r / this.control.pixelsPerCm;
  }

  public eval(): void {
    super.eval(() => {
      // Calculate resistance according to volume of wire
      if (this.update) {
        const SCALAR: number = 1e3;
        const info: IMaterial = this.materialData;
        let r: number = info.resistance;
        r = (r < 0) ?
          (r / this.volume(true)) / SCALAR :
          (r * this.volume(true)) * SCALAR;
        this._resistance = r;

        this.update = false;
      }
    });
  }

  public render(): void {
    super.render((p: p5, colour: p5.Color, running: boolean) => {
      p.strokeWeight(1.5);
      p.stroke(colour);
      p.rect(0, 0, this._w, this._h);

      // Wire
      const thick: number = this._r / 2;
      p.noFill();
      if (this.materialData.colour == null) {
        p.stroke(1);
      } else {
        p.stroke(...this.materialData.colour);
      }
      p.strokeWeight(thick * 2);
      const left: number = -this._w / 2;
      const right: number = left + this._length;
      p.line(left, 0, right, 0);

      // Surround with "insulating"
      p.stroke(colour);
      p.strokeWeight(1);
      p.line(left, -thick, right, -thick);
      p.line(left, thick, right, thick);
      if (this._length < this._w) {
        p.line(right + 1, -thick, right + 1, thick);

        // Normal wire to end
        p.strokeWeight(1.5);
        p.line(right + 1, 0, this._w / 2, 0);
      }

      // Show length in green box
      if (running && this.control.showInfo) {
        p.textAlign(p.CENTER, p.CENTER);
        p.strokeWeight(1);
        p.stroke(0, 100, 0);
        p.fill(160, 255, 200);

        p.textSize(Component.SMALL_TEXT);
        let h = 15;
        let text = utils.roundTo(this.length / this.control.pixelsPerCm, 2) + 'cm by ' + utils.roundTo(this.radiusCm(), 2) + 'cm';
        const w = p.textWidth(text) + 3;
        p.rect(0, this._h / 2 + h, Math.max(w, this._w), h);

        p.noStroke();
        p.fill(1);
        p.text(text, 0, this._h / 1.8 + h);

        p.textAlign(p.LEFT, p.TOP);
      }
    });
  }

  public onMouseDown(event: MouseEvent): void {
    this.changeMaterial = !this.changeMaterial;
  }

  public onScroll(event: WheelEvent): void {
    const delta: number = Math.sign(event.deltaY) * -1;

    if (this.changeMaterial) {
      this._material += delta;
      if (this._material < 0) this._material = WireContainer.materialKeys.length - 1;
      else if (this._material >= WireContainer.materialKeys.length) this._material = 0;
    } else {
      this.length += delta;
    }
    this.update = true;
  }

  /**
   * Get data for this component
   * @param {IAdditionalComponentData} customData More data to add
   * @return {IComponentData} Data
   */
  public getData(customData?: IAdditionalComponentData): IComponentData {
    const data: IAdditionalComponentData = {
      material: this._material,
      length: this._length,
      r: this._r,
      ...customData
    };
    return super.getData(data);
  }

  /**
   * Given data, load into object
   * @param  data
   * @return this
   */
  public apply(data: IWireContainerData): WireContainer {
    super.apply(data);

    if (typeof data.material === 'number' && !isNaN(data.material)) this.material = data.material;
    if (typeof data.length === 'number' && !isNaN(data.length)) this.length = data.length;
    if (typeof data.r === 'number' && !isNaN(data.r)) this.radius = data.r;
    return this;
  }


  public static getMaterials(): void {
    WireContainer.materials.length = 0;
    WireContainer.materials.push(...Vars.materials.filter(m => m.wire));

    WireContainer.materialKeys.length = 0;
    WireContainer.materialKeys.push(...WireContainer.materials.map(m => m.name));
  }
}
export default WireContainer;