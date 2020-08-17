import * as utils from '../util/utils.js';
import Control from './control.js';
import Component from './component.js';

/**
 * Object for managing a circuit - components, wires etc...
 *
 * @property _control           Parent control object
 * @property _circuit           Parent circuit object
 * @property _depth             Depth of circuit
 * @property _type              Type of circuit (Series / Parallel)
 * @property components         Array of components
 * @property wires              Array of all Wire objects (aka connections)
 * @property (readonly) size     How many components are there?
 * @property (readonly) lastComponent  The last component (or latest added)
 * @property (readonly) type    Type of circuit (parallel or series)
 * @property current            Current through this circuit
 * @property _isBroken          Is circuit broken (e.g. open switch...)
 * @property _brokenBy          Component causing the circuit to break
 *
 * @staticProperty logic        Logical stuff
 *
 * @method render()         Renders all components in this.components array
 * @method forEach(fn: component, index)     Loop through all components
 * @method getVoltage           Returns sum of all Cell's voltages. USE IN TOP-LEVEL CIRCUIT ONLY
 * @method getResistance()      Calculate total resistance of circuit and its components
 * @method getCurrent()         Calculate current through the circuit
 * @method power()           Calculate wattage of circuit
 * @method unlockAllDiodes()    Check and call .unlock() on all child diodes
 * @method break(c)             Un-break or Break the circuit
 */
class Circuit {
    /**
     * @param {Control} control       Control object
     * @param {Circuit} circuit       Parent circuit
     */
    constructor(control, circuit = null) {
        this._control = control;
        if (!(this._control instanceof Control)) throw new TypeError(`Circuit: argument 'control' is not of type 'Control'`);

        this._circuit = circuit;
        if (this._circuit !== null && !(this._circuit instanceof Circuit)) throw new TypeError(`Circuit: argument 'circuit' is not of type 'Circuit'`);

        this.components = [];
        this.wires = [];
        this._current = 0;
        this._depth = (this._circuit instanceof Circuit) ? this._circuit._depth + 1 : 0;
        this._isBroken = false;
        this._brokenBy = null;

        this._type = Circuit.SERIES;
    }

    /*      READONLY PROPERTIES */
    get size() {
        return this.components.length;
    }
    get lastComponent() {
        return this.components[this.components.length - 1];
    }
    get type() {
        return this._type;
    }

    get current() {
        return this._current;
    }
    set current(c) {
        // Set current of all children
        for (let component of this.components) {
            if (Control.isComponent(component)) {
                component._current = component._circuit.isBroken() ? 0 : c;
            }
        }
    }

    /**
     * Calculate resistance across this circuit
     * @return {Number} Resistance
     */
    getResistance() {
        // let r = this.components.map(c => get(c));
        const r = [];
        for (let component of this.components) {
            // Add resistance of component if !== 0
            let res = component.resistance;
            if (res !== 0) {
                r.push(res);
                // console.log(component.toString(), ':', res);
            }

            // Check each output...
            for (let wire of component._outputs) {
                // If output component is in the same circuit (wire will be used)...
                if (wire._output instanceof Circuit.Component && wire._output._circuit === component._circuit) {
                    // Add resistance of wire if !== 0
                    res = wire.resistance;
                    if (res !== 0) {
                        r.push(res);
                        // console.log(wire.toString(), ':', res);
                    }
                }
            }
        }

        const resistance = (this.type === Circuit.PARALLEL) ?
            utils.resistanceInParallel(...r) :
            utils.resistanceInSeries(...r);
        return resistance;
    }

    /**
     * I = V / R
     * @return {Number} Current throughout the circuit
     */
    getCurrent() {
        if (this._isBroken) return 0;

        const v = this.getVoltage();
        const r = this.getResistance();
        const i = v / r;
        return i;
    }

    /**
     * Calculate the voltage of the circuit
     * @return {Number} Voltage
     */
    getVoltage() {
        if (this.isBroken()) return 0;

        if (this._depth === 0) {
            // Top-most circuit... Find cells
            let v = 0;
            for (let component of this.components)
                if (component instanceof Circuit.Cell || component instanceof Circuit.Battery) v += component.voltage;
            return v;
        } else {
            let r = 0;
            for (let component of this.components) {
                r += component.resistance;
            }
            let fract = this.getResistance() / this._control._circuit.getResistance();
            let totalV = this._control._circuit.getVoltage();
            return fract * totalV;
        }
    }

    /**
     * Evaluate every component
     */
    eval() {
        for (let i = 0; i < 1; i++) {
            this.components.forEach(c => {
                if (typeof c.eval === 'function') c.eval();
            });
        }
    }

    /**
     * Render every component in this.components
     */
    render() {
        this.components.forEach(c => {
            if (typeof c.render === 'function') c.render();
        });
    }

    /**
     * Is this circuit broken?
     * @return {Boolean}
     */
    isBroken() {
        return this._isBroken || (this._circuit && this._circuit.isBroken());
    }

    /**
     * Loop through all components
     * @param {Function} fn
     *  fn -> (Component component, Number index)
     */
    forEach(fn) {
        this.components.forEach(fn);
    }

    /**
     * Falculate wattage of circuit
     * W = V * I
     * @return {Boolean} Circuit wattage
     */
    power() {
        const v = this.getVoltage();
        const i = this.getCurrent();
        return v * i;
    }

    /**
     * Call .unlock() on all diodes
     */
    unlockAllDiodes() {
        this._control.eval(); // Evaluate initially to update current

        // Check to unlock every diode
        for (let component of this.components) {
            if (component instanceof Circuit.Diode) {
                component.unlock(); // "Unlock" diode (if successful, the resistance of the diode will change, allowing current to pass)
            } else if (component instanceof Circuit) {
                component.unlockAllDiodes();
            }
        }
    }

    /**
     * Break or unbreak the circuit
     * @param  {Component} arg Component which broke the circuit, or NULL to unbreak the circuit
     * @return {Boolean} Is circuit broken?
     */
    break (comp) {
        if (Control.isComponent(comp) && !this._isBroken) {
            this._isBroken = true;
            this._brokenBy = comp;
        } else {
            this._isBroken = false;
            this._brokenBy = null;
        }
        this._control.updateLightLevel();

        return this._isBroken;
    }
}

Circuit.Component = Component;

// Type of circuit
Circuit.SERIES = 'series';
Circuit.PARALLEL = 'parallel';

// Symbols
Circuit.OHM = 'Ω';
Circuit.INFIN = '∞';
Circuit.MICRO = 'µ';

// Connection path type 'LOOP'
Circuit.LOOP = 'loop';

/********* IMPORT ALL COMPONENTS */
import ACPowerSupply from './components/ACPowerSupply.js';
Circuit.ACPowerSupply = ACPowerSupply;

import Ammeter from './components/Ammeter.js';
Circuit.Ammeter = Ammeter;

import Battery from './components/Battery.js';
Circuit.Battery = Battery;

import Bulb from './components/Bulb.js';
Circuit.Bulb = Bulb;

import Buzzer from './components/Buzzer.js';
Circuit.Buzzer = Buzzer;

import Capacitor from './components/Capacitor.js';
Circuit.Capacitor = Capacitor;

import Cell from './components/Cell.js';
Circuit.Cell = Cell;

import Connector from './components/connector.js';
Circuit.Connector = Connector;

import DCPowerSupply from './components/DCPowerSupply.js';
Circuit.DCPowerSupply = DCPowerSupply;

import Diode from './components/Diode.js';
Circuit.Diode = Diode;

import Fuse from './components/Fuse.js';
Circuit.Fuse = Fuse;

import Heater from './components/Heater.js';
Circuit.Heater = Heater;

import LightEmittingDiode from './components/LightEmittingDiode.js';
Circuit.LightEmittingDiode = LightEmittingDiode;

import Lightmeter from './components/Lightmeter.js';
Circuit.Lightmeter = Lightmeter;

import MaterialContainer from './components/MaterialContainer.js';
Circuit.MaterialContainer = MaterialContainer;

import Motor from './components/Motor.js';
Circuit.Motor = Motor;

import PhotoResistor from './components/PhotoResistor.js';
Circuit.PhotoResistor = PhotoResistor;

import Resistor from './components/Resistor.js';
Circuit.Resistor = Resistor;

import Switch from './components/Switch.js';
Circuit.Switch = Switch;

import Thermistor from './components/Thermistor.js';
Circuit.Thermistor = Thermistor;

import Thermometer from './components/Thermometer.js';
Circuit.Thermometer = Thermometer;

import TwoWaySwitch from './components/TwoWaySwitch.js';
Circuit.TwoWaySwitch = TwoWaySwitch;

import VariableResistor from './components/VariableResistor.js';
Circuit.VariableResistor = VariableResistor;

import Voltmeter from './components/Voltmeter.js';
Circuit.Voltmeter = Voltmeter;

import Wattmeter from './components/Wattmeter.js';
Circuit.Wattmeter = Wattmeter;

import Wire from './wire.js';
Circuit.Wire = Wire;

import WireContainer from './components/WireContainer.js';
Circuit.WireContainer = WireContainer;

export default Circuit;