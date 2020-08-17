/**
 * A wrapper for sound files and playing them
 * @property Paths      Object {name: path}; paths to sound files
 * @property Buffers    Container for generated sound bufferd
 *
 * @method Init()       Initiate all sounds
 * @method CreateSoundBuffer(name)  Create a sound buffer for a given name (links to a file path in Sounds.Paths)
 * @methid Play(name)   Play the sound <name>
 */
class Sounds {
    // Initiate
    static Init() {
        // Context for audio files
        Sounds.Context = new AudioContext();
        Sounds.GainNode = Sounds.Context.createGain();
        Sounds.GainNode.connect(Sounds.Context.destination);
        Sounds.GainNode.gain.value = 1;
        Sounds.isInitiated = true;

        // Context foor beep
        Sounds.BeepContext = new AudioContext();
        Sounds.BeepGain = Sounds.BeepContext.createGain();
        Sounds.BeepGain.connect(Sounds.BeepContext.destination);
    }

    // Create a sound buffer for a given path (and name)
    static CreateSoundBuffer(path, name, play = false, playArgs = []) {
        if (!Sounds.isInitiated) Sounds.Init();
        if (Sounds.Buffers[name] != null) return 0;

        let http = new XMLHttpRequest();
        http.onload = function() {
            Sounds.Context.decodeAudioData(http.response, function(binary) {
                Sounds.Buffers[name] = binary;
                console.log("%cCreate Buffer for '" + name + "' path '" + Sounds.Paths[name] + "'", "color:grey;font-style:italic;");
                if (play) Sounds.Play(name, ...playArgs);
            }, function(_e) {
                console.error('SoundError: could not fetch buffer data for \'' + path + '\'');
            });
        };
        http.open('GET', path, true);
        http.responseType = 'arraybuffer';
        http.send();
    }

    /**
     * Play sound from a buffer
     * @param {String} name     Name of found buffer.
     * @param {Function} fn     Function to execute when ended
     * @param {Number} volume   Volume of sound. Number in range 0..1
     */
    static Play(name, fn, volume = 1) {
        name = name.toUpperCase();

        // If buffer does not exit, create it
        if (Sounds.Buffers[name] == null) return Sounds.CreateSoundBuffer(Sounds.Paths[name], name, true, [fn, volume]);

        // Change volume
        const originalVolume = Sounds._volume;
        if (volume !== originalVolume) {
            Sounds.Volume(volume);
        }

        // Create source buffer
        let source = Sounds.Context.createBufferSource();
        source.buffer = Sounds.Buffers[name];

        // Create filter for buffer
        let filter = Sounds.Context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 5000; // Default frequency

        // Connect source to things needed to play sound
        source.connect(Sounds.GainNode);
        source.connect(filter);

        // Event handlers for finishing
        source.onended = function() {
            if (this.stop) this.stop();
            if (this.disconnect) this.disconnect();

            // CHange volume back
            if (volume !== originalVolume) {
                Sounds.Volume(originalVolume);
            }

            if (typeof fn === 'function') fn();
        };

        // Play buffer from time = 0s
        source.start(0);
    }

    /**
     * Change volume of sound
     * @param {Number} volume   Vlume 0..1
     */
    static Volume(volume) {
        volume = clamp(volume, 0, 1);
        if (Sounds._volume === volume) return;
        Sounds._volume = volume;
        Sounds.GainNode.gain.value = volume;
    }

    /**
     * Emit a beeping noise
     * @param {Number} volume    Volume of beep 0..1
     * @param {Number} frequency Wave frequncy
     * @param {Number} duration  Duration in seconds
     * @param {String} type      Type of oscillation
     *              - sine
     *              - square
     *              - sawtooth
     *              - triangle
     */
    static Beep(volume, frequency, duration, type = 'square') {
        let oscillator = Sounds.BeepContext.createOscillator();
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        oscillator.connect(Sounds.BeepGain);
        Sounds.BeepGain.gain.value = volume;

        const time = Sounds.BeepContext.currentTime;
        oscillator.start(time);
        oscillator.stop(time + duration);
    }
}
Sounds.isInitiated = false;
Sounds.Paths = {
    BLOW: 'sounds/blow.ogg',
    BZZ: 'sounds/bzz.ogg',
    'TOGGLE-ON': 'sounds/toggle-on.ogg',
    'TOGGLE-OFF': 'sounds/toggle-off.ogg'
};
Sounds.Buffers = {};
Sounds._volume = 1; // Default volume of gainNode

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
        this._type = 'square';
        this._playing = false;

        this.createNew();
    }

    /**
     * Get or set volume of beep. Percentage;
     * @param  {Number} [volume=undefined]   Percentage to set to (percentage), or blank to get
     * @return {Number} The volume
     */
    volume(volume) {
        if (typeof volume === 'number') {
            volume = clamp(volume, 0, 100);
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
        if (typeof freq === 'number') {
            freq = clamp(freq, 0, 24000);
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
    start(duration = Infinity, whenDone = null) {
        if (!(this._oscillator instanceof OscillatorNode)) this.createNew();
        if (this._playing) return this;

        this._oscillator.start(this._ctx.currentTime);
        if (isFinite(duration)) {
            this._oscillator.stop(this._ctx.currentTime + duration);
            if (typeof whenDone === 'function') whenDone(this);
        }
        this._playing = true;
        return this;
    }

    /**
     * Stop the oscillator
     * @return {Beep} this
     */
    stop() {
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

(function() {
    Beep.Forms = ['sine', 'square', 'triangle', 'sawtooth'];
    for (let form of Beep.Forms) {
        Beep[form.toUpperCase()] = form;
    }
})();
