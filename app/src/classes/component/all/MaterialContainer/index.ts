import Component from "classes/component/Component";
import IMaterial, { IMaterialDef } from "models/material";
import { materials } from "classes/materials";
import type Circuit from "classes/circuit";
import * as utils from 'assets/utils';
import p5 from "p5";
import { IAdditionalComponentData, IComponentData } from "models/saveData";
import IMaterialContainerData from "./interface";

/**
 * Container which holds materials
 *
 * @property _material  What material are we? (MaterialContainer.MATERIALS index)
 * @property resistance Resistance of Material
 * @property length     Length (width) of the container
 * @property material   Get name of the material
 * @property _update    Update resistance?
 * @property changeMaterial  onScroll, change material or length?
 *
 * @method volume()     Get volume of material
 */
export class MaterialContainer extends Component {
  public static minLength: number = 10;
  public static maxLength: number = 150;
  public static readonly materials: IMaterialDef[] = [...materials];
  public static readonly materialKeys: string[] = MaterialContainer.materials.map(m => m.name);

  protected _material: number;
  public update: boolean = false;
  public changeMaterial = true;

  public constructor(parentCircuit: Circuit) {
    super(parentCircuit);

    this._material = utils.randomInt(MaterialContainer.materials.length);
  }

  public get material(): number { return this._material; }
  public set material(index: number) { this._material = utils.clamp(index, 0, MaterialContainer.materialKeys.length - 1); }

  public get length(): number { return this._w; }
  public set length(l: number) {
    this._w = utils.clamp(l, MaterialContainer.minLength, MaterialContainer.maxLength);
    this.update = true;
  }

  public get materialData(): IMaterial { return MaterialContainer.materials[this._material]; }

  /**
   * Get volume of material
   * @param  {Boolean} inCm   In centiemtres (true) or pixels (false)?
   * @return {Number} Volume in cm | px
   */
  public volume(inCm: boolean = false): number {
    return (inCm) ?
      (this._w / this.control.pixelsPerCm) * (this._h / this.control.pixelsPerCm) * (this._h / this.control.pixelsPerCm) :
      this._w * this._h * this._h;
  }

  public eval(): void {
    super.eval(() => {
      // Update resistance depending on material and length
      if (this.update) {
        let r: number = this.materialData.resistance;
        const v: number = this.volume(true);
        if (r !== 0) r = (r < 0) ? (r / v) : (r * v);
        this._resistance = r;

        this.update = false;
      }
    });
  }

  public render(): void {
    super.render((p: p5, colour: p5.Color, running: boolean): void => {
      // Main box
      if (this.materialData.colour != null) {
        p.fill(...this.materialData.colour);
      } else {
        p.noFill();
      }

      p.strokeWeight(3);
      p.stroke(colour);
      p.rect(0, 0, this._w, this._h);

      // Multi-coloured?
      // if (Array.isArray(data.colour) && Array.isArray(data.colour[0])) {
      //   p.noFill();
      //   const count = data.colour.length;
      //   const pad = 3;
      //   const w = (this._w - pad * 2) / (count - 1);
      //   const h = this._h - pad;

      //   for (let i = 0, x = -this._w / 2 + pad; i < count - 1; i++, x += w) {
      //     const c1 = p.color(...data.colour[i]);
      //     const c2 = p.color(...data.colour[i + 1]);

      //     for (let j = 0; j < w; j++) {
      //       let colour = p.lerpColor(c1, c2, j / w);
      //       p.stroke(colour);
      //       p.line(x + j, -h / 2, x + j, h / 2);
      //     }
      //   }
      // }

      // Show material in green box
      if (running && this.control.showInfo) {
        p.textAlign(p.CENTER, p.CENTER);
        p.strokeWeight(1);
        p.stroke(0, 100, 0);
        p.fill(160, 255, 200);

        let h = 15;
        const cm: number = utils.roundTo(this.length / this.control.pixelsPerCm, 1);
        let text = cm + ' cm of ' + utils.nicifyString(this.materialData.name, ' ');
        const w = p.textWidth(text) + 3;
        p.rect(0, this._h / 2 + h, Math.max(w, this._w), h);

        p.textSize(Component.SMALL_TEXT);
        p.noStroke();
        p.fill(1);
        p.text(text, 0, this._h / 1.9 + h);

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
      // Change material
      this._material += delta;
      if (this._material < 0) this._material = MaterialContainer.materialKeys.length - 1;
      else if (this._material >= MaterialContainer.materialKeys.length) this._material = 0;
    } else {
      // Change length
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
      length: this.length,
      ...customData
    };
    return super.getData(data);
  }

  /**
   * Given data, load into object
   * @param  data
   * @return this
   */
  public apply(data: IMaterialContainerData): MaterialContainer {
    super.apply(data);

    if (typeof data.material === 'number' && !isNaN(data.material)) this.material = data.material;
    if (typeof data.length === 'number' && !isNaN(data.length)) this.length = data.length;
    return this;
  }
}

export default MaterialContainer;