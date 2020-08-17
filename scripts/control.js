/**
 * Wrapper for controlling a circuit
 *
 * @property _circuit       The Circuit object
 * @property (readonly) canvas   Return this._circuit's canvas element
 * @property state          State of the Control
 *
 * @method getData()        Get circuit data
 * @method load(file)       Load circuit from file
 * @method save(?file)      Saves the circuits data to a file. Default: current file
 * @method terminate(fn)    Terminate the cirucit
 */
class Control {
    constructor() {
        this._file = null;
        this._circuit = null;
        this.state = 'ready';
    }

    get canvas() { return this._circuit.canvas; }

    /**
     * Get this._circuit's data
     * @return {String} JSON data
     */
    getData() {
        let data = this._circuit.getData();
        return JSON.stringify(data, false, '  ');
    }

    /**
     * Load circuit from a file
     * @param  {String} file The data file (.json)
     * @param  {Function} setupFn    Additional stuff to complete on setup
     *      fn: setup(ns, circuit)
     * @param  {Function} drawFn    Additional stuff to complete on draw
     *      fn: draw(ns, circuit)
     * @return {Promise}
     */
    async load(file, setupFn, drawFn) {
        // return new Promise((resolve, reject) => {
        return await Server.getFile(file, true)
            .then(json => {
                this._file = file;

                // Setup function
                const _setup = function(ns, circuit) {
                    for (let component of json.components) {
                        let c = circuit.createComponent(component.type, +component.pos[0], +component.pos[1]);

                        if (component.type === 'cell' && typeof component.voltage === 'number') c.setVoltage(component.voltage);
                        if (component.type === 'bulb' && typeof component.maxV === 'number') c.maxVoltage = component.maxV;
                        if (component.type === 'bulb' && typeof component.resistance === 'number') c.setResistance(component.resistance);
                    }

                    // conns: connections. Array of indexes
                    for (let i = 0; i < circuit.components.length; i++) {
                        let component = circuit.components[i];
                        let def = json.components[i];
                        if (Array.isArray(def.conns)) {
                            for (let conn of def.conns) {
                                let other = circuit.components[conn.index];
                                component.connect(other, conn.path);
                            }
                        }
                    }

                    if (typeof setupFn === 'function') setupFn(ns, circuit);
                };

                // NB: 'this' refers to the Control object
                this._circuit = new Circuit();
                this._circuit.setup('container', +json.width, +json.height, _setup, drawFn)
                    .draw();

                this.state = 'running';
                return this;
            })
            .catch(e => {
                if (e === 'E404') throw new TypeError(`Cannot resolve name '${file}' to a file`);
                if (e === 'E401') throw new TypeError(`Incorrect permissions to access file '${file}'`);
                throw `Cannot access file '${file}': ${e}`;
            });
    }

    /**
     * Save this.getData() to a file
     * @param  {String} file    File to save to (Default: this._file)
     * @return {Promise}
     */
    async save(file = this._file) {
        if (file !== this._file) {
            // Create file
            await Server.createFile(file + '.json');
        }

        let data = this.getData();
        return await Server.putFile(file + '.json', data);
    }

    /**
     * Terminate the circuit and p5 sketch
     * @param {Function} fn     Any other things? (like a callback)
     * @return {Control} Return this (chainable)
     */
    terminate(fn) {
        this._circuit.stop();

        if (typeof fn === 'function') fn(this);

        // Remove all unique properties
        for (let prop in this) {
            if (this.hasOwnProperty(prop)) {
                delete this[prop];
            }
        }

        this.state = 'terminated';

        return this;
    }
}
