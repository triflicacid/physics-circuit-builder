import { Popup, PopupMode } from 'classes/popup';
import Page from './index';
import Tab from './tab';
import ISaveData from 'models/saveData';
import Server from 'assets/server';
import Control from 'classes/control';
import Controls from './controls';
import * as utils from 'assets/utils';
import { NullError } from 'classes/errors';

export class File {
  public static files: Array<string> = new Array<string>(); // Array of all available files
  public static readonly openFilePopup: Popup = new Popup("Open A File...", "...").autoDelete(false); // Popup for when opening files
  public static readonly closeFilePopup: Popup = new Popup("Close File", "Are you sure you want to close this file?", "Any unsaved changed will be lost.").autoDelete(false); // Popup for when closing a file

  /**
  * Update file[] list
  * @return {String[]} list of files
  */
  public static async updateList(): Promise<string[]> {
    let list: string[] = await Server.getFiles("json");
    File.files = list;

    // Update popup
    const div: HTMLDivElement = document.createElement('div');
    div.classList.add('list');
    div.appendChild(File.fileList());
    File.openFilePopup.htmlContent = div;

    return File.files;
  }

  /**
  * Load a given file
  * @async
  * @param  {String} file    Filename
  * @param  {Function} callback  Function to execute after loaded
  */
  public static async load(file: string, callback?: Function): Promise<void> {
    if (Page.control instanceof Control) {
      File.openFilePopup.close();
      new Popup("Cannot Open File", "Unable to open file " + file + " as another file is already open.")
        .mode(PopupMode.Warn)
        .open();
    } else {
      let data: ISaveData;
      try {
        let raw: string = await Server.getFile(file);
        data = JSON.parse(raw);
      } catch (e) {
        File.openFilePopup.close();
        new Popup("Unable to open file", "Unable to open file '" + file + "': " + e)
          .mode(PopupMode.Error)
          .open();
        return;
      }
      File.openFilePopup.close();
      Tab.hide(Tab.file);

      Page.control = new Control();
      Page.control.load(data, callback);
      Page.control.file = file;

      Controls.afterFileOpened();
    }
  }

  /**
   * Get fileList HTML
   * @return {String}
   */
  public static fileList(): HTMLTableElement {
    const table = document.createElement('table');

    File.files.forEach((file) => {
      const row: HTMLTableRowElement = document.createElement('tr');
      table.appendChild(row);

      const cell: HTMLTableCellElement = document.createElement('td');
      row.appendChild(cell);

      let span: HTMLSpanElement = document.createElement('span');
      cell.appendChild(span);
      span.classList.add('file-icon');
      span.innerHTML = "&#x1f5ce; ";

      span = document.createElement('span');
      cell.appendChild(span);
      span.classList.add('link');
      span.innerText = file;
      span.addEventListener("click", () => File.load(file));
    });

    return table;
  }

  /**
   * Save the current control
   */
  public static save(): void {
    if (Page.control == null) {
      new Popup("Cannot save", "Nothing is open to save")
        .mode(PopupMode.Warn)
        .open();
      return;
    } else if (Page.control.locked) {
      Controls.lockedMessage("save circuit");
      return;
    }

    Tab.hide(Tab.file);
    if (Page.isCircuitOpen()) {
      let filename: string = Page.control.file || "new";
      filename = filename.replace(".json", "");

      // Save popup
      new Popup("Save")
        .msg(
          "<center>",
          `<b>Save as: </b><input type='text' value='${filename}' />`,
          "</center>"
        )
        .extraButton("Save", File._save)
        .open();
    } else {
      const warn: Popup = new Popup("Cannot Save", "There is nothing to save.");
      warn.mode(PopupMode.Warn);
      warn.open();
    }
  }

  /**
   * Actually save the open circuit to a given file
   * @param  {Event} ev   Button press
   * @return {Boolean} Close popup?
   */
  private static async _save(ev: Event): Promise<boolean> {
    if (Page.control == null) {
      console.warn("Cannot call _save(): nothing is open");
      return true;
    }

    // Get filename form <input />
    const btn: HTMLElement = <HTMLElement>ev.target;
    if (!(btn instanceof HTMLButtonElement)) throw new TypeError(`Expected HTMLButtonElement, got unknown`);
    if (btn.parentNode == null) throw new NullError("btn.parentNode", "Expected button to be a child element");
    if (btn.parentNode.parentNode == null) throw new NullError("btn.parentNode", "Expected button to be a child element of a child element");

    const file: string = (<HTMLInputElement>utils.querySelector("input", btn.parentNode.parentNode)).value;

    if (typeof file !== "string" || file.length === 0 || file.match(/[^A-Za-z0-9_]/g)) {
      new Popup("Cannot save file", "Invalid filename. Must be a string only containing letters, numbers and underscore.")
        .mode(PopupMode.Error)
        .open();
      console.error("Invalid filename:", file);
      return false;
    }
    const filename: string = file + ".json";

    // Get control's JSON
    let json: string;
    try {
      json = JSON.stringify(Page.control.getData());
    } catch (e) {
      new Popup("Cannot Save")
        .mode(PopupMode.Error)
        .msg("Unable to get data of circuit:", e)
        .open();
      console.error("==== [CIRCUIT SAVE ERROR (Page.file.save)] ====\n", e);
      return false;
    }

    // Try to save it normally
    try {
      // Try to put file
      await Server.putFile(filename, json);
    } catch (e) {
      if (e === "E404") {
        await Server.createFile(filename);
        await Server.putFile(filename, json);
      } else {
        new Popup("Cannot Save File", "Internal Error:", e)
          .mode(PopupMode.Error)
          .open();
        console.error(e);
        return true;
      }
    }

    // Update file tab
    Tab.file.innerText = "File: " + filename;

    // Update files
    File.updateList();

    return true;
  }

  /**
   * Attempt to create a new instance
   */
  public static new(): void {
    if (Page.isCircuitOpen()) {
      const warn: Popup = new Popup("Cannot Create New", "There is already a circuit instance open.");
      warn.mode(PopupMode.Warn);
      warn.open();
    } else {
      Page.control = new Control();
      Page.control.load();
    }
    Tab.hide(Tab.file);
    Controls.afterFileOpened();
  }

  /**
   * Close control
   * - NB called from popup (Page.file.closeFilePopup)
   * @param {HTMLButtonElement} btn   Button activiated by in popup
   */
  public static close(btn: HTMLButtonElement): boolean {
    if (Page.control instanceof Control) {
      Page.control.terminate();
      Page.control = null;
      Tab.hide(Tab.file);
      File.closeFilePopup.close();
      Controls.afterFileClosed();
    } else {
      const warn: Popup = new Popup("Cannot Close File", "There is no file open to close.");
      warn.mode(PopupMode.Warn);
      warn.open();
    }
    return true;
  }

  /**
   * Prompt to delete a file
   */
  public static delete(): void {
    if (Page.control == null) return console.warn("Cannot call delete(): nothing is open");
    if (Page.control.locked) {
      Controls.lockedMessage("delete circuit");
      return;
    }

    // If not a file, close...
    if (Page.control.file == null) {
      File.closeFilePopup.open();
    } else {
      const file: string = Page.control.file;
      new Popup("Delete File Confirmation", "Delete file " + file + "? It will be unrecoverable.")
        .mode(PopupMode.Warn)
        .extraButton("Delete", (btn: HTMLButtonElement): boolean => {
          try {
            File.close(btn);
            Server.deleteFile(file);
            File.updateList();
          } catch (e) {
            new Popup("Error Deleting File", "Internal Error:", e)
              .mode(PopupMode.Error)
              .open();
            console.error(e);
          }
          return true;
        })
        .open();
    }
  }
}

export default File;