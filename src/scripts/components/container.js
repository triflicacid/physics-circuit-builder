[Circuit.MaterialContainer, Circuit.WireContainer] = (function() {

    /**
     * Container which holds materials
     *
     * @property _material  What material are we? (MaterialContainer.MATERIALS index)
     * @property resistance Resistance of Material
     * @property _length    Length (width) of the container
     * @property material   Get name of the material
     *
     * @method data()       Get data for the material
     * @method volume()     Get volume of material
     */
    class MaterialContainer extends Circuit.Component {
        constructor(parentCircuit) {
            super(parentCircuit);
            this._material = randomInt(MaterialContainer.MATERIALS_KEYS.length);
            this._h /= 2.5;
            this._maxCurrent = Number.MAX_SAFE_INTEGER;
        }

        get resistance() {
            let r = this.data().resistance;
            const v = this.volume(true);
            if (r !== 0) r = (r < 0) ? (r / v) : (r * v);
            return r;
        }

        get _length() { return this._w; }
        set _length(v) { this._w = clamp(v, MaterialContainer.MIN_LENGTH, MaterialContainer.MAX_LENGTH); }

        get material() { return MaterialContainer.MATERIALS_KEYS[this._material]; }

        /**
         * Return info for material, in MaterialContainer.MATERIALS
         * @return {object} info
         */
        data() {
            return MaterialContainer.MATERIALS[this.material];
        }

        /**
         * Get volume of material
         * @param  {Boolean} inCm   In centiemtres (true) or pixels (false)?
         * @return {Number} Volume in cm | px
         */
        volume(inCm = false) {
            return (inCm) ?
                (this._w / this.control.PIXELS_PER_CM) * (this._h / this.control.PIXELS_PER_CM) * (this._h / this.control.PIXELS_PER_CM) :
                this._w * this._h * this._h;
        }

        render() {
            super.render((p, colour, running) => {
                const data = this.data();

                // Main box
                if (Array.isArray(data.colour) && typeof data.colour[0] === 'number') {
                    p.fill(...data.colour);
                } else {
                    p.noFill();
                }

                p.strokeWeight(3);
                p.stroke(colour);
                p.rect(0, 0, this._w, this._h);

                // Multi-coloured?
                if (Array.isArray(data.colour) && Array.isArray(data.colour[0])) {
                    p.noFill();
                    const count = data.colour.length;
                    const pad = 3;
                    const w = (this._w - pad * 2) / (count - 1);
                    const h = this._h - pad;

                    for (let i = 0, x = -this._w / 2 + pad; i < count - 1; i++, x += w) {
                        const c1 = p.color(...data.colour[i]);
                        const c2 = p.color(...data.colour[i + 1]);

                        for (let j = 0; j < w; j++) {
                            let colour = p.lerpColor(c1, c2, j / w);
                            p.stroke(colour);
                            p.line(x + j, -h / 2, x + j, h / 2);
                        }
                    }
                }

                // Show material in green box
                if (running && this.control._showInfo) {
                    p.textAlign(p.CENTER, p.CENTER);
                    p.strokeWeight(1);
                    p.stroke(0, 100, 0);
                    p.fill(160, 255, 200);

                    let h = 15;
                    let text = nicifyString(this.material, ' ');
                    const w = p.textWidth(text) + 3;
                    p.rect(0, this._h / 2 + h, Math.max(w, this._w), h);

                    p.textSize(Circuit.SMALL_TEXT);
                    p.noStroke();
                    p.fill(1);
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
            const delta = Math.sign(event.deltaY) * -1;

            this._material += delta;
            if (this._material < 0) this._material = MaterialContainer.MATERIALS_KEYS.length - 1;
            else if (this._material >= MaterialContainer.MATERIALS_KEYS.length) this._material = 0;
        }
    }

    MaterialContainer.MIN_LENGTH = 10;
    MaterialContainer.MAX_LENGTH = 150;

    MaterialContainer.toStore = ['material', 'length'];

    MaterialContainer.config = [
        { field: 'length', name: 'Length', type: 'number', min: MaterialContainer.MIN_LENGTH, max: MaterialContainer.MAX_LENGTH, slider: true },
    ];

    // All wire materials + some extra :P
    MaterialContainer.MATERIALS = {
        // Material: { resistance (ohms per metre), colour }
        ...Circuit.Wire.MATERIALS,
        air: { resistance: 2.6e16, colour: null },
        calcium: { resistance: 3.36e-8, colour: [222, 202, 176] },
        diamond: { resistance: 1e12, colour: [185, 242, 255] },
        glass: { resistance: 1e14, colour: [240, 239, 236] },
        graphite: { resistance: 6.5e-4, colour: [54, 69, 79] },
        lithium: { resistance: 9.28e-8, colour: [196, 195, 198] },
        mercury: { resistance: 9.8e-7, colour: [213, 210, 209] },
        polystyrene: { resistance: 1e14, colour: [223, 223, 230] },
        quartz: { resistance: 7e17, colour: [232, 232, 232] },
        rubber: { resistance: 1e13, colour: [38, 38, 38] },
        superconductor: { resistance: 0, colour: [250, 100, 150] },
        teflon: { resistance: 1e24, colour: [0, 0, 90] },
    };
    MaterialContainer.MATERIALS = sortObj(MaterialContainer.MATERIALS);
    MaterialContainer.MATERIALS_KEYS = Object.keys(MaterialContainer.MATERIALS);

    // Material for MaterialContainer
    let options = [];
    for (let material in MaterialContainer.MATERIALS) {
        if (MaterialContainer.MATERIALS.hasOwnProperty(material)) {
            options.push({
                value: MaterialContainer.MATERIALS_KEYS.indexOf(material),
                name: nicifyString(material, ' ') + ` (${numberFormat(MaterialContainer.MATERIALS[material].resistance, 2, false)} Ω/m³)`
            });
        }
    }

    MaterialContainer.config.push({
        field: "material",
        name: "Material",
        type: "option",
        optionType: "number",
        options: options
    });


    /**
     * Container which holds a wire
     *
     * @property _material  What material are we? (WireContainer.MATERIALS index)
     * @property resistance Resistance of Material
     * @property _length    Length (width) of the wire
     * @property _r         Cross-section radius of wire
     * @property material   Get name of the material
     *
     * @method length()     Get length of wire
     * @method data()       Get data for the material
     * @method volume()     Get volume of material
     * @method radiusPx()       Get / Set radius in px
     * @method radiusCm()       Get / Set radius in cm
     */
    class WireContainer extends Circuit.Component {
        constructor(parentCircuit) {
            super(parentCircuit);

            this._material = randomInt(WireContainer.MATERIALS_KEYS.length);
            this._w = 100;
            this._h /= 2;
            this._maxCurrent = Number.MAX_SAFE_INTEGER;
            this._length = 10;
            this._r = Circuit.Wire.DEFAULT_RADIUS * 2;
        }

        get material() { return WireContainer.MATERIALS_KEYS[this._material]; }

        get resistance() {
            const SCALAR = 1e3;
            const info = this.data();
            let r = info.resistance;
            r = (r < 0) ?
                (r / this.volume(true)) / SCALAR :
                (r * this.volume(true)) * SCALAR;
            return r;
        }

        /**
         * Get length of wire
         * @param  {Number} inCm    Length in cm, or px?
         * @return {Number} Length in px or cm
         */
        length(inCm = false) {
            return inCm ?
                this._length / this.control.PIXELS_PER_CM :
                this._length;
        }

        render() {
            super.render((p, colour, running) => {
                const wireInfo = this.data();

                p.strokeWeight(1.5);
                p.stroke(colour);
                p.rect(0, 0, this._w, this._h);

                // Wire
                const wireColour = (wireInfo.colourSingle === undefined) ? wireInfo.colour : wireInfo.colourSingle;
                const thick = this._r / 2;
                p.noFill();
                p.stroke(...wireColour);
                p.strokeWeight(thick * 2);
                const left = -this._w / 2;
                const right = left + this._length;
                p.line(left, 0, right, 0);

                // Surround with "insulating"
                p.stroke(colour);
                p.strokeWeight(1);
                p.line(left, -thick, right, -thick);
                p.line(left, thick, right, thick);
                if (this._length < this._w) {
                    p.line(right + 1, -thick, right + 1, thick);

                    // Normal wire to end
                    p.strokeWeight(1.5);
                    p.line(right + 1, 0, this._w / 2, 0);
                }

                // Show length in green box
                if (running && this.control._showInfo) {
                    p.textAlign(p.CENTER, p.CENTER);
                    p.strokeWeight(1);
                    p.stroke(0, 100, 0);
                    p.fill(160, 255, 200);

                    p.textSize(Circuit.SMALL_TEXT);
                    let h = 15;
                    let text = roundTo(this.length(true), 2) + 'cm by ' + roundTo(this.radiusCm(), 2) + 'cm';
                    const w = p.textWidth(text) + 3;
                    p.rect(0, this._h / 2 + h, Math.max(w, this._w), h);

                    p.noStroke();
                    p.fill(1);
                    p.text(text, 0, this._h / 1.8 + h);

                    p.textAlign(p.LEFT, p.LEFT);
                }
            });
        }

        /**
         * Get data associated with material
         * @return {Object}
         */
        data() {
            return WireContainer.MATERIALS[this.material];
        }

        /**
         * Get volume of wire in cm
         * - volume of cylinder = π(r**2)h
         * @param  {Boolean} inCm   CM (true) or PX (false)?
         * @return {Number} Volume in PX or CM
         */
        volume(inCm = false) {
            const h = (inCm) ? (this._length / this.control.PIXELS_PER_CM) : this._length;
            const r = (inCm) ? (this._r / this.control.PIXELS_PER_CM) : this._r;
            return Math.PI * Math.pow(r, 2) * h;
        }

        /**
         * Get / Set radius of wire in px
         * @param  {Number} px   If present: value to set radius to
         * @return {Number} Radius in px
         */
        radiusPx(px = undefined) {
            if (typeof px === 'number') {
                this._r = clamp(px, WireContainer.MIN_RADIUS, WireContainer.MAX_RADIUS);
            }
            return this._r;
        }

        /**
         * Get / Set radius of wire in cm
         * @param  {Number} cm   If present: value to set radius to
         * @return {Number} Radius in cm
         */
        radiusCm(cm = undefined) {
            if (typeof cm === 'number') {
                const px = cm * this.control.PIXELS_PER_CM;
                this._r = clamp(px, WireContainer.MIN_RADIUS, WireContainer.MAX_RADIUS);
            }
            return this._r / this.control.PIXELS_PER_CM;
        }

        /**
         * What to do on scroll (mouseWheel)
         * @param  {Event} event    Mouse wheel event
         */
        onScroll(event) {
            const delta = Math.sign(event.deltaY) * -1;
            this._length = clamp(this._length + delta, WireContainer.MIN_LENGTH = 1, WireContainer.MAX_LENGTH = 100);
        }
    }

    WireContainer.MIN_LENGTH = 1;
    WireContainer.MAX_LENGTH = 100;
    WireContainer.MIN_RADIUS = 1;
    WireContainer.MAX_RADIUS = 10;

    WireContainer.MATERIALS = { ...Circuit.Wire.MATERIALS };
    WireContainer.MATERIALS_KEYS = Object.keys(WireContainer.MATERIALS);

    WireContainer.toStore = ['material', 'length', 'r'];
    WireContainer.config = [
        { field: 'length', name: 'Length', type: 'number', step: 0.1, min: WireContainer.MIN_LENGTH, max: WireContainer.MAX_LENGTH, slider: true },
        { field: 'r', name: 'Radius', type: 'number', step: 0.1, min: WireContainer.MIN_RADIUS, max: WireContainer.MAX_RADIUS, slider: true },
    ];


    // Material for WireContainer
    options.length = 0;
    for (let material in WireContainer.MATERIALS) {
        if (WireContainer.MATERIALS.hasOwnProperty(material)) {
            options.push({
                value: WireContainer.MATERIALS_KEYS.indexOf(material),
                name: nicifyString(material, ' ') + ` (${numberFormat(WireContainer.MATERIALS[material].resistance, 2, false)} Ω/m³)`
            });
        }
    }

    WireContainer.config.push({
        field: "material",
        name: "Material",
        type: "option",
        optionType: "number",
        options: options
    });

    return [MaterialContainer, WireContainer];
})();
