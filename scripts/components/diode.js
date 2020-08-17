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
            this._maxCurrent = Infinity;
            this._broken = false;
            this._dir = Diode.RIGHT;
        }

        get resistance() { return Circuit.ZERO_RESISTANCE; }

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

            // If current is bad, break;
            if (!this._broken && badFlow && !this._circuit._isBroken) {
                this._circuit._isBroken = true;
                this._circuit._brokenBy = this;
                this._broken = true;
            }
        }


        /**
         * Check to "unlock" the diode (called when a battery/cell is flipped)
         * @return {Boolean} Was the diode unlocked?
         */
        unlock() {
            // Check for good flow
            let goodFlow = false;
            if (this._dir === Diode.RIGHT && this.current >= 0) goodFlow = true;
            else if (this._dir === Diode.LEFT && this.current <= 0) goodFlow = true;

            // Only un-break if we are the ones who broken the circuit
            if (this._broken && goodFlow && this._circuit._brokenBy == this) {
                this._circuit._isBroken = false;
                this._circuit._brokenBy = null;
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
                // Circle
                p.strokeWeight(1);
                p.stroke(colour);
                p.fill(255);
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
                if (running && control._showInfo) {
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
                    const text = (this._dir === Diode.RIGHT) ? '> 0A' : '< 0A';
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
     * @property _rgb               RGB colour
     * @property (readonly) state   Is diode ON (boolean)
     *
     * @method setHue(hue)          Set a new hue (chainable)
     * @method eval()               Evaluate the component
     * @method render()             Render the component
     */
    class LightEmittingDiode extends Diode {
        constructor(parentCircuit) {
            super(parentCircuit);
            this.hue = randomInt(0, 360);
        }

        get hue() { return this._hue; }
        set hue(h) {
            this._hue = clamp(h, 0, 360);
            this._rgb = hsb2rgb(this._hue, 90, 100);
        }

        /**
         * Is diode ON?
         * @return {Boolean} Is it on?
         */
        get state() {
            return !this._broken && !this._circuit._isBroken;
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
         * Render the LED
         */
        render() {
            // Call 'render' of super-super class
            Circuit.Component.prototype.render.call(this, (p, colour, running, circuitBroken) => {
                // Circle
                p.strokeWeight(1);
                p.stroke(colour);
                p.fill((running && !circuitBroken) ? p.color(...this._rgb) : 255);
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
                if (running && control._showInfo) {
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
                    const text = (this.state) ? 'ON' : 'OFF'; //(this._dir === Diode.RIGHT) ? '> 0A' : '< 0A';
                    p.text(text, 0, this._h / 1.9 + h);

                    p.textAlign(p.LEFT, p.LEFT);
                }
            });
        }
    }
    return [Diode, LightEmittingDiode];
})();

Circuit.LED = Circuit.LightEmittingDiode;
