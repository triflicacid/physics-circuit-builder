import * as utils from '../util/utils.js';

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
class Beep {
    constructor() {
        this._ctx = new AudioContext();
        this._gain = this._ctx.createGain();
        this._gain.connect(this._ctx.destination);

        this._volume = 1;
        this._frequency = 500;
        this._type = "square";
        this._playing = false;

        this.createNew();
    }

    /**
     * Get or set volume of beep. Percentage;
     * @param  {Number} [volume=undefined]   Percentage to set to (percentage), or blank to get
     * @return {Number} The volume
     */
    volume(volume) {
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
    frequency(freq) {
        if (typeof freq === "number") {
            freq = utils.clamp(freq, 0, 24000);
            this._frequency = freq;
            this.update();
        }
        return this._frequency;
    }

    /**
     * Get or set type of oscillator.
     * @param  {String} [form=undefined]   Wave form to set oscillator to, or blank to get
     * @return {String} The wave form
     */
    form(form) {
        if (Beep.Forms.indexOf(form) !== -1) {
            this._type = form;
            this.update();
        }
        return this._type;
    }

    /**
     * Create a new oscillator
     * @return {Beep} this
     */
    createNew() {
        if (this._playing)
            throw new TypeError(
                `Beep.createNew: cannot create new oscillator whilst one is playing`
            );
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
    start(duration = Infinity, whenDone = null) {
        if (this._playing) return;

        if (!(this._oscillator instanceof OscillatorNode)) this.createNew();
        if (this._playing) return this;

        this._oscillator.start(this._ctx.currentTime);
        if (isFinite(duration)) {
            this._oscillator.stop(this._ctx.currentTime + duration);
            if (typeof whenDone === "function") whenDone(this);
        }
        this._playing = true;
        return this;
    }

    /**
     * Stop the oscillator
     * @return {Beep} this
     */
    stop() {
        if (!this._playing) return;
        this._oscillator.stop();
        this._oscillator = null;
        this._playing = false;
        return this;
    }

    /**
     * Update the oscillator with the current frequency and volume and wave form
     * @return {Beep} this
     */
    update() {
        const playing = this._playing;
        if (playing) this.stop();

        this.createNew();
        this._oscillator.frequency.value = this._frequency;
        this._oscillator.type = this._type;
        this._gain.gain.value = this._volume;

        if (playing) this.start();
        return this;
    }
}

Beep.Forms = ["sine", "square", "triangle", "sawtooth"];
for (let form of Beep.Forms) {
    Beep[form.toUpperCase()] = form;
}

export default Beep;