/**
 * Given a set of polar coordinates, return cartesian
 * @param  {Number} theta Angle in radians
 * @param  {Number} r     Radius
 * @return {Number[]}     [x, y] coordinates in cartesian plane
 */
function polToCart(theta, r) {
    return [
        r * Math.cos(theta),
        r * Math.sin(theta)
    ];
}

/**
 * Check is points given lie on the line
 */
function isOnLine(initial_x, initial_y, endx, endy, pointx, pointy, tolerate = 1) {
    let slope = (endy - initial_y) / (endx - initial_x);
    let y = slope * pointx + initial_y;

    if ((y <= pointy + tolerate && y >= pointy - tolerate) && (pointx >= initial_x && pointx <= endx)) {
        return true;
    }
    return false;
}

/**
 * Clamp a value between two values
 */
function clamp(n, min, max) {
    if (typeof n !== 'number') return (min + max) / 2;
    if (max < min)[max, min] = [min, max];
    if (n < min) return min;
    if (n > max) return max;
    return n;
}

/**
 * Given <n> resistances, find the total resistance in series
 * R = r1 + r2 ... rn
 * @param  {Number[]} r    Resistances
 * @return {Number}      Total resistance
 */
function resistanceInSeries(...r) {
    return r.reduce((tot, r) => tot + r);
}

/**
 * Given <n> resistances, find the total resistance in parallel
 * 1/R = 1/r1 + 1/r2 ... 1/rn
 * Solve for R: R = (r1 * r2 ... rn) / (r1 + r2 ... rn)
 * @param  {Number[]} r    Resistances
 * @return {Number}      Total resistance
 */
function resistanceInParallel(...r) {
    let num = r.reduce((tot, r) => (r === 0) ? tot : tot * r);
    let den = r.reduce((tot, r) => (r === 0) ? tot : tot + r);
    let res = num / den;
    return res;
}

/**
 * Maps a number in range to another range, keeping the relative position
 * @param  {number} n      number to map
 * @param  {number} start1 original range lower bound
 * @param  {number} stop1  original range upper bound
 * @param  {number} start2 new range lower bound
 * @param  {number} stop2  new range upper bound
 * @return {number}        newly mapped number
 */
function mapNumber(n, start1, stop1, start2, stop2) {
    return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
}

/**
 * Return last element in array
 * @param {any[]}   Array
 * @return {any}    Last element
 */
function arrLast(array) {
    return array[array.length - 1];
}

/**
 * Given a number, round it to x decimal points
 * @param  {Number} num  Number to round
 * @param  {Number} dp   Decimal places to round to
 * @return {Number}      Rounded result
 */
function roundTo(num, dp = 0) {
    if (dp === 0) return Math.round(num);

    num = num.toFixed(11); // Remove rounding errors
    const x = Math.pow(10, dp);
    return Math.round(num * x) / x;
}

/**
 * Generate random decimal
 * @param  {Number} min Minimum bound
 * @param  {Number} max Maximum bound (non-inclusive)
 * @return {Number}     Random output
 */
function randomFloat(min, max) {
    if (arguments.length === 1) {
        max = min;
        min = 0;
    }
    return (Math.random() * (max - min)) + min;
}

/**
 * Generate random integer
 * @param  {Number} min Minimum bound
 * @param  {Number} max Maximum bound (non-inclusive)
 * @return {Number}     Random output
 */
function randomInt(min, max) {
    if (arguments.length === 1) {
        max = min;
        min = 0;
    }
    return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Convert HSB to RGB
 * @param  {number} h       Hue, degrees (0-360)
 * @param  {number} s       Saturation, percentage (0-100)
 * @param  {number} b       Brightness, percentage (0-100)
 * @return {number[]}        [red (0-255), green (0-255), blue (0-255)]
 */
function hsb2rgb(h, s, b) {
    h = clamp(h, 0, 360);
    if (h === 360) h = 0;
    s = clamp(s, 0, 100) / 100;
    b = clamp(b, 0, 100) / 100;

    let c = b * s;
    let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    let m = b - c;

    let rgb = [0, 0, 0];

    if (0 <= h && h < 60) {
        rgb = [c, x, 0];
    } else if (60 <= h && h < 120) {
        rgb = [x, c, 0];
    } else if (120 <= h && h < 180) {
        rgb = [0, c, x];
    } else if (180 <= h && h < 240) {
        rgb = [0, x, c];
    } else if (240 <= h && h < 300) {
        rgb = [x, 0, c];
    } else if (300 <= h && h < 360) {
        rgb = [c, 0, x];
    }

    rgb = rgb.map(n => (n + m) * 255);
    return rgb;
}

/**
 * Convert degrees to radians
 * - Callable to convert argument to radians
 *      @param  {Number} deg       Angle in degrees
 *      @return {Number}           Angle in radians
 * - Contain constants of degrees
 *      FORMAT: _<deg> = <deg> in radians
 *      E.G. Degrees._10 = 10 degrees in radians
 */
const Degrees = function(deg) {
    return deg * 0.017453292519943295; // PI / 180
};
Degrees._1 = 0.0174533;
Degrees._5 = 0.0872665;
Degrees._10 = 0.174533;
Degrees._45 = 0.7853981633974483; //Math.PI / 4;
Degrees._90 = 1.5707963267948966; //Math.PI / 2;
Degrees._180 = 3.141592653589793; //Math.PI;
Degrees._270 = 4.71238898038469; // 180deg + 90deg;
Degrees._360 = 6.283185307179586; //Math.PI * 2;

/**
 * Convert radians to degrees
 * @param  {Number} rad
 * @return {Number} Degrees
 */
const rad2degK = 180 / Math.PI;

function rad2deg(rad) {
    return rad * rad2degK;
}

/**
 * Define a property onto an object
 * @param  {object} obj     Target object
 * @param  {String} name    Name of property
 * @param  {any}    value   Value of property
 * @param  {object} options Options associated with setting the property
 *      - type: <type>      Set type of property
 *      - readonly: true    Set property to readonly
 */
function defineProp(obj, name, value, options = {}) {
    // Store value of property
    let _val = value;

    // If type is present, check that type exists
    if (options.type !== undefined) {
        _checkType(options.type, value);
    }

    Object.defineProperty(obj, name, {
        get() {
            return _val;
        },
        set(arg) {
            if (options.readonly === true) throw new TypeError(`Assignment to readonly property '${name}'`);
            if (options.type !== undefined) _checkType(options.type, arg);
            _val = arg;
        }
    });
}

/**
 * Return a function which checks its arguments before executing.
 * @param  {object}   args Object of <arg>:<type>
 * @param  {Function} fn   Actual function to execute
 * @return {Function}      fn, but checks types
 */
function typedFunction(args, fn) {
    if (typeof args !== 'object') throw new TypeError(`typedFunction: 1st argument must be object of arguments`);
    if (typeof fn !== 'function') throw new TypeError(`typedFunction: 2nd argument must be a function`);

    // Check if valid type
    for (let arg in args) {
        if (args.hasOwnProperty(arg)) {
            _checkType(args[arg], null);
        }
    }

    // Get array of types
    const argNames = Object.keys(args);
    const types = Object.values(args);

    return function() {
        // Check if same number of arguments
        if (types.length !== fn.length) throw new TypeError(`typedFunction: type declared for ${types.length} arguments, but function accepts ${fn.length}`);

        // Check types
        for (let i = 0; i < arguments.length; i++) {
            const type = types[i];
            const value = arguments[i];
            try {
                _checkType(type, value);
            } catch (e) {
                throw new TypeError(`Argument '"${argNames[i]}"' is not assignable to parameter of type '${type}'`);
            }
        }

        return fn(...arguments);
    };
}

const number = 'number';
const any = 'any';
const string = 'string';
const boolean = 'boolean';

/**
 * Check if a value fits into a provided type
 * @param  {String} type    Type
 * @param  {any}    value   Value to check
 * @throw  {TypeError} If types do not match
 */
function _checkType(type, value) {
    let isError = false;
    let isArray = false;

    // Is typed array?
    if (type.indexOf('[]') !== -1) {
        isArray = true;
        if (!Array.isArray(value)) throw new TypeError(`Cannot implicitly convert '${value}' to array`);
        type = type.replace('[]', '');
    }

    // Check type
    type = type.toString().toLowerCase();
    // Other type?
    switch (type) {
        case 'number':
            if (isArray || value == null) break;
            if (typeof value !== 'number' || isNaN(value)) isError = true;
            break;
        case 'string':
            if (isArray || value == null) break;
            if (typeof value !== 'string') isError = true;
            break;
        case 'boolean':
            if (isArray || value == null) break;
            if (value !== true && value !== false) isError = true;
            break;
        case 'any':
            break;
        default:
            throw new TypeError(`Unknown type '${type}'`);
    }

    if (isArray) {
        // Legal type
        try {
            for (let e of value) {
                _checkType(type, e);
            }
        } catch (e) {
            throw new TypeError(`Cannot convert to ${type}[]: ${e.message}`);
        }
    }

    if (isError) {
        throw new TypeError(`Cannot implicitly convert '${value}' to ${type} type`);
    }
    return value;
}

/**
 * Return HTML string for a boolean value
 * @param  {Boolean} bool The boolean value
 * @return {String}       HTML string
 */
function getHtmlBoolString(bool) {
    return (bool === true) ?
        '<span style=\'color: forestgreen; font-weight: bold;\'>True</span>' :
        '<span style=\'color: crimson;\'>False</span>';
}

/**
 * Take string and transform to class name
 * - e.g. 'variable resistor' -> 'VariableResistor'
 * @param  {String} str String to transform
 * @return {String} output
 */
function toClassName(str) {
    str = str.toString();
    str = str.replace(/_/g, ' ');
    str = str.replace(/-/g, '');
    str = str.replace(/\s{2,}/g, ' ');

    let words = str.split(/\s/g);
    for (let i = 0; i < words.length; i++) {
        let word = words[i];
        words[i] = word[0].toUpperCase() + word.substr(1);
    }
    let output = words.join('');
    return output;
}

/**
 * Convert joules to degrees celcius
 * @param  {Number} joules
 * @return {Number} Degrees celcius
 */
function joules2deg(joules) {
    return joules * 0.00052656507646646;
}

/**
 * Convert degrees celcius to joules
 * @param  {Number} deg
 * @return {Number} Joules
 */
function deg2joules(deg) {
    return deg / 0.00052656507646646;
}
