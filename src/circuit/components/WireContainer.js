import * as utils from '../../util/utils.js';
import Component from '../component.js';
import Wire from '../wire.js';

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
class WireContainer extends Component {
    constructor(parentCircuit) {
        super(parentCircuit);

        this._material = utils.randomInt(WireContainer.MATERIALS_KEYS.length);
        this._w = 100;
        this._h /= 2;
        this._maxCurrent = Number.MAX_SAFE_INTEGER;
        this._length = 10;
        this._r = Wire.DEFAULT_RADIUS * 2;
    }

    get material() {
        return WireContainer.MATERIALS_KEYS[this._material];
    }

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

                p.textSize(Component.SMALL_TEXT);
                let h = 15;
                let text = utils.roundTo(this.length(true), 2) + 'cm by ' + utils.roundTo(this.radiusCm(), 2) + 'cm';
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
            this._r = utils.clamp(px, WireContainer.MIN_RADIUS, WireContainer.MAX_RADIUS);
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
            this._r = utils.clamp(px, WireContainer.MIN_RADIUS, WireContainer.MAX_RADIUS);
        }
        return this._r / this.control.PIXELS_PER_CM;
    }

    /**
     * What to do on scroll (mouseWheel)
     * @param  {Event} event    Mouse wheel event
     */
    onScroll(event) {
        const delta = Math.sign(event.deltaY) * -1;
        this._length = utils.clamp(this._length + delta, WireContainer.MIN_LENGTH = 1, WireContainer.MAX_LENGTH = 100);
    }
}

WireContainer.MIN_LENGTH = 1;
WireContainer.MAX_LENGTH = 100;
WireContainer.MIN_RADIUS = 1;
WireContainer.MAX_RADIUS = 10;

WireContainer.MATERIALS = {
    ...Wire.MATERIALS
};
WireContainer.MATERIALS_KEYS = Object.keys(WireContainer.MATERIALS);

WireContainer.toStore = ['material', 'length', 'r'];
WireContainer.config = [{
        field: 'length',
        name: 'Length',
        type: 'number',
        step: 0.1,
        min: WireContainer.MIN_LENGTH,
        max: WireContainer.MAX_LENGTH,
        slider: true
    },
    {
        field: 'r',
        name: 'Radius',
        type: 'number',
        step: 0.1,
        min: WireContainer.MIN_RADIUS,
        max: WireContainer.MAX_RADIUS,
        slider: true
    },
];


// Material for WireContainer
const options = [];
for (let material in WireContainer.MATERIALS) {
    if (WireContainer.MATERIALS.hasOwnProperty(material)) {
        options.push({
            value: WireContainer.MATERIALS_KEYS.indexOf(material),
            name: utils.nicifyString(material, ' ') + ` (${utils.numberFormat(WireContainer.MATERIALS[material].resistance, 2, false)} Ω/m³)`
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

export default WireContainer;