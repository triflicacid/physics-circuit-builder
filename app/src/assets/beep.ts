import * as utils from './utils';

/**
 * Create a beeping noise
 *
 * @property _ctx           Audio context
 * @property _gain          Gain node
 * @property _oscillator    The oscillator which makes the noise
 * @property _volume        Volume of oscillator. 0..1
 * @property _frequency     Frequency of oscillator. 0..24000
 * @property _type          Type of oscillator.
 * @property _playing       Is the oscillator playing (bool)?
 *
 * @method volume(?vol)     Get or set volume (percentage)
 * @method frequency(?f)    Get or set frequency
 * @method form(?form)      Get or set waveform
 * @method start(...)       Start the oscillator
 * @method stop()           Stop the oscillator
 * @method update()         Update oscillator with new frequency etc...
 */

export class Beep {
  private _ctx: AudioContext;
  private _gain: GainNode;
  private _oscillator: OscillatorNode;
  private _volume: number = 1;
  private _frequency: number = 500;
  private _type: OscillatorType = "square";
  private _playing: boolean = false;

  public constructor() {
    this._ctx = new AudioContext();
    this._gain = this._ctx.createGain();
    this._gain.connect(this._ctx.destination);

    this._oscillator = this._ctx.createOscillator();
    this.createNew();
  }

  /**
   * Get or set volume of beep. Percentage;
   * @param  {Number} [volume=undefined]   Percentage to set to (percentage), or blank to get
   * @return {Number} The volume
   */
  public volume(volume?: number): number {
    if (typeof volume === "number") {
      volume = utils.clamp(volume, 0, 100);
      this._volume = volume / 100;
      this.update();
    }
    return this._volume * 100;
  }

  /**
   * Get or set frequency of beep.
   * @param  {Number} [freq=undefined]   Frequency to set oscillator to, or blank to get
   * @return {Number} The frequency
   */
  public frequency(freq?: number): number {
    if (typeof freq === "number") {
      freq = utils.clamp(freq, 0, 24000);
      this._frequency = freq;
      this.update();
    }
    return this._frequency;
  }

  /**
   * Get or set type of oscillator.
   * @param  {OscillatorType} [form=undefined]   Wave form to set oscillator to, or blank to get
   * @return {OscillatorType} The wave form
   */
  form(form?: OscillatorType): OscillatorType {
    if (form !== undefined) {
      this._type = form;
      this.update();
    }
    return this._type;
  }

  /**
   * Create a new oscillator
   * @return {Beep} this
   */
  public createNew(): Beep {
    if (this._playing) throw new TypeError(`Beep.createNew: cannot create new oscillator whilst one is playing`);
    this._oscillator = this._ctx.createOscillator();
    this._oscillator.frequency.value = this._frequency;
    this._oscillator.type = this._type;
    this._oscillator.connect(this._gain);
    this._gain.gain.value = this._volume;
    return this;
  }

  /**
   * Start the oscillator
   * @param  {Number} [duration=Infinity] Duration of the beep (seconds)
   * @param  {Function} whenDone          Function to call when beep has stopped
   * @return {Beep} this
   */
  public start(duration: number = Infinity, whenDone?: Function): Beep {
    if (this._playing) return this;

    this.createNew(); // Create new oscillator

    this._oscillator.start(this._ctx.currentTime);
    if (isFinite(duration)) {
      this._oscillator.stop(this._ctx.currentTime + duration);
      if (typeof whenDone === "function") whenDone(this);
    }
    this._playing = true;
    return this;
  }

  /**
   * Update the oscillator with the current frequency and volume and wave form
   * @return {Beep} this
   */
  public update(): Beep {
    const playing: boolean = this._playing;
    if (playing) this.stop();

    this.createNew();
    this._oscillator.frequency.value = this._frequency;
    this._oscillator.type = this._type;
    this._gain.gain.value = this._volume;

    if (playing) this.start();
    return this;
  }

  /**
   * Stop the oscillator
   * @return {Beep} this
   */
  public stop(): Beep {
    if (!this._playing) return this;
    this._oscillator.stop();
    this._playing = false;
    return this;
  }
}

export default Beep;