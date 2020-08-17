import Component from "classes/component/Component";
import type Circuit from "classes/circuit";
import * as utils from 'assets/utils';
import Beep from "assets/beep";
import p5 from "p5";
import { IAdditionalComponentData, IComponentData } from "models/saveData";
import { NBoolean } from "models/enum";
import IBuzzerData from "./interface";
import Sounds from "assets/sounds";

/**
 * Buzzer: make sound when current passed through it
 * @extends Component
 *
 * @property {Number} _wireOffset       Wire offset along bottom
 * @property {Boolean} _mute            Is the buzzer mute?
 * @property {Number} _lastVol          Last volume
 * @property {Beep} _beep               Beep object managing the sound
 * 
 * @property frequency          Get frequcncy of beep
 * @property isMuted            Accessor to _mute
 *
 * @method volume()             Get volume of buzzer
 * @method start()              Start playing sound
 * @method update()             Update sound to new volume/frequency
 * @method stop()               Stop playing sound
 * @method toggle()             Mute/unmute
 * @method frequency(?f)        Get / Set new frequency
 * @method mute(?m)             Get / Set mute property
 * @method genSlider()          Generate HTMLInputElement slider for frequency
 * @method onScroll(e)          What to do when scrolled on?
 */
export class Buzzer extends Component {
  public static readonly minFrequency = 100;
  public static readonly maxFrequency = 15000;

  protected _mute: boolean = false;
  protected _lastVol: number = 0;
  protected _beep: Beep;
  protected _wireOffset: number = 7;

  public constructor(parentCircuit: Circuit) {
    super(parentCircuit);
    this._resistance = 3;
    this._h += 10;
    this._maxCurrent = 5;

    this._beep = new Beep();
    this._beep.form("sawtooth");
  }

  public get frequency(): number { return this._beep.frequency(); }
  public set frequency(f: number) {
    f = utils.clamp(f, Buzzer.minFrequency, Buzzer.maxFrequency);
    if (f != this._beep.frequency()) this._beep.frequency(f);
  }

  public get isMuted(): boolean { return this._mute; }
  public set isMuted(bool: boolean) {
    if (!this._mute && bool) this.stop();
    else if (this._mute && !bool) this.start();
    this._mute = bool;
  }

  /**
   * Get volume of buzzer
   * @return {Number} volume in range 0..1
   */
  public volume(): number {
    return this.isOn() ?
      utils.roundTo(utils.clamp(Math.abs(this.current) / this.maxCurrent, 0, 1), 3) :
      0;
  }

  /**
   * Start buzzing noise. Create OscillatorNode.
   */
  public start(): void {
    this._beep.start();
  }

  /**
   * Update the OscillatorNode to a new volume
   */
  public update(): void {
    const vol: number = this.volume();
    this._beep.volume(vol * 100);
  }

  /**
   * Stop the OscillatorNode
   */
  public stop(): void {
    this._beep.stop();
  }

  public eval(): void {
    super.eval(() => {
      // Play sound? (update if sound has changed)
      const volume: number = this.volume();
      if (volume !== this._lastVol && !this._mute) {
        // Update sound
        this.update();
        this._lastVol = volume;
      }
    });
  }

  public render(): void {
    super.render((p: p5, colour: p5.Color, running: boolean): void => {
      const isOn: boolean = this.isOn();
      const volume: number = this.volume();

      // Semi-circle
      const ARC_HEIGHT: number = this._h / 1.3;
      let y: number = -(this._h / 2);
      p.stroke(colour);
      p.strokeWeight(2);
      if (this._blown) {
        p.fill(p.random(100, 200));
      } else {
        p.noFill();
      }
      p.arc(0, y, this._w, ARC_HEIGHT, 0, p.PI);
      p.line(-this._w / 2, y, this._w / 2, y);

      // Lines
      p.stroke(colour);
      p.strokeWeight(1.5);
      let x = this._w / 2 - this._wireOffset;
      y = -this._h / 4;
      p.line(x, 0, x, y);
      x = -(this._w / 2) + this._wireOffset;
      p.line(x, 0, x, y);

      if (running) {
        // Indicator light
        p.strokeWeight(0.8);
        p.stroke(0);
        if (volume > 0 && !this._mute) {
          // Playing and not mute
          p.fill(0, 255, 20);
        } else if (volume > 0 && this._mute) {
          // Playing but mute
          p.fill(255, 170, 40);
        } else {
          // Not playing
          p.fill(255, 40, 50);
        }
        p.ellipse(0, -ARC_HEIGHT / 2, 7, 7);

        if (this.control.showInfo) {
          // Buzzer volume in green label
          p.textAlign(p.CENTER, p.CENTER);
          p.strokeWeight(1);
          p.stroke(0, 100, 0);
          p.fill(160, 255, 200);
          p.rect(0, this._h / 3.5, this._w, 15);

          p.textSize(Component.SMALL_TEXT);
          p.noStroke();
          p.fill(0);
          let text: string = isOn ? utils.roundTo(volume * 100, 1) + "%" : "- - -";
          p.text(text, 0, 18);
          p.textAlign(p.LEFT, p.TOP);
        }
      }
    });
  }

  /**
   * Where should we connect the input to?
   * @return {Number[]}  Coordinates [x, y]
   */
  public getInputCoords(): [number, number] {
    return [this._x - this._w / 2 + this._wireOffset, this._y];
  }

  /**
   * Where should we connect the output from?
   * @return {Number[]}  Coordinates [x, y]
   */
  public getOutputCoords(): [number, number] {
    return [this._x + this._w / 2 - this._wireOffset, this._y];
  }

  public onMouseDown(event: MouseEvent): void {
    if (!this.isOn()) return;
    this.isMuted = !this.isMuted;
    Sounds.Play("toggle-" + (this._mute ? "off" : "on"));
  }

  public onScroll(event: WheelEvent): void {
    const delta: number = Math.sign(event.deltaY) * -100;
    this.frequency += delta;
  }

  /**
   * Get data for this component
   * @param {IAdditionalComponentData} customData More data to add
   * @return {IComponentData} Data
   */
  public getData(customData?: IAdditionalComponentData): IComponentData {
    const data: IAdditionalComponentData = {
      freq: this.frequency,
      mute: this._mute ? NBoolean.True : NBoolean.False,
      ...customData
    };
    return super.getData(data);
  }

  /**
   * Given data, load into object
   * @param  data
   * @return this
   */
  public apply(data: IBuzzerData): Buzzer {
    super.apply(data);

    if (typeof data.freq === 'number' && !isNaN(data.freq)) this.frequency = data.freq;
    if (data.mute === NBoolean.True || data.mute === NBoolean.False) this._mute = data.mute === NBoolean.True;
    return this;
  }
}

export default Buzzer;