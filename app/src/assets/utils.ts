import { NullError } from "classes/errors";
import { IMaterialDef } from "models/material";

/**
   * Given a set of polar coordinates, return cartesian
   * @param  {Number} theta Angle in radians
   * @param  {Number} r     Radius
   * @return {Number[]}     [x, y] coordinates in cartesian plane
   */
export function polToCart(theta: number, r: number): [number, number] {
  return [
    r * Math.cos(theta),
    r * Math.sin(theta)
  ];
}

/**
 * Check is point given lies close to the line
 * @param  {Number} x1  x coordinate of start point of line
 * @param  {Number} y1  y coordinate of start point of line
 * @param  {Number} x2  x coordinate of end point of line
 * @param  {Number} y2  y coordinate of end point of line
 * @param  {Number} x   x coordinate of point
 * @param  {Number} y   y coordinate of point
 * @param  {Number} maxDist Maximum distance from line we will allow
 * @return {Boolean} Is the distance to the line <= maxDist?
 */
export function isNearLine(x1: number, y1: number, x2: number, y2: number, x: number, y: number, maxDist: number = 1): boolean {
  let lenA: number = (Math.pow(x - x1, 2) + Math.pow(y - y1, 2));
  let lenB: number = (Math.pow(x - x2, 2) + Math.pow(y - y2, 2));
  let lenC: number = (Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  let d: number;

  // Is angle obtuse?
  if (lenB > lenA + lenC) {
    d = Math.sqrt(lenA);
  } else if (lenA > lenB + lenC) {
    d = Math.sqrt(lenB);
  } else {
    lenA = Math.sqrt(lenA);
    lenB = Math.sqrt(lenB);
    lenC = Math.sqrt(lenC);

    const s = (lenA + lenB + lenC) / 2;
    d = (2 / lenC) * Math.sqrt(s * (s - lenA) * (s - lenB) * (s - lenC));
  }

  return d <= maxDist;
}

/**
 * Clamp a value between two values
 */
export function clamp(n: number, min: number, max: number): number {
  if (typeof n !== 'number' || isNaN(n)) return (min + max) / 2;
  if (max < min) [max, min] = [min, max];
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
export function resistanceInSeries(...r: number[]): number {
  return r.length === 0 ? 0 : r.reduce((tot, r) => tot + r);
}

/**
 * Given <n> resistances, find the total resistance in parallel
 * 1/R = 1/r1 + 1/r2 ... 1/rn
 * Solve for R: R = (r1 * r2 ... rn) / (r1 + r2 ... rn)
 * @param  {Number[]} r    Resistances
 * @return {Number}      Total resistance
 */
export function resistanceInParallel(...r: number[]): number {
  if (r.length === 0) return 0;

  let num: number = r.reduce((tot, r) => (r === 0) ? tot : tot * r);
  let den: number = r.reduce((tot, r) => (r === 0) ? tot : tot + r);
  let res: number = num / den;
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
export function mapNumber(n: number, start1: number, stop1: number, start2: number, stop2: number): number {
  return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
}

/**
 * Return last element in array
 * @param {any[]}   Array
 * @return {any}    Last element
 */
export function arrLast<T>(array: T[]): T {
  return array[array.length - 1];
}

/**
 * Remove item from array
 * @param  {any} item   Item to remove
 * @param {any[]} array Array to remove from
 * @return {Boolean} Removed?
 */
export function arrRemove<T>(item: T, array: T[]): boolean {
  const i: number = array.indexOf(item);
  if (i !== -1) {
    array.splice(i, 1);
    return true;
  }
  return false;
}

/**
 * Return random element from array
 * @param  {any[]} array
 * @return {any} random element
 */
export function arrRandom<T>(array: T[]): T {
  const i: number = randomInt(array.length);
  return array[i];
}

/**
 * Given a number, round it to x decimal points
 * @param  {Number} num  Number to round
 * @param  {Number} dp   Decimal places to round to
 * @return {Number}      Rounded result
 */
export function roundTo(num: number, dp: number = 0): number {
  if (dp === 0) return Math.round(num);

  num = +num.toFixed(11); // Remove rounding errors
  const exp: number = Math.pow(10, dp);
  return Math.round(num * exp) / exp;
}

/**
 * Generate random decimal
 * @param  {Number} min Minimum bound
 * @param  {Number} max Maximum bound (non-inclusive)
 * @return {Number}     Random output
 */
export function randomFloat(min: number, max?: number): number {
  if (max === undefined) {
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
export function randomInt(min: number, max?: number): number {
  if (max === undefined) {
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
export function hsb2rgb(h: number, s: number, b: number): [number, number, number] {
  h = clamp(h, 0, 360);
  if (h === 360) h = 0;
  s = clamp(s, 0, 100) / 100;
  b = clamp(b, 0, 100) / 100;

  let c: number = b * s;
  let x: number = c * (1 - Math.abs(((h / 60) % 2) - 1));
  let m: number = b - c;

  let rgb: number[] = [0, 0, 0];

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
  return <[number, number, number]>rgb;
}

/**
 * Convert degrees to radians
 * @param  {Number} deg       Angle in degrees
 * @return {Number}           Angle in radians
 */
export function fromDegrees(deg: number): number {
  return deg * 0.017453292519943295; // PI / 180
};

export const Degrees: { [deg: number]: number } = {
  1: 0.0174533,
  5: 0.0872665,
  10: 0.174533,
  45: 0.7853981633974483, //Math.PI / 4;
  90: 1.5707963267948966, //Math.PI / 2;
  180: 3.141592653589793, //Math.PI;
  270: 4.71238898038469, // 180deg + 90deg;
  360: 6.283185307179586, //Math.PI * 2;
};

/**
 * Convert radians to degrees
 * @param  {Number} rad
 * @return {Number} Degrees
 */
const rad2degK: number = 180 / Math.PI;
export function rad2deg(rad: number): number {
  return rad * rad2degK;
}

/**
 * Convert degrees to radians
 * @param  {Number} deg
 * @return {Number} Radians
 */
const deg2radK: number = Math.PI / 180;
export function deg2rad(deg: number): number {
  return deg * deg2radK;
}

/**
 * Return HTML string for a boolean value
 * @param  {Boolean} bool The boolean value
 * @return {String}       HTML string
 */
export function getHtmlBoolString(bool: boolean): string {
  return bool ?
    '<span style=\'color: forestgreen; font-weight: bold;\'>True</span>' :
    '<span style=\'color: crimson;\'>False</span>';
}

/**
 * Capitalise a string
 * @param  {String} string
 * @return {String}
 */
export function capitalise(string: string): string {
  return string[0].toUpperCase() + string.substr(1);
}

/**
 * Take string and nicify it
 * - e.g. 'variable resistor' -> 'Variable Resistor'
 * - e.g. 'WireContainer' -> 'Wire Container'
 * @param  {String} str String to transform
 * @param  {String} joiner  What to join word array with
 * @return {String} output
 */
export function nicifyString(str: string, joiner: string = ' '): string {
  str = str.toString();
  str = str.replace(/_/g, ' '); // '_' -> ' '
  str = str.replace(/-/g, ''); // '-' -> ''
  str = str.replace(/\s{2,}/g, ' '); // '   ' -> ' '
  str = str.replace(/(?<=[a-z])(?=[A-Z])/g, ' ');  // 'xW' -> 'x W'

  const words: string[] = str.split(/\s/g);
  for (let i: number = 0; i < words.length; i++) {
    words[i] = capitalise(words[i]);
  }
  const output = words.join(joiner);
  return output;
}

/**
 * Take string and transform to class name
 * - e.g. 'variable resistor' -> 'VariableResistor'
 * @param  {String} str String to transform
 * @return {String} output
 */
export function toClassName(str: string): string {
  return nicifyString(str, '');
}

/**
 * Convert joules to degrees celcius
 * @param  {Number} joules
 * @return {Number} Degrees celcius
 */
export function joules2deg(joules: number): number {
  return joules * 0.00052656507646646;
}

/**
 * Convert degrees celcius to joules
 * @param  {Number} deg
 * @return {Number} Joules
 */
export function deg2joules(deg: number): number {
  return deg / 0.00052656507646646;
}

/**
 * Dispatch an event on an element
 * @param  {HTMLElement} elem   Element to dispatch event on
 * @param  {String} type        Event name e.g. 'change'
 * @return {Event} The dispatched event
 */
export function eventOn(elem: HTMLElement, type: string): Event {
  const event: Event = new Event(type, {
    bubbles: true,
    cancelable: true
  });
  elem.dispatchEvent(event);
  return event;
}

/**
 * Find distance between two coordinates (a and b)
 * @param  {Number} ax  X coordinate of first point
 * @param  {Number} ay  Y coordinate of first point
 * @param  {Number} bx  X coordinate of second point
 * @param  {Number} by  Y coordinate of second point
 * @return {Number} Distance between the points
 */
export function distance(ax: number, ay: number, bx: number, by: number): number {
  let dx: number = bx - ax;
  let dy: number = by - ay;
  return Math.sqrt((dx * dx) + (dy * dy));
}

/**
 * Format a number
 * @param  {Number} num
 * @param  {Number} digits  How many fractional digits?
 * @param  {Boolean} asHTML HTML string?
 * @return {String} Exponential string
 */
export function numberFormat(num: number, digits: number, asHTML: boolean = true): string {
  if (typeof num !== 'number') return num;

  let str: string = num.toExponential(digits);
  let parts: string[] = str.split('e');

  // Remove uneeded fractional digits
  let n: string = Number(parts[0]).toString();

  if (n.indexOf('.') !== -1) {
    // Place commas
    let nParts: string[] = n.split('.');
    nParts[0] = nParts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    n = nParts.join('.');
  }

  // Seperate exponent, and remove '+'
  let exp: string = parts[1].replace('+', '');

  // Combine to main with superscript
  let result: string = n;
  if (exp !== '0') {
    result += asHTML ?
      '×10<sup>' + exp + '</sup>' :
      'e' + exp;
  }

  return result;
}

/**
 * Place commas in number
 */
export function commifyNumber(n: number): string {
  let nParts: string[] = n.toString().split('.');
  nParts[0] = nParts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  let nResult: string = nParts.join('.');
  return nResult;
}

export function querySelector(selector: string, on: HTMLElement | Document | Node = document): HTMLElement {
  const result: HTMLElement | null = (<HTMLElement>on).querySelector(selector);
  if (result == null) throw new NullError("HTMLElement", `No results for query '${selector}' on ${on}`);
  return result;
}

export function querySelectorAll(selector: string, on: HTMLElement | Node | Document = document): HTMLElement[] {
  const result: NodeListOf<HTMLElement> | null = (<HTMLElement>on).querySelectorAll(selector);
  if (result == null) throw new NullError("HTMLElement", `No results for query '${selector}' on ${on}`);

  const array: HTMLElement[] = Array.prototype.slice.call(result);
  return array;
}

export function getElementById(id: string): HTMLElement {
  const result: HTMLElement | null = document.getElementById(id);
  if (result == null) throw new NullError("HTMLElement", `No results for ID query '#${id}'`);
  return result;
}

export function sortObject(obj: object): object {
  const keys: string[] = Object.keys(obj);
  keys.sort();

  const oldObj: any = <any>obj;
  const newObj: any = {};

  for (let key of keys) {
    newObj[key] = oldObj[key];
  }

  return newObj;
}

// CHange IMaterialDef[] to option array
export function materialToOptionsArray(materials: IMaterialDef[]): { text: string, value: number }[] {
  const array: { text: string, value: number }[] = [];

  for (let i = 0; i < materials.length; i++) {
    array.push({ text: nicifyString(materials[i].name, ' '), value: i });
  }

  return array;
}

// Create a "delete" button
export function createDeleteButton(title: string | null, onClickHandler?: (e: Event) => void): HTMLSpanElement {
  const delbtn: HTMLSpanElement = document.createElement('span');
  delbtn.setAttribute('class', 'del-btn');
  if (title != null) delbtn.setAttribute('title', title);
  if (typeof onClickHandler === 'function') delbtn.addEventListener('click', onClickHandler);
  delbtn.innerHTML = '&times;';
  return delbtn;
}

/**
 * Create an apple-style slider
 */
export function createAppleSlider(id: string, eventHandler?: (e: Event, checked: boolean) => void): HTMLSpanElement {
  if (document.getElementById(id) != null) {
    throw new TypeError(`createAppleSlider: id must be unique; element with ID '${id}' already exists.`);
  }

  const span: HTMLSpanElement = document.createElement('span');
  span.classList.add('appleSlider');

  // Actual checkbox
  const checkbox: HTMLInputElement = document.createElement('input');
  span.appendChild(checkbox);
  checkbox.setAttribute('type', 'checkbox');
  checkbox.classList.add('toggle');
  checkbox.setAttribute('id', id);
  checkbox.addEventListener('change', (e: Event) => {
    span.classList[checkbox.checked ? 'add' : 'remove']('isChecked');

    if (eventHandler != undefined) {
      eventHandler(e, checkbox.checked);
    }
  });

  // Disguise label
  const label: HTMLLabelElement = document.createElement('label');
  span.appendChild(label);
  label.setAttribute('id', 'control');
  label.classList.add('control');
  label.setAttribute('for', id);

  // Slider animation thing
  const div: HTMLDivElement = document.createElement('div');
  span.appendChild(div);
  div.classList.add('atContainer');

  return span;
}