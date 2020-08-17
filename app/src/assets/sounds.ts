import * as utils from './utils';

/**
 * A wrapper for sound files and playing them
 * @property Paths      Object {name: path}; paths to sound files
 * @property Buffers    Container for generated sound bufferd
 *
 * @method Init()       Initiate all sounds
 * @method CreateSoundBuffer(name)  Create a sound buffer for a given name (links to a file path in Sounds.Paths)
 * @methid Play(name)   Play the sound <name>
 */

const PATH: string = "assets/sounds/";

export class Sounds {
  private static Context: AudioContext;
  private static GainNode: GainNode;
  private static Paths: { [name: string]: string } = {
    BLOW: PATH + "blow.ogg",
    BZZ: PATH + "bzz.ogg",
    "TOGGLE-ON": PATH + "toggle-on.ogg",
    "TOGGLE-OFF": PATH + "toggle-off.ogg",
  };
  private static Buffers: { [name: string]: AudioBuffer } = {};

  private static isInitiated: boolean = false;
  private static _volume: number = 1; // Last volume

  // Initiate
  public static Init() {
    if (Sounds.isInitiated) {
      console.warn("Can only initiate Sounds once");
    } else {
      Sounds.Context = new AudioContext();
      Sounds.GainNode = Sounds.Context.createGain();
      Sounds.GainNode.connect(Sounds.Context.destination);
      Sounds.GainNode.gain.value = 1;
      Sounds.isInitiated = true;

      // Context foor beep
      // Sounds.BeepContext = new AudioContext();
      // Sounds.BeepGain = Sounds.BeepContext.createGain();
      // Sounds.BeepGain.connect(Sounds.BeepContext.destination);
    }
  }

  // Create a sound buffer for a given path (and name)
  private static CreateSoundBuffer(path: string, name: string, play: boolean = false, playCallback?: Function, playVolume?: number): void {
    if (!Sounds.isInitiated) Sounds.Init();
    if (Sounds.Buffers[name] != null) return;

    let http: XMLHttpRequest = new XMLHttpRequest();
    http.onload = function () {
      Sounds.Context.decodeAudioData(
        http.response,
        function (binary) {
          Sounds.Buffers[name] = binary;
          console.log("%cCreate Buffer for '" + name + "' path '" + Sounds.Paths[name] + "'", "color:grey;font-style:italic;");
          if (play) Sounds.Play(name, playCallback, playVolume);
        },
        function (_e) {
          console.error("SoundError: could not fetch buffer data for '" + path + "'");
        }
      );
    };
    http.open("GET", path, true);
    http.responseType = "arraybuffer";
    http.send();
  }

  /**
   * Play sound from a buffer
   * @param {String} name     Name of found buffer.
   * @param {Function} fn     Function to execute when ended
   * @param {Number} volume   Volume of sound. Number in range 0..1
   */
  public static Play(name: string, fn?: Function, volume: number = 1): void {
    name = name.toUpperCase();

    // If buffer does not exit, create it
    if (Sounds.Buffers[name] == null) {
      return Sounds.CreateSoundBuffer(Sounds.Paths[name], name, true, fn, volume);
    }

    // Change volume
    const originalVolume: number = Sounds._volume;
    if (volume !== originalVolume) {
      Sounds.Volume(volume);
    }

    // Create source buffer
    let source: AudioBufferSourceNode = Sounds.Context.createBufferSource();
    source.buffer = Sounds.Buffers[name];

    // Create filter for buffer
    let filter: BiquadFilterNode = Sounds.Context.createBiquadFilter();
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
  public static Volume(volume: number): void {
    volume = utils.clamp(volume, 0, 1);
    if (Sounds._volume === volume) return;
    Sounds._volume = volume;
    Sounds.GainNode.gain.value = volume;
  }
}

export default Sounds;