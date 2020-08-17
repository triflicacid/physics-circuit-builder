Circuit.Motor = (function() {
    /**
     * Motor - spins according to current
     * @extends Component (template.js)
     *
     * @property _rotAngle          Angle of rotation of motor
     * @property resistance         Changing this doesn't do anything now
     * @property _K                 Rotation constant. At max speed, this is radians it can rotate per cycle.
     *
     * @method delta()              Return the delta to add to _rotAngle
     * @method angle()              Get displayable current angle of motor
     */
    class Motor extends Circuit.Component {
        constructor(parentCircuit) {
            super(parentCircuit);
            this._rotAngle = 0;
            this._K = roundTo(randomFloat(0.1, 2.5), 2);
        }

        get K() {
            return this._K;
        }

        get resistance() {
            return Circuit.LOW_RESISTANCE;
        }

        /**
         * Calculate speed (delta rotAngle) of motor
         * @return {Number} to add to this._rotAngle (radians)
         */
        delta() {
            const d = (this.current / this._maxCurrent) * this.K;
            return d;
        }

        /**
         * Return displayable angle of rotation
         * @return {String} Displayable angle (degrees)
         */
        angle() {
            let num = roundTo(rad2deg(this._rotAngle), 1);

            let angle = num.toString();
            if (Number.isInteger(num)) angle = num + ".0";
            angle = angle.padStart(5, "0");
            angle += "°";
            return angle;
        }

        /**
         * Evaluate the component
         */
        eval() {
            super.eval(() => {
                const delta = this.delta();
                this._rotAngle += delta;
                if (this._rotAngle > Degrees._360) this._rotAngle = 0;
                else if (this._rotAngle < 0) this._rotAngle = Degrees._360;
            });
        }

        /**
         * Render the component
         */
        render() {
            super.render((p, colour, running) => {
                const isOn = this.isOn();

                // Circle
                p.strokeWeight(1);
                p.stroke(colour);
                if (this.isBlown()) {
                    p.fill(p.random(100));
                } else {
                    p.noFill();
                }
                p.ellipse(0, 0, this._w, this._w);

                // 'M'
                p.textAlign(p.CENTER, p.CENTER);
                p.textStyle(p.BOLD);
                p.noStroke();
                p.fill(colour);
                p.textSize(25);

                p.push();
                p.rotate(this._rotAngle);
                p.text("M", 0, 1);
                p.pop();

                p.textStyle(p.NORMAL);

                // Reading of rotAngle in green label
                if (running && this.control._showInfo) {
                    p.strokeWeight(1);
                    p.stroke(0, 100, 0);
                    p.fill(160, 255, 200);
                    p.rect(0, this._h / 1.3, this._w, this._h / 3);

                    p.textSize(Circuit.SMALL_TEXT);
                    p.noStroke();
                    p.fill(0);
                    let text = isOn ? this.angle() : "- - -";
                    p.text(text, 0, this._h / 1.25);
                }
                p.textAlign(p.LEFT, p.LEFT);

                if (this._debug && !this._blown) {
                    let len = this._w / 2;
                    p.stroke(55, 0, 255);
                    p.noFill();

                    // 0 degrees (straight right)
                    p.line(0, 0, len, 0);

                    // Rotation angle
                    p.line(0, 0, ...polToCart(this._rotAngle, len));

                    let d = this._w / 1.7;
                    p.arc(0, 0, d, d, 0, this._rotAngle);
                }
            });
        }

        /**
         * Sitch between units
         * @return {Number} New unit index (Ammeter.UNITS)
         */
        changeUnits() {
            this._units++;
            if (this._units === Ammeter.UNITS.length) this._units = 0;
            return this._units;
        }

        /**
         * What to do on scroll (mouseWheel)
         * @param  {Event} event    Mouse wheel event
         */
        onScroll(event) {
            const delta = Math.sign(event.deltaY) * -0.5;
            const K = clamp(this.K + delta, 1, 1e3);
            this._K = K;
        }
    }

    Motor.toStore = ["K"];
    Motor.config = [
        { field: "K", name: "current:speed", type: "number", min: 1, max: 50 },
    ];

    return Motor;
})();
