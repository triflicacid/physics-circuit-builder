import * as utils from '../../util/utils.js';
import Sounds from '../../sounds/index.js';
import Beep from '../../sounds/beep.js';
import Component from '../component.js';

/**
 * Buzzer: make sound when current passed through it
 * @extends Component (template.js)
 *
 * @property {Number} resistance        Changing this doesn't do anything now
 * @property {Number} _wireOffset       Wire offset along bottom
 * @property {Boolean} _mute            Is the buzzer mute?
 * @property {Number} _lastVol          Last volume
 * @property {Beep} _beep               Beep object managing the sound
 * @property {Number} _frequency        Accessor to beeps frequency
 *
 * @method volume()             Get volume of buzzer
 * @method toggle()             Mute/unmute
 * @method start()              Start playing sound
 * @method stop()               Stop playing sound
 * @method update()             Update sound to new volume/frequency
 * @method frequency(?f)        Get / Set new frequency
 * @method mute(?m)             Get / Set mute property
 * @method genSlider()          Generate HTMLInputElement slider for frequency
 * @method onScroll(e)          What to do when scrolled on?
 */
class Buzzer extends Component {
    constructor(parentCircuit) {
        super(parentCircuit);
        this._maxCurrent = 5;
        this._resistance = 4;

        this._h += 10;
        this._wireOffset = 7;
        this._mute = false;
        this._lastVol = 0;
        this._beep = new Beep();

        this._beep.form("sawtooth");
    }

    // Projected private property
    get _frequency() {
        return this._beep._frequency;
    }
    set _frequency(f) {
        return this.frequency(f);
    }

    /**
     * Get volume of buzzer
     * @return {Number} volume in range 0..1
     */
    volume() {
        return this.isOn() ?
            utils.roundTo(utils.clamp(Math.abs(this.current) / this.maxCurrent, 0, 1), 3) :
            0;
    }

    /**
     * Render the component. Also, play sound
     */
    render() {
        super.render((p, colour, running) => {
            const isOn = this.isOn();
            const ISBLOWN = this._circuit._brokenBy == this;

            // Play sound?
            let volume = this.volume();
            if (volume !== this._lastVol && !this._mute) {
                this.update();
            }

            // Semi-circle
            const ARC_HEIGHT = this._h / 1.3;
            let y = -(this._h / 2);
            p.stroke(colour);
            p.strokeWeight(2);
            if (ISBLOWN) {
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

                if (this.control._showInfo) {
                    // Buzzer volume in green label
                    p.textAlign(p.CENTER, p.CENTER);
                    p.strokeWeight(1);
                    p.stroke(0, 100, 0);
                    p.fill(160, 255, 200);
                    p.rect(0, this._h / 3.5, this._w, 15);

                    p.textSize(Component.SMALL_TEXT);
                    p.noStroke();
                    p.fill(0);
                    let vol = utils.roundTo(volume * 100, 1);
                    vol = isOn ? vol + "%" : "- - -";
                    p.text(vol, 0, 18);
                    p.textAlign(p.LEFT, p.LEFT);
                }
            }
        });
        this._lastVol = this.volume();
    }

    /**
     * Where should we connect the input to?
     * @return {Number[]}  Coordinates [x, y]
     */
    getInputCoords() {
        return [this._x - this._w / 2 + this._wireOffset, this._y];
    }

    /**
     * Where should we connect the output from?
     * @return {Number[]}  Coordinates [x, y]
     */
    getOutputCoords() {
        return [this._x + this._w / 2 - this._wireOffset, this._y];
    }

    /**
     * Mute and unmute
     */
    toggle() {
        if (!this.isOn()) return;
        this._mute = !this._mute;
        Sounds.Play("toggle-" + (this._mute ? "off" : "on"));

        if (this._mute) {
            this.stop();
        } else {
            this.start();
        }
    }

    /**
     * Start buzzing noise. Create OscillatorNode.
     * @return {OscillatorNode} THe node controlling the sound
     */
    start() {
        this._beep.start();
        return this._beep;
    }

    /**
     * Update the OscillatorNode to a new volume
     * @return {OscillatorNode} THe node controlling the sound
     */
    update() {
        this.stop();

        const vol = this.volume();
        this._beep.volume(vol * 100);

        this.start();
        return this._beep;
    }

    /**
     * Stop the OscillatorNode
     * @return {OscillatorNode} The node controlling the sound
     */
    stop() {
        this._beep.stop();
        return this._beep;
    }

    /**
     * Get / Set new frequency
     * @param  {Number} f   New frequency; Empty: get.
     * @return {OscillatorNode | Number} The node controlling the sound or the frequency
     */
    frequency(f) {
        if (typeof f === "number") {
            f = utils.clamp(f, Buzzer.MIN_FREQUENCY, Buzzer.MAX_FREQUENCY);
            this.stop();
            this._beep.frequency(f);
            this.start();
            return this._beep;
        } else {
            return this._beep._frequency;
        }
    }

    /**
     * Get / Set mute property
     * @param  {Boolean} bool   If present, boolean mute value
     * @return {Boolean} The new/current _mute value
     */
    mute(bool = undefined) {
        if (bool === true || bool === false) {
            if (this._mute === false && bool === true) {
                this.stop();
            } else if (this._mute === true && bool === false) {
                this.start();
            }

            this._mute = bool;
        }
        return this._mute;
    }

    /**
     * What to do on scroll (mouseWheel)
     * @param  {Event} event    Mouse wheel event
     */
    onScroll(event) {
        const delta = Math.sign(event.deltaY) * -100;
        this.frequency(this._beep._frequency + delta);
    }
}

Buzzer.toStore = ["frequency", "mute"];

Buzzer.config = [{
        field: "frequency",
        name: "Freq",
        type: "number",
        min: Buzzer.MIN_FREQUENCY,
        max: Buzzer.MAX_FREQUENCY,
        slider: true
    },
    {
        field: "mute",
        name: "Mute?",
        type: "boolean",
        method: true
    },
];

Buzzer.MIN_FREQUENCY = 100;
Buzzer.MAX_FREQUENCY = 15000;

export default Buzzer;