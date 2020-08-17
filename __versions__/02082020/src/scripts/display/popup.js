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
         * WHat to be executes when (if) additional button is pressed
         * @param  {HTMLButtonElement} btn   Button itself
         * @return {Boolean} Should we close or not?
         */
        this._buttonClicked = undefined;

        Popup.Store[this._id] = this;
    }

    get element() { return document.getElementById('popup-custom-' + this._id); }

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
     * Get HTML for the message
     * @return {String} HTML string
     */
    html() {
        let html = `<div class="popup" id="popup-custom-${this._id}" data-mode='${this._mode}' data-id='${this._id}'>
            <center>
                <span class='title'>${this._title}</span>
            </center>
            <br>
            <main>
                ${this._msg.join('<br>')}
            </main>
            <hr>
            <center>
                <button class='btn' onclick='Popup.Store[${this._id}].close();'><big>&times;</big></button>`;
        if (typeof this._buttonText === 'string') {
            html += '&nbsp;&nbsp; <button class=\'btn\' onclick=\'Popup.Store[' + this._id + ']._buttonPress(this);\'>' + this._buttonText + '</button>';
        }

        html += `</center></div>`;
        return html;
    }

    /**
     * Open the popup
     * @return {Popup} this
     */
    open() {
        const html = this.html();
        document.getElementsByClassName('popups')[0].insertAdjacentHTML('beforeEnd', html);

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
        if (this.element) this.element.remove();

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
     * @param {HTMLButtonElement} btn   The button being pressed
     */
    _buttonPress(btn) {
        let shallWeClose = true;
        if (typeof this._buttonClicked === 'function') {
            shallWeClose = (this._buttonClicked(btn) !== false);
        }

        if (shallWeClose) this.close();
    }
}

Popup.Store = {};
