import Page from 'page/index';
import * as utils from 'assets/utils';

export enum PopupMode {
  None = 'none',
  Info = 'info',
  Error = 'error',
  Warn = 'warn',
}

/**
 * @property _title     Popup title
 * @property _mode      Mode (severity, almost) of popup
 * @property _msg       Array of text as a message
 * @property _deleteOnClose Should we delete this reference in store on close?
 * @property _buttonText    Text for additional button
 * @property _buttonClicked Function to execute when button is clicked
 * @property _onClose       Function to execute on close
 * @property _root          Root HTML element (<div />)
 */
export class Popup {
  private _mode: PopupMode = PopupMode.None;
  private _title: string = "";
  private _msg: string[] = [""];
  private _deleteOnClose: boolean = true;
  private _buttonText: string | null = null;
  private _onClose: Function | null = null;
  private _buttonClicked: Function | null = null;
  private _root: HTMLElement | null = null;

  public constructor(title: string, ...msg: string[]) {
    Popup.Popups.push(this);
    this.title(title);
    this.msg(...msg);

    // Popup.Store[this.id] = this;
  }

  /**
   * Position of this in Popup.Popups
   * @return {Number} index
   */
  public get id(): number {
    return Popup.Popups.indexOf(this);
  }

  /**
   * Should we delete from store on close?
   * @param  {Boolean} bool Delete on close?
   * @return {Popup} this
   */
  public autoDelete(bool: boolean): Popup {
    this._deleteOnClose = bool;
    return this;
  }

  /**
   * Set title
   * @param {String} title Title of popup
   * @return {Popup} this
   */
  public title(title: string): Popup {
    this._title = title;
    return this;
  }

  /**
   * Set message
   * @param {...String} message Message to set
   * @return {Popup} this
   */
  public msg(...message: string[]): Popup {
    this._msg = message;
    return this;
  }

  /**
   * Set mode of popup
   * @param {PopupMode} mode New mode
   * @return {Popup} this
   */
  public mode(mode: PopupMode): Popup {
    this._mode = mode;
    return this;
  }

  /**
   * Setup an additional button
   * @param  {String} text        Button text
   * @param  {Function} clicked   Function to execute when clicked; fn(button_element)
   * @return {Popup} this
   */
  public extraButton(text: string, clicked: Function): Popup {
    this._buttonText = text;
    this._buttonClicked = clicked;
    return this;
  }

  /**
   * Set funcgtion for onClose
   * @param  {Function} fn    Function to execute
   * @return {Popup} this
   */
  public onClose(fn: Function): Popup {
    this._onClose = fn;
    return this;
  }

  /**
   * Generate HTML tree
   * @return {HTMLElement} HTML tree, starting with a top-level <DIV />
   */
  public html(): HTMLElement {
    this._root = document.createElement('DIV');
    this._root.classList.add("popup");
    this._root.setAttribute("id", "popup-custom-" + this.id);
    this._root.setAttribute("data-mode", this._mode);

    // Title
    let center: HTMLElement = document.createElement("CENTER");
    let title: HTMLElement = document.createElement("SPAN");
    title.setAttribute("class", "title");
    title.innerHTML = this._title;
    center.appendChild(title);
    this._root.appendChild(center);
    this._root.appendChild(document.createElement("BR"));

    // Main
    let main = document.createElement("MAIN");
    main.insertAdjacentHTML("beforeend", this._msg.join("<br />"));
    this._root.appendChild(main);
    this._root.appendChild(document.createElement("HR"));

    // Buttons //
    center = document.createElement("CENTER");

    // -- Close
    let btnClose = document.createElement("BUTTON");
    btnClose.classList.add('btn');
    btnClose.insertAdjacentHTML('beforeend', '<big>&times;</big>');
    btnClose.addEventListener("click", () => this.close());
    center.appendChild(btnClose);

    // -- Custom
    if (typeof this._buttonText === 'string') {
      center.insertAdjacentHTML("beforeend", "&nbsp; &nbsp;");
      let btnCustom: HTMLElement = document.createElement("BUTTON");
      btnCustom.classList.add("btn");
      btnCustom.innerHTML = this._buttonText;

      if (typeof this._buttonPress === 'function')
        btnCustom.addEventListener("click", (event) => this._buttonPress(event));
      center.appendChild(btnCustom);
    }

    this._root.appendChild(center);

    return this._root;
  }

  /**
   * Open the popup
   * @return {Popup} this
   */
  public open(): Popup {
    const html: HTMLElement = this.html();
    document.getElementsByClassName('popups')[0].appendChild(html);

    // Add blank cover
    Page.openPopups.push(this);
    utils.getElementById('popupCover').removeAttribute('hidden');
    if (!Page.window.classList.contains('popupOpen')) Page.window.classList.add('popupOpen');

    return this;
  }

  /**
   * Close the popup
   * @return {Popup} this
   */
  public close(): Popup {
    if (this._root instanceof HTMLElement) {
      this._root.remove();
    }

    Page.openPopups.splice(Page.openPopups.indexOf(this), 1);
    // If last popups, remove cover
    if (Page.openPopups.length === 0) {
      utils.getElementById('popupCover').setAttribute('hidden', 'hidden');
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
  public delete(): Popup {
    Popup.Popups
    return this;
  }

  /**
   * When additional button is pressed...
   * @param {Event} ev  Button press event
   */
  public _buttonPress(ev: Event): void {
    let shallWeClose: boolean = true;
    if (typeof this._buttonClicked === 'function') {
      shallWeClose = this._buttonClicked(ev) !== false;
    }

    if (shallWeClose) this.close();
  }

  public static Popups: Array<Popup> = new Array<Popup>(); // Store an array of alive popups
  public static Holder: HTMLElement = document.querySelectorAll<HTMLElement>('popups')[0]; // Holder for destination of all popups
}

export default Popup;