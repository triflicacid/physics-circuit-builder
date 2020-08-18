import { IComponentInfo, IComponentInfoCollection } from "models/ComponentInfo";
import Vars from "page/vars";
import { IComponentData } from "models/saveData";

export default class ComponentInfo {
  private static _htmlNull(): string {
    return '<null style="font-style: italic; color: gray;">Null</null>';
  }

  public static getHeader(ctype: string, activeTags?: string[], onClick?: (ev: Event) => void): HTMLSpanElement {
    const cinfo: IComponentInfo = Vars.componentInfo[ctype];

    const span = document.createElement("span");

    // Title
    const title = document.createElement("b");
    title.classList.add("componentTitle");
    title.style.fontSize = "1.6em";
    title.innerText = cinfo.name;

    if (onClick != undefined) {
      title.addEventListener('click', onClick);
    }
    span.appendChild(title);

    // Tags
    if (cinfo.tags != null && cinfo.tags.length !== 0) {
      let html = `&nbsp; <small>🏷️ (${cinfo.tags.length}) &nbsp;`;
      let i = 0;
      for (let tag of cinfo.tags) {
        const tagName: string = (activeTags != null && activeTags.indexOf(tag) !== -1) ? "mark" : "span";
        html += `<${tagName} class='tag' style='color: #878787;' data-tag="${tag}">${tag}</${tagName}>`;
        if (i !== cinfo.tags.length - 1) html += ",&nbsp;";
        i++;
      }
      html += `</i></small >`;

      span.insertAdjacentHTML("beforeend", html);
    }

    return span;
  }

  /**
   * Given a component type, return info
   * @param ctype component type e.g. "Bulb"
   */
  public static getInfo(ctype: string): HTMLDivElement {
    const cinfo: IComponentInfo = Vars.componentInfo[ctype];

    let html: string = '';

    // Added in
    html += `<br><i>Added in ${cinfo.added}</i><br>`;

    // About info
    html += `<p>${cinfo.about.join('<br>')}</p>`;

    // Action
    html += `<p>&nbsp; &nbsp; <b>Actions</b><br>`;
    html += `&nbsp; &bull; <b>Left-Click: </b>${cinfo.left == null ? ComponentInfo._htmlNull() : cinfo.left}<br>`;
    html += `&nbsp; &bull; <b>Right-Click: </b>${cinfo.right == null ? ComponentInfo._htmlNull() : cinfo.right}<br>`;
    html += `&nbsp; &bull; <b>Scroll: </b>${cinfo.scroll == null ? ComponentInfo._htmlNull() : cinfo.scroll}</p>`;

    // Config
    if (cinfo.config != null) {
      html += '<p><b>Config</b><br>';
      for (let config of cinfo.config) {
        html += `&nbsp; &bull; <b>${config[0]}</b>: ${config[1]}<br>`;
      }
      html += `</p>`;
    }


    const div: HTMLDivElement = document.createElement("div");
    div.classList.add("componentInfo");
    div.setAttribute("data-type", ctype);
    div.setAttribute("data-tags", (cinfo.tags == null) ? "" : cinfo.tags.join(" "));
    div.insertAdjacentHTML("beforeend", html);

    return div;
  }


  private _searchTerm: string = '';
  private _searchTags: string[] = [];

  private _arrayCTypes: string[] = [];
  private _arrayHeaders: HTMLSpanElement[] = [];
  private _arrayBodies: HTMLDivElement[] = [];
  private _arrayContainers: HTMLDivElement[] = [];
  private _window: Window | null = null;

  public constructor() { }

  // Search and filter the component info given a search term
  private _search(): void {
    this._searchTerm = this._searchTerm.toString().toLowerCase();
    this._searchTags.map(t => t.toLowerCase());

    if (this._searchTerm.length > 0 || this._searchTags.length > 0) {
      for (let cdiv of this._arrayContainers) {
        let isMatch: boolean = true;

        // Check search term
        if (this._searchTerm != '') {
          const type: string | undefined = cdiv.dataset.type;
          if (type != undefined) isMatch = type.toLowerCase().match(this._searchTerm) != null;
        }

        // Check tags
        if (this._searchTags.length !== 0 && this._searchTags[0] != '') {
          const tagString: string | undefined = cdiv.dataset.tags;
          if (tagString != undefined) {
            const tags: string[] = tagString.split(/\s{1,}/g).map(t => t.toLowerCase());
            let foundMatchingTag: boolean = false;
            for (let searchTag of this._searchTags) {
              if (tags.indexOf(searchTag.toLowerCase()) !== -1) {
                isMatch = true;
                foundMatchingTag = true;
                break;
              }
            }
            if (!foundMatchingTag) isMatch = false;
          }
        }

        if (isMatch) {
          cdiv.removeAttribute("hidden");
        } else {
          cdiv.setAttribute("hidden", "hidden");
        }
      }
    } else {
      for (let cdiv of this._arrayContainers) cdiv.removeAttribute("hidden");
    }
  }

  public getHTML(): HTMLDivElement {
    this._arrayCTypes.length = 0;
    this._arrayHeaders.length = 0;
    this._arrayBodies.length = 0;
    this._arrayContainers.length = 0;

    const div: HTMLDivElement = document.createElement("div");

    // Title
    div.insertAdjacentHTML("beforeend", `<h1>About Components</h1>`);

    // Search (text)
    const searchText: HTMLInputElement = document.createElement("input");
    searchText.setAttribute("type", "text");
    searchText.setAttribute("placeholder", "Blah Blah Blah");
    searchText.addEventListener("input", (e: Event) => {
      this._searchTerm = searchText.value;
      this._search();
    });

    div.insertAdjacentText("beforeend", "Search: ");
    div.appendChild<HTMLInputElement>(searchText);
    div.insertAdjacentHTML("beforeend", "<br>");

    // Search (tags)
    const searchTags: HTMLInputElement = document.createElement("input");
    searchTags.setAttribute("type", "text");
    searchTags.setAttribute("placeholder", "Tag1 Tag2 Tag3");
    searchTags.addEventListener("input", (e: Event) => {
      this._searchTags = searchTags.value.split(/\s{1,}/g);
      this._search();
    });

    div.insertAdjacentText("beforeend", "Tags: ");
    div.appendChild<HTMLInputElement>(searchTags);

    div.insertAdjacentHTML("beforeend", "<br><br>");


    // Get list of all components. If click on any, their full info is shown

    for (let ctype in Vars.componentInfo) {
      this._arrayCTypes.push(ctype);
      const cinfo: IComponentInfo = Vars.componentInfo[ctype];

      // Body
      const cbody = ComponentInfo.getInfo(ctype);
      cbody.setAttribute("hidden", "hidden");
      this._arrayBodies.push(cbody);

      // Header
      const cheader = ComponentInfo.getHeader(ctype, this._searchTags, (ev: Event) => {
        const target: EventTarget | null = ev.target; // <b />
        if (target == null) return;
        const title: HTMLElement = <HTMLElement>target;

        if (title.classList.contains("infoOpen")) {
          cbody.setAttribute("hidden", "hidden");
          title.classList.remove("infoOpen");
        } else {
          cbody.removeAttribute("hidden");
          title.classList.add("infoOpen");
        }
      });

      this._arrayHeaders.push(cheader);

      // Wrapper
      const cdiv = document.createElement("div");
      cdiv.setAttribute("data-type", ctype);
      cdiv.setAttribute("data-tags", cinfo.tags == null ? "" : cinfo.tags.join(" "));
      cdiv.classList.add("componentContainer");
      cdiv.appendChild<HTMLSpanElement>(cheader);
      cdiv.appendChild<HTMLDivElement>(cbody);
      this._arrayContainers.push(cdiv);
      div.appendChild<HTMLDivElement>(cdiv);
    }

    return div;
  }

  public genStyles(): HTMLStyleElement {
    const style = document.createElement("style");
    style.innerText = `body { font-family: Arial; background-color: linear-gradient(40deg, #eee 10%, #888 100%); }`;
    style.innerText += `.componentTitle { cursor: default; color: mediumblue; }`;
    style.innerText += `.componentTitle.infoOpen { cursor: default; color: red; }`;
    style.innerText += `.componentTitle:hover { cursor: pointer; color: red; }`;
    style.innerText += `.componentInfo { padding: 6px; margin: 5px; padding-left: 20px; margin-left: 3px; border-left: 2px solid black; background: #ededed; }`;
    style.innerText += `.componentContainer { margin: 5px; padding: 3px; }`;
    style.innerText += `.tag { font-family: monospace }`;
    return style;
  }

  public open(): Window | null {
    if (this._window instanceof Window) return this._window;

    this._window = window.open("", "About Components", "width=700,height=500,top=10,left=10,resizable=yes");
    if (this._window != null) {
      this._window.document.body.appendChild<HTMLStyleElement>(this.genStyles());
      this._window.document.body.insertAdjacentHTML("beforeend", "<title>About Components</title>");
      this._window.document.body.appendChild<HTMLDivElement>(this.getHTML());
    }

    return this._window;
  }

  public close(): void {
    if (this._window == null) return;
    this._window.close();
  }
}
