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
    let num = r.reduce((tot, r) => tot * r);
    let den = r.reduce((tot, r) => tot + r);
    return num / den;
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
    if (dp <= 0) return Math.round(num);

    const x = Math.pow(10, dp);
    return Math.round(num * x) / x;
}

/**
 * Generate random integer
 * @param  {Number} min Minimum bound
 * @param  {Number} max Maximum bound (non-inclusive)
 * @return {Number}     Random output
 */
function randomInt(min, max) {
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
 * @param  {Number} Degrees
 * @return {Number} Radians
 */
const deg2rad_K = Math.PI / 180;

function deg2rad(deg) {
    return deg * deg2rad_K;
}
