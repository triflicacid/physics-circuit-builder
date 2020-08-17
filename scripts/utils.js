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
