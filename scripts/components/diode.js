[Circuit.Diode, Circuit.LightEmittingDiode] = (function() {
    /**
     * Diode: only allow current to flow one way
     * @extends Component (template.js)
     *
     * @property resistance         Changing this doesn't do anything now
     * @property _broken            Have we broken the circuit?
     * @property _dir               Direction
     *
     * @method eval()               Evaluate the component
     * @method lock()               Check to 'lock' the diode
     * @method unlock()             Check to 'unlock' the diode
     * @method render()             Render the component
     * @method setMaxCurrent(v)     Set the max current (chainable)
     * @method flip()               Flip direction of diode
     */
    class Diode extends Circuit.Component {
        constructor(parentCircuit) {
            super(parentCircuit);
            this._maxCurrent = 5;
            this._broken = false;
            this._dir = Diode.RIGHT;
        }

        get resistance() {
            return this._broken ? Circuit.INFIN_RESISTANCE : Circuit.LOW_RESISTANCE;
        }

        /**
         * Evaluate the component
         */
        eval() {
            super.eval(() => {
                this.lock();
            });
        }

        /**
         * Check to "lock" the diode
         * @return {Boolean} Was the diode locked?
         */
        lock() {
            // Check for bad flow
            let badFlow = false;
            if (this._dir === Diode.RIGHT && this.current < 0) badFlow = true;
            else if (this._dir === Diode.LEFT && this.current >= 0) badFlow = true;

            if (!this._broken && badFlow) {
                this._broken = true;
            }
        }


        /**
         * Check to "unlock" the diode (called when a battery/cell is flipped)
         * @return {Boolean} Was the diode unlocked?
         */
        unlock() {
            // If the flow is now good...
            if ((this._dir === Diode.RIGHT && this.current >= 0) ||
                (this._dir === Diode.LEFT && this.current <= 0)
            ) {
                this._broken = false;
                // Sounds.Play('bzz');
                return true;
            }
            return false;
        }

        /**
         * Render the component
         */
        render() {
            super.render((p, colour, running) => {
                const isBlown = this._circuit._brokenBy === this;
                const isOn = this.isOn();

                // Circle
                p.strokeWeight(1);
                p.stroke(colour);
                p.fill(isBlown ? randomInt(0, 100) : 255);
                p.ellipse(0, 0, this._w, this._w);

                // Triangle
                let y = this._w / 3;
                let w = this._w / 4;

                p.fill((this._broken && running) ? p.color(255, 70, 80) : colour);
                p.noStroke();
                p.beginShape();
                if (this._dir === Diode.LEFT) {
                    p.vertex(w, -y);
                    p.vertex(w, y);
                    p.vertex(-w, 0);
                } else {
                    p.vertex(-w, y);
                    p.vertex(-w, -y);
                    p.vertex(w, 0);
                }
                p.endShape(p.CLOSE);

                // Line
                p.stroke(colour);
                let x = w;
                y = this._w / 3.5;
                if (this._dir === Diode.LEFT) {
                    p.line(-x, -y, -x, y);
                } else {
                    p.line(x, -y, x, y);
                }

                // Show whether LED is ON/OFF in green box
                if (running && control._showInfo && isOn) {
                    p.textAlign(p.CENTER, p.CENTER);
                    p.strokeWeight(1);
                    p.stroke(0, 100, 0);
                    p.fill(160, 255, 200);

                    let h = this._h / 3;
                    p.rect(0, this._h / 2 + h, this._w, h);

                    p.textSize(Circuit.SMALL_TEXT);
                    p.noStroke();
                    p.fill(0);
                    // const arrow = (this._dir === Diode.RIGHT) ? Diode.RIGHT_ARROW : Diode.LEFT_ARROW;
                    let text = (this._dir === Diode.RIGHT) ? '> 0A' : '< 0A';
                    p.text(text, 0, this._h / 1.9 + h);

                    p.textAlign(p.LEFT, p.LEFT);
                }
            });
        }

        /**
         * Flip direction of diode
         * @return {Number}     New direction
         */
        flip() {
            this._dir = (this._dir === Diode.LEFT) ? Diode.RIGHT : Diode.LEFT;
            Sounds.Play('toggle-' + (this._dir === Diode.RIGHT ? 'on' : 'off'));
            this.unlock();
            return this._dir;
        }

        passable() {
            return super.passable(() => !this._broken);
        }
    }

    Diode.LEFT = 0; // <-
    Diode.RIGHT = 1; // -> [DEFAULT]

    Diode.RIGHT_ARROW = '→';
    Diode.LEFT_ARROW = '←';

    /**
     * Light Emitting Diode [LED]: diode, but emits light
     * @extends Component (template.js)
     *
     * @property _hue               Hue of LED (0-360)
     * @property (readonly) state   Is diode ON (boolean)
     * @property (readonly) brightness Brightness of diode (exponential)
     *
     * @method setHue(hue)          Set a new hue (chainable)
     * @method getColour()          Get colour of LED
     * @method isOn()               Is this component 'on'?
     * @method eval()               Evaluate the component
     * @method render()             Render the component
     * @method onScroll(e)          What to do when scrolled on?
     */
    class LightEmittingDiode extends Diode {
        constructor(parentCircuit) {
            super(parentCircuit);
            this.hue = randomInt(259);
        }

        get hue() { return this._hue; }
        set hue(h) {
            this._hue = clamp(h, 0, 360);
        }

        /**
         * Is diode ON?
         * @type Boolean
         */
        get state() {
            return !this._broken && !this._circuit._isBroken;
        }

        /**
         * Brightness of diode
         * @type Number
         */
        get brightness() {
            let fract = Math.abs(this.current) / this.maxCurrent;
            return Math.pow(fract, 1.00001);
        }

        /**
         * Set a new hue
         * @param  {Number} hue      New hue, 0 - 360
         * @return {LightEmittingDiode} this (chainable)
         */
        setHue(hue) {
            this.hue = hue;
            return this;
        }

        /**
         * Get RGB colour of LED
         * @param  {Boolean} asHsb  Return HSB or RGB?
         * @return {Number[]} RGB values
         */
        getColour(asHsb = false) {
            let s = this.brightness * 100;
            let hsb = [this.hue, s, 100];
            if (asHsb) {
                hsb = hsb.map(n => roundTo(n, 1));
                return hsb;
            } else {
                let rgb = hsb2rgb(...hsb);
                rgb = rgb.map(n => roundTo(n, 1));
                return rgb;
            }
        }

        /**
         * Is this component 'on'?
         * @return {Boolean} Well?
         */
        isOn() {
            return super.isOn() && !this._blown;
        }

        /**
         * Render the LED
         */
        render() {
            // Call 'render' of super-super class
            Circuit.Component.prototype.render.call(this, (p, colour, running) => {
                const isOn = this.isOn();

                // Circle
                p.strokeWeight(1);
                p.stroke(colour);
                if (isBlown) {
                    p.fill(randomInt(100));
                } else if (running && isOn) {
                    p.fill(...this.getColour());
                } else {
                    p.fill(255);
                }
                p.ellipse(0, 0, this._w, this._w);

                // Triangle
                let y = this._w / 3;
                let w = this._w / 4;

                p.fill((this._broken && running) ? p.color(255, 70, 80) : colour);
                p.noStroke();
                p.beginShape();
                if (this._dir === Diode.LEFT) {
                    p.vertex(w, -y);
                    p.vertex(w, y);
                    p.vertex(-w, 0);
                } else {
                    p.vertex(-w, y);
                    p.vertex(-w, -y);
                    p.vertex(w, 0);
                }
                p.endShape(p.CLOSE);

                // Line
                p.stroke(colour);
                let x = w;
                y = this._w / 3.5;
                if (this._dir === Diode.LEFT) {
                    p.line(-x, -y, -x, y);
                } else {
                    p.line(x, -y, x, y);
                }

                // Arrows
                const len = 10;
                const arr_off = 3;
                const rot_main = (this._dir === Diode.LEFT) ?
                    Degrees._270 - Degrees._45 :
                    -Degrees._45;
                const rot_angle = (this._dir === Diode.LEFT) ?
                    this._angle + Degrees._270 - Degrees._45 :
                    this._angle - Degrees._45;

                // Topmost
                p.push();
                let angle = this._angle + rot_main - Degrees._10;
                let coords = polToCart(angle, this._w / 2);
                p.translate(...coords);
                p.rotate(rot_angle);
                p.stroke(0);
                p.line(0, 0, len, 0);
                p.beginShape();
                p.fill(colour);
                p.vertex(len, arr_off);
                p.vertex(len, -arr_off);
                p.vertex(len + arr_off, 0);
                p.endShape(p.CLOSE);
                p.pop();

                // Bottommost
                p.push();
                angle = this._angle + rot_main + Degrees._10 + Degrees._5;
                coords = polToCart(angle, this._w / 2);
                p.translate(...coords);
                p.rotate(rot_angle);
                p.stroke(0);
                p.line(0, 0, len, 0);
                p.beginShape();
                p.fill(colour);
                p.vertex(len, arr_off);
                p.vertex(len, -arr_off);
                p.vertex(len + arr_off, 0);
                p.endShape(p.CLOSE);
                p.pop();

                // Show expected direction of flow in green box
                if (running && control._showInfo && !isBlown) {
                    p.textAlign(p.CENTER, p.CENTER);
                    p.strokeWeight(1);
                    p.stroke(0, 100, 0);
                    p.fill(160, 255, 200);

                    let h = this._h / 3;
                    p.rect(0, this._h / 2 + h, this._w, h);

                    p.textSize(Circuit.SMALL_TEXT);
                    p.noStroke();
                    p.fill(0);
                    // const arrow = (this._dir === Diode.RIGHT) ? Diode.RIGHT_ARROW : Diode.LEFT_ARROW;
                    // const text = (this.state) ? 'ON' : 'OFF';
                    const text = roundTo(this.brightness * 100, 1) + '%';
                    p.text(text, 0, this._h / 1.9 + h);

                    p.textAlign(p.LEFT, p.LEFT);
                }
            });
        }

        /**
         * What to do on scroll (mouseWheel)
         * @param  {Event} event    Mouse wheel event
         */
        onScroll(event) {
            const delta = Math.sign(event.deltaY) * -2;
            let newHu = this.hue + delta;
            if (newHu < 0) newHu += 360;
            else if (newHu >= 360) newHu -= 360;
            this.setHue(newHu);

            if (this.control._componentShowingInfo === this && this.control._showInfo) {
                this.control.showDebugInfo(this);
            }
        }
    }
    return [Diode, LightEmittingDiode];
})();

Circuit.LED = Circuit.LightEmittingDiode;
