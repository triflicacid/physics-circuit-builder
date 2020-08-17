import * as utils from '../util/utils.js';

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
        http.onload = function () {
            Sounds.Context.decodeAudioData(
                http.response,
                function (binary) {
                    Sounds.Buffers[name] = binary;
                    console.log(
                        "%cCreate Buffer for '" +
                        name +
                        "' path '" +
                        Sounds.Paths[name] +
                        "'",
                        "color:grey;font-style:italic;"
                    );
                    if (play) Sounds.Play(name, ...playArgs);
                },
                function (_e) {
                    console.error(
                        "SoundError: could not fetch buffer data for '" +
                        path +
                        "'"
                    );
                }
            );
        };
        http.open("GET", "src/" + path, true);
        http.responseType = "arraybuffer";
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
        if (Sounds.Buffers[name] == null)
            return Sounds.CreateSoundBuffer(Sounds.Paths[name], name, true, [
                fn,
                volume,
            ]);

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
        filter.type = "lowpass";
        filter.frequency.value = 5000; // Default frequency

        // Connect source to things needed to play sound
        source.connect(Sounds.GainNode);
        source.connect(filter);

        // Event handlers for finishing
        source.onended = function () {
            if (this.stop) this.stop();
            if (this.disconnect) this.disconnect();

            // CHange volume back
            if (volume !== originalVolume) {
                Sounds.Volume(originalVolume);
            }

            if (typeof fn === "function") fn();
        };

        // Play buffer from time = 0s
        source.start(0);
    }

    /**
     * Change volume of sound
     * @param {Number} volume   Vlume 0..1
     */
    static Volume(volume) {
        volume = utils.clamp(volume, 0, 1);
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
    static Beep(volume, frequency, duration, type = "square") {
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
    BLOW: "sounds/blow.ogg",
    BZZ: "sounds/bzz.ogg",
    "TOGGLE-ON": "sounds/toggle-on.ogg",
    "TOGGLE-OFF": "sounds/toggle-off.ogg",
};
Sounds.Buffers = {};
Sounds._volume = 1; // Default volume of gainNode

export default Sounds;