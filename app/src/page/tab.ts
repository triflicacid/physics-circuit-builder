import { NullError } from "classes/errors";
import * as utils from 'assets/utils';

export class Tab {
  public static readonly control: HTMLElement = utils.querySelector('.menu a[data-target="control"]');
  public static readonly components: HTMLElement = utils.querySelector('.menu a[data-target="components"]');
  public static readonly file: HTMLElement = utils.querySelector('a[data-target="file"]');

  /**
   * Select a tab to view
   */
  public static select(tab: HTMLElement | null): void {
    if (tab == null) throw new NullError("tab");
    const wasOpen: boolean = tab.classList.contains("open");

    // Hide all tab contents
    for (let tabContent of document.querySelectorAll(".menu-tabs .menu-tab")) {
      tabContent.classList.remove("open");
      tabContent.setAttribute("hidden", "hidden");
    }

    for (let tabLink of document.querySelectorAll(".menu li a")) {
      tabLink.classList.remove("open");
    }

    let target: HTMLElement | null = document.querySelector("[tab-target='" + tab.dataset.target + "']");
    if (target == null) {
      throw new NullError(`tab-target="${tab.dataset.target}" does not exist: invalid tab.`);
    } else {
      if (wasOpen) {
        target.classList.remove("open");
        // target.setAttribute("hidden", "hidden");
        target.hidden = true;
      } else {
        tab.classList.add("open");
        target.classList.add("open");
        // target.removeAttribute("hidden");
        target.hidden = false;
      }
    }
  }

  /**
  * Hide a tab element
  * @param  {HTMLElement} tab Tab element
  */
  public static hide(tab: HTMLElement): void {
    tab.classList.remove("open");
    const target: HTMLElement | null = document.querySelector("[tab-target='" + tab.dataset.target + "']");
    if (target) {
      target.classList.remove("open");
      target.setAttribute("hidden", "hidden");
    } else {
      throw new NullError("tab", `Tab.hide: provided tab has no content: ${tab}`);
    }
  }
}

export default Tab;