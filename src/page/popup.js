var POPUPID = 0;

/**
 * @property _id        ID of popup
 * @property _title     Popup title
 * @property _mode      Mode (severity, almost) of popup
 * @property _msg       Array of text as a message
 * @property _deleteOnClose Should we delete this reference in store on close?
 * @property _buttonText    Text for additional button
 * @property _buttonClicked Function to execute when button is clicked
 * @property _onClose       Function to execute on close
 * @property _root          Root HTML element (<div />)
 */
class Popup {
    constructor(title, ...msg) {
        this._id = POPUPID++;
        this._mode = 'none';
        this.title(title);
        this.msg(...msg);

        this._deleteOnClose = true;
        this._buttonText = undefined;
        this._onClose = undefined;

        /**
         * What to be executes when (if) additional button is pressed
         * @param  {Event} ev The event
         * @return {Boolean} Should we close or not?
         */
        this._buttonClicked = undefined;

        Popup.Store[this._id] = this;
    }

    get element() {
        return document.getElementById('popup-custom-' + this._id);
    }

    /**
     * SHould we delete from store on close?
     * @param  {Boolean}
     * @return {Popup} this
     */
    autoDelete(bool) {
        this._deleteOnClose = bool === true;
        return this;
    }

    /**
     * Set title
     * @param {String} title
     * @return {Popup} this
     */
    title(title) {
        this._title = title;
        return this;
    }

    /**
     * Set message
     * @param {...String} message
     * @return {Popup} this
     */
    msg(...message) {
        this._msg = message;
        return this;
    }

    /**
     * Set mode of popup
     * @param {String} mode
     * @return {Popup} this
     */
    mode(str) {
        if (str === 'none' || str === 'info' || str === 'error' || str === 'warn') {
            this._mode = str;
        } else {
            this._mode = 'none';
        }
        return this;
    }

    /**
     * Setup an additional button
     * @param  {String} text        Button text
     * @param  {Function} clicked   Function to execute when clicked; fn(button_element)
     * @return {Popup} this
     */
    extraButton(text, clicked) {
        this._buttonText = text;
        this._buttonClicked = clicked;
        return this;
    }

    /**
     * Set funcgtion for onClose
     * @param  {Function} fn    Function to execute
     * @return {Popup} this
     */
    onClose(fn) {
        this._onClose = fn;
        return this;
    }

    /**
     * Generate HTML tree
     * @return {HTMLElement} HTML tree, starting with a top-level <DIV />
     */
    html() {
        let topDiv = document.createElement('DIV');
        this._root = topDiv;
        topDiv.classList.add("popup");
        topDiv.setAttribute("id", "popup-custom-" + this._id);
        topDiv.setAttribute("data-mode", this._mode);

        // Title
        let center = document.createElement("CENTER");
        let title = document.createElement("SPAN");
        title.setAttribute("class", "title");
        title.innerHTML = this._title;
        center.appendChild(title);
        topDiv.appendChild(center);
        topDiv.appendChild(document.createElement("BR"));

        // Main
        let main = document.createElement("MAIN");
        main.insertAdjacentHTML('beforeEnd', this._msg.join("<br />"));
        topDiv.appendChild(main);
        topDiv.appendChild(document.createElement("HR"));

        // Buttons //
        center = document.createElement("CENTER");

        // -- Close
        let btnClose = document.createElement("BUTTON");
        btnClose.classList.add('btn');
        btnClose.insertAdjacentHTML('beforeEnd', '<big>&times;</big>');
        btnClose.addEventListener("click", () => this.close());
        center.appendChild(btnClose);

        // -- Custom
        if (typeof this._buttonText === 'string') {
            center.insertAdjacentHTML("beforeEnd", "&nbsp; &nbsp;");
            let btnCustom = document.createElement("BUTTON");
            btnCustom.classList.add("btn");
            btnCustom.innerHTML = this._buttonText;

            if (typeof this._buttonPress === 'function')
                btnCustom.addEventListener("click", (event) => this._buttonPress(event));
            center.appendChild(btnCustom);
        }

        topDiv.appendChild(center);

        return topDiv;
    }

    /**
     * Open the popup
     * @return {Popup} this
     */
    open() {
        const html = this.html();
        document.getElementsByClassName('popups')[0].appendChild(html);

        // Add blank cover
        Page.openPopups.push(this);
        document.getElementById('popupCover').removeAttribute('hidden');
        if (!Page.window.classList.contains('popupOpen')) Page.window.classList.add('popupOpen');

        return this;
    }

    /**
     * Close the popup
     * @return {Popup} this
     */
    close() {
        if (this._root instanceof HTMLElement) {
            this._root.remove();
        }

        Page.openPopups.splice(Page.openPopups.indexOf(this), 1);
        // If last popups, remove cover
        if (Page.openPopups.length === 0) {
            document.getElementById('popupCover').setAttribute('hidden', 'hidden');
            Page.window.classList.remove('popupOpen');
        }

        if (typeof this._onClose === 'function') {
            this._onClose(this);
        }

        if (this._deleteOnClose) {
            this.delete();
        }

        return this;
    }

    /**
     * Delete this from popup store
     * @return {Popup} this
     */
    delete() {
        delete Popup.Store[this._id];
        return this;
    }

    /**
     * When additional button is pressed...
     * @param {Event} ev  Button press event
     */
    _buttonPress(ev) {
        let shallWeClose = true;
        if (typeof this._buttonClicked === 'function') {
            shallWeClose = this._buttonClicked(ev) !== false;
        }

        if (shallWeClose) this.close();
    }
}

Popup.Store = {};

Popup.HOLDER = document.getElementsByClassName('popups')[0];

if (!(Popup.HOLDER instanceof HTMLElement)) {
    throw new TypeError(`Popup.HOLDER: got non-HTMLElement`);
}

export default Popup;