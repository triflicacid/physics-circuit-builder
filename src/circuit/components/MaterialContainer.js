import * as utils from '../../util/utils.js';
import Component from '../component.js';
import Wire from '../wire.js';

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
class MaterialContainer extends Component {
    constructor(parentCircuit) {
        super(parentCircuit);
        this._material = utils.randomInt(MaterialContainer.MATERIALS_KEYS.length);
        this._h /= 2.5;
        this._maxCurrent = Number.MAX_SAFE_INTEGER;
    }

    get resistance() {
        let r = this.data().resistance;
        const v = this.volume(true);
        if (r !== 0) r = (r < 0) ? (r / v) : (r * v);
        return r;
    }

    get _length() {
        return this._w;
    }
    set _length(v) {
        this._w = utils.clamp(v, MaterialContainer.MIN_LENGTH, MaterialContainer.MAX_LENGTH);
    }

    get material() {
        return MaterialContainer.MATERIALS_KEYS[this._material];
    }

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
                let text = utils.nicifyString(this.material, ' ');
                const w = p.textWidth(text) + 3;
                p.rect(0, this._h / 2 + h, Math.max(w, this._w), h);

                p.textSize(Component.SMALL_TEXT);
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

MaterialContainer.config = [{
    field: 'length',
    name: 'Length',
    type: 'number',
    min: MaterialContainer.MIN_LENGTH,
    max: MaterialContainer.MAX_LENGTH,
    slider: true
}, ];

// All wire materials + some extra :P
MaterialContainer.MATERIALS = {
    // Material: { resistance (ohms per metre), colour }
    ...Wire.MATERIALS,
    air: {
        resistance: 2.6e16,
        colour: null
    },
    calcium: {
        resistance: 3.36e-8,
        colour: [222, 202, 176]
    },
    diamond: {
        resistance: 1e12,
        colour: [185, 242, 255]
    },
    glass: {
        resistance: 1e14,
        colour: [240, 239, 236]
    },
    graphite: {
        resistance: 6.5e-4,
        colour: [54, 69, 79]
    },
    lithium: {
        resistance: 9.28e-8,
        colour: [196, 195, 198]
    },
    mercury: {
        resistance: 9.8e-7,
        colour: [213, 210, 209]
    },
    polystyrene: {
        resistance: 1e14,
        colour: [223, 223, 230]
    },
    quartz: {
        resistance: 7e17,
        colour: [232, 232, 232]
    },
    rubber: {
        resistance: 1e13,
        colour: [38, 38, 38]
    },
    superconductor: {
        resistance: 0,
        colour: [250, 100, 150]
    },
    teflon: {
        resistance: 1e24,
        colour: [0, 0, 90]
    },
};
MaterialContainer.MATERIALS = utils.sortObj(MaterialContainer.MATERIALS);
MaterialContainer.MATERIALS_KEYS = Object.keys(MaterialContainer.MATERIALS);

// Material for MaterialContainer
const options = [];
for (let material in MaterialContainer.MATERIALS) {
    if (MaterialContainer.MATERIALS.hasOwnProperty(material)) {
        options.push({
            value: MaterialContainer.MATERIALS_KEYS.indexOf(material),
            name: utils.nicifyString(material, ' ') + ` (${utils.numberFormat(MaterialContainer.MATERIALS[material].resistance, 2, false)} Ω/m³)`
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

export default MaterialContainer;