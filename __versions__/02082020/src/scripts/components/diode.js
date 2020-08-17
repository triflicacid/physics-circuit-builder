[Circuit.Diode, Circuit.LightEmittingDiode] = (function () {
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
            return this._broken
                ? Circuit.INFIN_RESISTANCE
                : Circuit.LOW_RESISTANCE;
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
            else if (this._dir === Diode.LEFT && this.current >= 0)
                badFlow = true;

            if (!this._broken && badFlow) {
                this._broken = true;
                if (!this._circuit._isBroken) {
                    this._circuit.break(this);
                }
            }
        }

        /**
         * Check to "unlock" the diode (called when a battery/cell is flipped)
         * @return {Boolean} Was the diode unlocked?
         */
        unlock() {
            // If the flow is now good...
            if (
                (this._dir === Diode.RIGHT && this.current >= 0) ||
                (this._dir === Diode.LEFT && this.current <= 0)
            ) {
                this._broken = false;
                // Sounds.Play('bzz');
                if (this._circuit._brokenBy === this) {
                    this._circuit.break(null);
                }
                return true;
            }
            return false;
        }

        /**
         * Render the component
         */
        render() {
            super.render((p, colour, running, isBlown) => {
                const isOn = this.isOn();

                // Circle
                p.strokeWeight(1);
                p.stroke(colour);
                p.fill(isBlown ? randomInt(0, 100) : 255);
                p.ellipse(0, 0, this._w, this._w);

                // Triangle
                let y = this._w / 3;
                let w = this._w / 4;

                p.fill(this._broken && running ? p.color(255, 70, 80) : colour);
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
                if (running && this.control._showInfo && isOn) {
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
                    let text = this._dir === Diode.RIGHT ? "> 0A" : "< 0A";
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
            this._dir = this._dir === Diode.LEFT ? Diode.RIGHT : Diode.LEFT;
            Sounds.Play("toggle-" + (this._dir === Diode.RIGHT ? "on" : "off"));
            this.unlock();
            return this._dir;
        }

        /**
         * Is this component passable?
         * @override
         * @return {Boolean} true/false
         */
        passable() {
            return !this._broken && super.passable();
        }
    }

    Diode.toStore = ["dir"];
    Diode.config = [{ field: "dir", name: "Dir", type: "dir" }];

    Diode.LEFT = 0; // <-
    Diode.RIGHT = 1; // -> [DEFAULT]

    Diode.RIGHT_ARROW = "→";
    Diode.LEFT_ARROW = "←";

    /**
     * Light Emitting Diode [LED]: diode, but emits light
     * @extends Component (template.js)
     *
     * @property _hue               Hue of LED (0-360)
     * @property _lpw                   Lumens per Watt
     * @property _luminoscity       Luminoscity of LED
     * @property (readonly) state   Is diode ON (boolean)
     *
     * @method hue(?hu)             Get / Set hue
     * @method getColour()          Get colour of LED
     * @method isOn()               Is this component 'on'?
     * @method eval()               Evaluate the component
     * @method render()             Render the component
     * @method onScroll(e)          What to do when scrolled on?
     * @method luminoscity()        Luminoscity is FIXED
     */
    class LightEmittingDiode extends Diode {
        constructor(parentCircuit) {
            super(parentCircuit);
            this.hue(randomInt(259));
            this._lpw = 90; // between 80 - 100, (https://www.rapidtables.com/calc/light/how-watt-to-lumen.html)
            this._luminoscity = randomInt(200, 300);
        }

        /**
         * Is diode ON?
         * @type Boolean
         */
        get state() {
            return this.isOn();
        }

        /**
         * Get / Set hue
         * @param  {Number} hu      If  prenent, set hue:: New hue, 0 - 360
         * @return {LightEmittingDiode | Number} SET: this (chainable), GET: the hue
         */
        hue(hu = undefined) {
            if (typeof hu === "number") {
                this._hue = clamp(hu, 0, 360);
                return this;
            } else {
                return this._hue;
            }
        }

        /**
         * Get RGB colour of LED
         * @param  {Boolean} asHsb  Return HSB or RGB?
         * @return {Number[]} RGB values
         */
        getColour(asHsb = false) {
            let s = 100;
            let hsb = [this.hue(), s, 100];
            if (asHsb) {
                hsb = hsb.map((n) => roundTo(n, 1));
                return hsb;
            } else {
                let rgb = hsb2rgb(...hsb);
                rgb = rgb.map((n) => roundTo(n, 1));
                return rgb;
            }
        }

        /**
         * Is this component 'on'?
         * @return {Boolean} Well?
         */
        isOn() {
            return !this._broken && super.isOn();
        }

        /**
         * Render the LED
         */
        render() {
            // Call 'render' of super-super class
            Circuit.Component.prototype.render.call(
                this,
                (p, colour, running, isBlown) => {
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

                    // Line and triangle (like >|)
                    {
                        p.push();
                        p.rotate(this._angle);
                        // Triangle
                        let y = this._w / 3;
                        let w = this._w / 4;

                        p.fill(
                            this._broken && running
                                ? p.color(255, 70, 80)
                                : colour
                        );
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
                        p.pop();
                    }

                    // Arrows
                    const len = 10;
                    const arr_off = 3;
                    const rot_main =
                        this._dir === Diode.LEFT
                            ? Degrees._270 - Degrees._45
                            : -Degrees._45;
                    const rot_angle =
                        this._dir === Diode.LEFT
                            ? this._angle + Degrees._270 - Degrees._45
                            : this._angle - Degrees._45;

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
                    // if (running && this.control._showInfo && !isBlown) {
                    //     p.textAlign(p.CENTER, p.CENTER);
                    //     p.strokeWeight(1);
                    //     p.stroke(0, 100, 0);
                    //     p.fill(160, 255, 200);
                    //
                    //     let h = this._h / 3;
                    //     p.rect(0, this._h / 2 + h, this._w, h);
                    //
                    //     p.textSize(Circuit.SMALL_TEXT);
                    //     p.noStroke();
                    //     p.fill(0);
                    //     p.text(this.isOn(), 0, this._h / 1.9 + h);
                    //
                    //     p.textAlign(p.LEFT, p.LEFT);
                    // }
                }
            );
        }

        /**
         * What to do on scroll (mouseWheel)
         * @param  {Event} event    Mouse wheel event
         */
        onScroll(event) {
            const delta = Math.sign(event.deltaY) * -2;
            let newHu = this._hue + delta;
            if (newHu < 0) newHu += 360;
            else if (newHu >= 360) newHu -= 360;
            this.hue(newHu);
        }

        /**
         * Luminoscity is FIXED
         */
        luminoscity() {
            return this._luminoscity;
        }
    }
    LightEmittingDiode.toStore = [
        ...Diode.toStore,
        "hue",
        "lpw",
        "luminoscity",
    ];
    LightEmittingDiode.config = [
        { field: "dir", name: "Dir", type: "dir" },
        { field: "hue", name: "Hue", type: "number", min: 0, max: 359 },
    ];

    return [Diode, LightEmittingDiode];
})();

Circuit.LED = Circuit.LightEmittingDiode;
