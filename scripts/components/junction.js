Circuit.Junction = (function() {
    /**
     * Handles a split in a wire
     * @extends Component (template.js)
     *
     * @property _d     Dimensions of junction
     *
     * @method render()
     */
    class Junction extends Circuit.Component {
        constructor(parentCircuit) {
            super(parentCircuit);

            this._d = this._w / 3;
            this._inputMax = 1;
        }

        /**
         * Renders component junction
         */
        render() {
            super.render((p, colour, running) => {
                p.rectMode(p.CENTER);

                p.stroke(colour);
                p.strokeWeight(1.5);
                p.fill(51);
                p.rect(0, 0, this._d, this._d);
            });
        }

        /**
         * Where should we connect the input to?
         * @return {Number[]}  Coordinates [x, y]
         */
        getInputCoords() {
            return [
                this._x - (this._d / 2),
                this._y
            ];
        }

        /**
         * Where should we connect the output from?
         * @return {Number[]}  Coordinates [x, y]
         */
        getOutputCoords() {
            return [
                this._x + (this._d / 2),
                this._y
            ];
        }
    }

    return Junction;
})();
