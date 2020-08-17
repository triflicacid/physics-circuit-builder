Circuit.Buzzer = (function() {
    /**
     * Buzzer: make sound when current passed through it
     * @extends Component (template.js)
     *
     * @property resistance         Changing this doesn't do anything now
     * @property (readonly) volume  Get volume of buzzer
     * @property _wireOffset        Wire offset along bottom
     * @property _mute              Is the buzzer mute?
     * @property _lastVol           Last volume
     * @property _beep              Beep object managing the sound
     * @property _div               Div containing slider
     * @property _text              Span element containing resistance inside _div
     *
     * @method toggle()             Mute/unmute
     * @method start()              Start playing sound
     * @method stop()               Stop playing sound
     * @method update()             Update sound to new volume/frequency
     * @method frequency(f)         Set new frequency
     * @method genSlider()          Generate HTMLInputElement slider for frequency
     * @method onScroll(e)          What to do when scrolled on?
     */
    class Buzzer extends Circuit.Component {
        constructor(parentCircuit) {
            super(parentCircuit);
            this._maxCurrent = 5;
            this._resistance = 5;

            this._h += 10;
            this._wireOffset = 7;
            this._mute = false;
            this._lastVol = 0;
            this._beep = new Beep();

            this._div = null;
            this._text = null;

            this._beep.form('sawtooth');
            this.start();
        }

        /**
         * Get volume of buzzer
         * @return {Number} volume in range 0..1
         */
        get volume() {
            return this._circuit.isBroken() ?
                0 :
                roundTo(clamp(Math.abs(this.current) / this.maxCurrent, 0, 1), 3);
        }

        /**
         * Render the component. Also, play sound
         */
        render() {
            super.render((p, colour, running) => {
                const isOn = this.isOn();

                // HTML slider stuff
                if (running && this._div === null) {
                    const slider = this.genSlider();

                    this._div = document.createElement('div');
                    this._div.insertAdjacentText('beforeEnd', 'Frequency: ');
                    this._div.appendChild(slider);

                    this._text = document.createElement('span');
                    this._text.innerText = this._beep._frequency + 'Hz';
                    this._div.append(this._text);

                    this._circuit._control._container.appendChild(this._div);
                } else if (!running && this._div instanceof HTMLDivElement) {
                    this._div.remove();
                    this._div = null;
                }

                const ISBLOWN = this._circuit._brokenBy == this;

                // Play sound?
                let volume = this.volume;
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
                let x = (this._w / 2) - this._wireOffset;
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

                        p.textSize(Circuit.SMALL_TEXT);
                        p.noStroke();
                        p.fill(0);
                        let vol = roundTo(volume * 100, 1);
                        vol = (isOn) ? vol + '%' : '- - -';
                        p.text(vol, 0, 18);
                        p.textAlign(p.LEFT, p.LEFT);
                    }
                }
            });
            this._lastVol = this.volume;
        }

        /**
         * Where should we connect the input to?
         * @return {Number[]}  Coordinates [x, y]
         */
        getInputCoords() {
            return [
                this._x - (this._w / 2) + this._wireOffset,
                this._y
            ];
        }

        /**
         * Where should we connect the output from?
         * @return {Number[]}  Coordinates [x, y]
         */
        getOutputCoords() {
            return [
                this._x + (this._w / 2) - this._wireOffset,
                this._y
            ];
        }

        /**
         * Mute and unmute
         */
        toggle() {
            this._mute = !this._mute;
            Sounds.Play('toggle-' + (this._mute ? 'off' : 'on'));

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

            const vol = this.volume;
            this._beep.volume(vol * 100);

            this.start();
            return this._beep;
        }

        /**
         * Stop the OscillatorNode
         * @return {OscillatorNode} THe node controlling the sound
         */
        stop() {
            this._beep.stop();
            return this._beep;
        }

        /**
         * Set new frequency
         * @param  {Number} f   New frequency
         * @return {OscillatorNode} THe node controlling the sound
         */
        frequency(f) {
            f = clamp(f, Buzzer.MIN_FREQUENCY, Buzzer.MAX_FREQUENCY);
            this.stop();
            this._beep.frequency(f);
            this.start();
            return this._beep;
        }

        /**
         * Generate a slider to control this resistance
         * @return {HTMLInputElement} <input type="range" ... />
         */
        genSlider() {
            let el = document.createElement('input');
            el.setAttribute('type', 'range');
            el.setAttribute('min', Buzzer.MIN_FREQUENCY);
            el.setAttribute('max', Buzzer.MAX_FREQUENCY);
            el.setAttribute('step', 1);
            el.value = this._beep._frequency;

            el.addEventListener('input', (event) => {
                let val = +event.target.value;
                this.frequency(val);
                this._text.innerText = this._beep._frequency + 'Hz';
            });

            return el;
        }

        /**
         * What to do on scroll (mouseWheel)
         * @param  {Event} event    Mouse wheel event
         */
        onScroll(event) {
            const delta = Math.sign(event.deltaY) * -100;
            this.frequency(this._beep._frequency + delta);
            if (this._div) {
                this._div.querySelector('input').value = this._beep._frequency;
                this._text.innerText = Math.round(this._beep._frequency) + 'Hz';
            }

            if (this.control._componentShowingInfo === this && this.control._showInfo) {
                this.control.showDebugInfo(this);
            }
        }
    }

    Buzzer.MIN_FREQUENCY = 100;
    Buzzer.MAX_FREQUENCY = 15000;

    return Buzzer;
})();
