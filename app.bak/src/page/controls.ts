import * as utils from 'assets/utils';
import Page from './index';
import CircuitItem from 'classes/circuitItem';
import Control from 'classes/control';
import Component from 'classes/component/Component';
import * as Components from 'classes/component/all/index';
import { Popup, PopupMode } from 'classes/popup';
import Tab from './tab';
import { ComponentError, NullError } from 'classes/errors';
import Wire from 'classes/wire';
import { Direction, State, CapacitorState } from 'models/enum';
import { ThermistorMode } from 'classes/component/all/Thermistor/index';

/**
 * Class for controling and manipulating controls in circuit.php
 */
export class Controls {
  /**
   * Component we are currently inserting
   * - Triggered by click on buttons in "Components"  tab
   * - Contains dataset.component of <a />
   */
  public static insertingComponent: string | null = null;
  public static componentShowingInfo: CircuitItem | null = null; // Stores component whose info id being displayed by analyse()

  public static lightSlider: HTMLInputElement; // Slider for adjusting light value
  public static lightText: HTMLSpanElement; // Show value of light
  public static temperatureSlider: HTMLInputElement; // Slider for adjusting temperature value
  public static temperatureText: HTMLSpanElement; // Show value of temperature
  public static pixelMetreRange: HTMLInputElement; // Slider for adjusting px:cm value
  public static pixelMetreText: HTMLSpanElement; // Show value of px:cm

  public static showInfo: HTMLInputElement; // Slider - are we showing additional info?
  public static isDebug: HTMLInputElement; // Slider - are we in debug mode?
  public static displayMode: HTMLSelectElement; // Select - how are we displaying the circuit?
  public static wireCreation: HTMLInputElement; // Slider - allow creation of wires?
  public static USMode: HTMLInputElement; // Slider - US mode (change component style) ?

  public static _analyse: { [id: string]: HTMLElement };

  /**
   * Initiate all controls
   */
  public static init(): void {
    Controls.showInfo = <HTMLInputElement>utils.getElementById("control-showInfo");
    Controls.isDebug = <HTMLInputElement>utils.getElementById("control-debug");
    Controls.displayMode = <HTMLSelectElement>utils.getElementById("control-displayMode");
    Controls.wireCreation = <HTMLInputElement>utils.getElementById("control-wireCreation");
    Controls.USMode = <HTMLInputElement>utils.getElementById("control-US");

    Controls.lightSlider = <HTMLInputElement>utils.getElementById("control-light-range");
    Controls.lightText = <HTMLSpanElement>utils.getElementById("control-light-text");
    Controls.temperatureSlider = <HTMLInputElement>utils.getElementById("control-temp-range");
    Controls.temperatureText = <HTMLSpanElement>utils.getElementById("control-temp-text");
    Controls.pixelMetreRange = <HTMLInputElement>utils.getElementById("control-pxm-range");
    Controls.pixelMetreText = <HTMLSpanElement>utils.getElementById("control-pxm-text");

    Controls.lightSlider.addEventListener("input", (event: Event): void => {
      if (Page.control == null) return console.warn("Page.control is null... Cannot handle event 'input' on 'lightSlider'");

      const target: HTMLInputElement = <HTMLInputElement>event.target;
      Page.control.lightLevel(+target.value);
      Controls.lightText.innerText = target.value;
    });

    Controls.temperatureSlider.addEventListener("input", (event: Event): void => {
      if (Page.control == null) return console.warn("Page.control is null... Cannot handle event 'input' on 'temperatureSlider'");

      const target: HTMLInputElement = <HTMLInputElement>event.target;
      Page.control.temperature(+target.value);
      Controls.temperatureText.innerText = target.value;
    });

    Controls.pixelMetreRange.addEventListener("input", (event: Event): void => {
      if (Page.control == null) return console.warn("Page.control is null... Cannot handle event 'input' on 'pixelMetreRange'");

      const target: HTMLInputElement = <HTMLInputElement>event.target;
      Page.control.pixelsPerCm = +target.value;
      Controls.pixelMetreText.innerText = target.value;
    });

    Controls.showInfo.addEventListener("click", (event: Event): void => {
      if (Page.control == null) return console.warn("Page.control is null... Cannot handle event 'click' on slider 'showInfo'");

      const target: HTMLInputElement = <HTMLInputElement>event.target;
      Page.control.showInfo = target.checked;
    });

    Controls.isDebug.addEventListener("click", (event: Event): void => {
      if (Page.control == null) return console.warn("Page.control is null... Cannot handle event 'click' on slider 'isDebug'");

      const target: HTMLInputElement = <HTMLInputElement>event.target;
      Page.control.debug = target.checked;
    });

    Controls.displayMode.addEventListener("change", (event: Event): void => {
      if (Page.control == null) return console.warn("Page.control is null... Cannot handle event 'change' on select menu 'displayMode'");

      const target: HTMLSelectElement = <HTMLSelectElement>event.target;
      Page.control.mode = +target.value;
    });

    Controls.wireCreation.addEventListener("click", (event: Event): void => {
      if (Page.control == null) return console.warn("Page.control is null... Cannot handle event 'click' on slider 'wireCreation'");

      const target = <HTMLInputElement>event.target;

      Page.control.isRunning = !target.checked;
      Page.control.enableCreateWire = target.checked;
    });

    Controls.USMode.addEventListener("click", (event: Event): void => {
      if (Page.control == null) return console.warn("Page.control is null... Cannot handle event 'click' on slider 'USMode'");

      const target: HTMLInputElement = <HTMLInputElement>event.target;
      Page.control.american(target.checked);
    });

    // Components button
    let links: HTMLElement[] = utils.querySelectorAll('.menu-tab[tab-target="components"] a[data-component]');
    for (let link of links) {
      const component: string | undefined = link.dataset.component;
      if (component == undefined) throw new NullError("HTMLElement.dataset.component", "Expected all insert components elements to have dataset-component: " + link);
      link.classList.add("insert-component");

      const img: HTMLImageElement = document.createElement("img");
      img.dataset.component = component;
      img.src = "assets/images/" + utils.toClassName(component) + ".png";
      img.setAttribute("click", utils.capitalise(component));
      link.appendChild(img);

      link.addEventListener("click", (event: Event): void => {
        const target: HTMLElement = <HTMLElement>event.target;
        Controls.clickInsertComponentBtn(target);
        event.stopPropagation();
      });
    }

    // Event listener for inserting components
    document.body.addEventListener("click", (event: MouseEvent): void => {
      if (typeof Controls.insertingComponent === "string" && Page.openPopups.length === 0) {
        Controls.clickInsertComponentBody(event.clientX, event.clientY);
      }
    });

    // Analysis tab HTML
    Controls._analyse = {
      name: utils.getElementById("analyse-name"),

      analyseCircuit: utils.getElementById('analyse-circuit'),
      cName: utils.getElementById("analyse-c-name"),
      cResistance: utils.getElementById("analyse-c-resistance"),
      cVoltage: utils.getElementById("analyse-c-voltage"),
      cPower: utils.getElementById("analyse-c-power"),
      cCurrent: utils.getElementById("analyse-c-current"),
      cMaxCurrent: utils.getElementById("analyse-c-maxCurrent"),
      cIsOn: utils.getElementById("analyse-c-isOn"),
      cIsBlown: utils.getElementById("analyse-c-isBlown"),
      cExternLight: utils.getElementById("analyse-c-externLight"),
      cExternTemp: utils.getElementById("analyse-c-externTemp"),
      cOther: utils.getElementById("analyse-c-other"),
      cConfig: utils.getElementById("analyse-config"),
      cConns: utils.getElementById("analyse-c-conns"),

      analyseWire: utils.getElementById('analyse-wire'),
      wHasRes: utils.getElementById("analyse-w-hasRes"),
      wRes: utils.getElementById("analyse-w-res"),
      wLength: utils.getElementById("analyse-w-length"),
      wMaterial: utils.getElementById("analyse-w-material"),
      wRadius: utils.getElementById("analyse-w-radius"),
      wVolume: utils.getElementById("analyse-w-volume"),
    };
  }

  /**
   * Start running Page.control
   */
  public static start(): void {
    if (Page.control == null) return console.warn("Page.control is null... Cannot call start()");
    // Page.control.start();
    Page.control.isRunning = true;
  }

  /**
   * Stop running Page.control
   */
  public static stop(): void {
    if (Page.control == null) return console.warn("Page.control is null... Cannot call stop()");
    Page.control.isRunning = false;
  }

  /**
   * Prepare controls (called after new circuit is installed)
   */
  public static prep(): void {
    if (Page.control == null) return console.warn("Page.control is null... Cannot call prep()");

    Controls.lightSlider.value = Page.control.lightLevel().toString();
    utils.eventOn(Controls.lightSlider, "input");

    Controls.temperatureSlider.setAttribute("min", Control.MIN_TEMP.toString());
    Controls.temperatureSlider.setAttribute("max", Control.MAX_TEMP.toString());
    Controls.temperatureSlider.value = Page.control.temperature().toString();
    utils.eventOn(Controls.temperatureSlider, "input");

    Controls.pixelMetreRange.value = Page.control.pixelsPerCm.toString();
    Controls.pixelMetreText.innerText = Page.control.pixelsPerCm.toString();

    // Page.controls.fpsSlider.value = Page.control._fps;
    // utils.eventOn(Page.controls.fpsSlider, "input");

    if (Page.control.showInfo) Controls.showInfo.click();
    if (Page.control.enableCreateWire) Controls.wireCreation.click();
    if (Page.control.debug) Controls.isDebug.click();
  }

  /**
   * Handle onClick event of .insert-component button
   * @param  {HTMLElement} a    Element clicked on (<img /> or <a />)
   */
  public static clickInsertComponentBtn(a: HTMLElement): void {
    if (typeof Controls.insertingComponent === "string") return;

    const component = a.dataset.component;
    if (typeof component !== "string" || component.length === 0) {
      console.log(a);
      throw new TypeError(`Cannot find dataset.component (^).`);
    }

    Controls.insertingComponent = component;
    Controls.afterInsertInit();
  }

  /**
   * Handle the "drop" of the component
   * @param  {Number} x   X coordinate to insert component
   * @param  {Number} y   Y coordinate to insert component
   * @return {Boolean}    Was the insert successful
   */
  public static clickInsertComponentBody(x: number, y: number): boolean {
    if (Page.control == null) {
      console.warn("Page.control is null... Cannot call clickInsertComponentBody");
      return false;
    }

    // Check if canvas contains coords
    const contains = Page.control.contains(x, y);

    if (contains) {
      const component: string | null = Controls.insertingComponent;
      if (component == null) return false;

      Controls.afterInsertEnd();
      const coords: [number, number] = Page.control.coordsOnCanvas(x, y);

      try {
        Page.control.createComponent(component, ...coords);
        Page.control.render();
        return true;
      } catch (e) {
        // 'Harmless' ComponentError
        if (e instanceof ComponentError) {
          new Popup("Cannot Insert Component", e.message)
            .mode(PopupMode.Error)
            .open();
          console.error(e);
        } else {
          // Other error. Throw as this was un-generated.
          throw e;
        }
        return false;
      }
    } else {
      new Popup("Unable to Insert Component", "You didn't click on the circuit - cannot insert component outside of the circuit")
        .mode(PopupMode.Warn)
        .open();
      Controls.afterInsertEnd();
      return false;
    }
  }

  /**
   * Stuff to execute after a file/instance is opened
   */
  public static afterFileOpened(): void {
    if (Page.control == null) return console.warn("Page.control is null... Cannot call afterFileOpened");

    // Show all "if-file-open" tabs
    let els: HTMLElement[] = utils.querySelectorAll(".ifFileOpen");
    for (let el of els) Page.show(<HTMLElement>el);

    // Hide all "if-file-closed" tabs
    els = utils.querySelectorAll(".ifFileClosed");
    for (let el of els) Page.hide(<HTMLElement>el);

    Tab.file.innerText = "File: " + (Page.control.file || "(new)");
    Controls.prep();

    // if (Page.autoStartCircuit) Page.control.start();
    if (Page.autoStartCircuit) Page.control.isRunning = true;
  }

  /**
   * Stuff to execute after the control instance is closed
   */
  public static afterFileClosed(): void {
    // Show all "if-file-open" tabs
    let els: HTMLElement[] = utils.querySelectorAll(".ifFileOpen");
    for (let el of els) Page.hide(<HTMLElement>el);

    // Hide all "if-file-closed" tabs
    els = utils.querySelectorAll(".ifFileClosed");
    for (let el of els) Page.show(<HTMLElement>el);

    Tab.file.innerText = "File";
  }

  /**
   * Stuff to execute after inert button has been pressed (component)
   */
  public static afterInsertInit(): void {
    utils.querySelector('img[data-component="' + Controls.insertingComponent + '"]').classList.add("inserting");
    Tab.components.innerHTML = "Components: inserting " + Controls.insertingComponent;
    Page.window.classList.add("insertingComponent");
    // Page.tab.hide(Page.controls.componentTab);
  }

  /**
   * Stuff to execute after inserted component
   */
  public static afterInsertEnd(): void {
    utils.querySelector('img[data-component="' + Controls.insertingComponent + '"]').classList.remove("inserting");
    Controls.insertingComponent = null;
    Page.window.classList.remove("insertingComponent");
    Tab.components.innerHTML = "Components";
  }

  /**
  * !TEMPORARY!
  * ? while port to TS is under way
  */
  // /**
  //  * Change a private configurable field
  //  * @param  {Number} cid     Configuration field ID
  //  * @param  {HTMLElement} elem   Elemm to get value from
  //  */
  // public static config(cid: number, elem: HTMLElement) {
  //   if (Page.control instanceof Control && Controls.componentShowingInfo instanceof Component) {
  //     const config: any[] = Controls.componentShowingInfo.constructor.config;
  //     if (Array.isArray(config)) {
  //       const field = config[cid];
  //       let value: any;
  //       if (elem instanceof HTMLInputElement) value = (<HTMLInputElement>elem).value;
  //       else if (elem instanceof HTMLSelectElement) value = (<HTMLSelectElement>elem).value;
  //       else throw new TypeError("Cannot get property value of " + elem.constructor.name);

  //       let analyseAfter = false;
  //       switch (field.type) {
  //         case "boolean":
  //           value = value === "1" || value === "true";
  //           Controls.analyse(Controls.componentShowingInfo);
  //           break;
  //         case "number":
  //           value = +value;
  //           if (isNaN(value)) return;
  //           break;
  //         case "dir":
  //           value = +value;
  //           analyseAfter = true;
  //           break;
  //         case "option":
  //           switch (field.optionType) {
  //             case 'boolean':
  //               value = value === "1" || value === "true";
  //               break;
  //             case "number":
  //               value = +value;
  //               if (isNaN(value)) return;
  //               break;
  //           }
  //           analyseAfter = true;
  //           break;
  //         default:
  //           console.warn(`Cannot set field '${field.field}' to '${value}': unknown argument mode '${field.type}'`);
  //           return;
  //       }

  //       if (field.method) {
  //         Controls.componentShowingInfo[field.field](value);
  //       } else {
  //         Controls.componentShowingInfo[
  //           "_" + field.field
  //         ] = value;
  //       }

  //       if (analyseAfter) Controls.analyse(Controls.componentShowingInfo);
  //     }
  //   }
  // }

  /**
   * Click on delete (x) button in analyse component
   * @param  {Number} id  ID of component. Default is Page.componentShowingInfo._id;
   * @param  {Boolean} reanalyse  Call Page.controls.analyse() after?
   */
  public static clickDeleteComponent(id: number, reanalyse: boolean = true): void {
    if (Page.control == null) return console.warn("Page.control is null... Cannot call clickDeleteComponent");

    if (id === undefined && Controls.componentShowingInfo instanceof Component)
      id = Controls.componentShowingInfo.id;

    if (typeof id === 'number') {
      const c = Page.control.components[id];
      if (c instanceof Component && window.confirm(`Remove component '${c.toString()}' from the circuit?`)) {
        c.remove();

        // If reanalyse, update analysis section...
        if (reanalyse) {
          if (c === Controls.componentShowingInfo) {
            Controls.analyse(null);
          } else {
            Controls.analyse(Controls.componentShowingInfo);
          }
        }
      }
    } else {
      console.warn('clickDeleteComponent: no ID provided');
    }
  }

  /**
   * Analyse a certain component
   * @param  {Component} c    Component to analyse, or '1' to re-analyse current component
   */
  public static analyse(c: CircuitItem | null): void {
    if (Page.control == null) return console.warn("Page.control is null... Cannot call analyse()");

    const info = Controls._analyse;
    Controls.componentShowingInfo = c;

    Page.hide(info.analyseCircuit);
    Page.hide(info.analyseWire);

    if (c instanceof Component) {
      Page.show(info.analyseCircuit);
      // Tab text
      info.name.innerText = c.toString();

      // "Component Info" table info
      info.cName.innerHTML = c.toString() + ` (passable: ${utils.getHtmlBoolString(c.passable())})`;
      info.cResistance.innerHTML = utils.numberFormat(c.resistance, 3);
      info.cVoltage.innerHTML = utils.numberFormat(c.voltage, 3);
      info.cPower.innerHTML = utils.numberFormat(c.power(), 3);
      info.cCurrent.innerHTML = utils.numberFormat(c.current, 3);

      if (c.isBlowable()) {
        info.cMaxCurrent.innerHTML = (!isFinite(c.maxCurrent) || Number.MAX_SAFE_INTEGER <= c.maxCurrent) ? "&infin;" : utils.numberFormat(c.maxCurrent, 3);
        info.cIsBlown.innerHTML = utils.getHtmlBoolString(c.isBlown());
      } else {
        info.cMaxCurrent.innerHTML = "<small>N/A</small>";
        info.cIsBlown.innerHTML = utils.getHtmlBoolString(false);
      }

      info.cIsOn.innerHTML = utils.getHtmlBoolString(c.isOn());
      info.cExternLight.innerHTML = utils.roundTo(c.lightRecieving(), 2).toString();
      info.cExternTemp.innerHTML = utils.roundTo(c.heatRecieving(), 2).toString();

      /*** Additional info ***/
      let other = [];

      // If luminous...
      if (c.isLuminous()) other.push(["Luminoscity", utils.roundTo(c.luminoscity(), 2) + "lm @ " + c.lumensPerWatt + "lm/w"]);

      if (c instanceof Components.Bulb) {
        info.cName.innerText = c.wattage() + "-Watt " + c.constructor.name;
        other.push(
          ["Brightness", utils.roundTo(c.brightness() * 100, 1) + "%"],
          ["Old Symbol", utils.getHtmlBoolString(c.oldSymbol)]
        );
      }

      if (c instanceof Components.Resistor) other.push(["<abbr title='American circuit symbol'>US</abbr>", utils.getHtmlBoolString(c.american)]);
      if (c.isPowerSource()) other.push(["Direction", c.direction === Direction.Left ? "Left" : "Right"]);
      if (c instanceof Components.Ammeter) other.push(["Units", c.units]);
      if (c instanceof Components.ACPowerSupply) other.push(["Freq", c.hertz() + "Hz"]);
      if (c instanceof Components.DCPowerSupply)
        other.push(
          ["Max Voltage", c.maxVoltage + "V"],
          ["<abbr title='What to change voltage by onScroll'>Sensitivity</abbr>", "&Delta;" + c.sensitivity() + "V"]
        );
      if (c instanceof Components.Switch) other.push(["Closed?", utils.getHtmlBoolString(c.state === State.Closed)]);
      if (c instanceof Components.Buzzer)
        other.push(
          ["Volume", c.volume() * 100 + "%"],
          ["Mute", utils.getHtmlBoolString(c.isMuted)],
          ["Freq", c.frequency + "Hz"]
        );
      if (c instanceof Components.Battery) {
        info.cVoltage.innerHTML = c.cells + " &times; " + (c.voltage / c.cells) + "V = " + c.voltage;
        info.cName.innerHTML = c.cells + "-Cell Battery";
      }
      if (c instanceof Components.Diode) other.push(["Direction", c.direction === Direction.Left ? "Left" : "Right"]);
      if (c instanceof Components.LightEmittingDiode) {
        const rgb: string = "rgb(" + c.getColour().join(", ") + ")";
        other.push(["Colour", `<span style='background-color: ${rgb}'>hsb(${c.getColour(true).join(', ')})<br>${rgb}</span>`]);
      }
      if (c instanceof Components.Connector) {
        if (!c.isEnd) info.cResistance.innerHTML = "<abbr title='Resistance of connected circuits in parallel'>" + c.resistance + "</abbr>";
        if (!(c instanceof Components.TwoWaySwitch)) other.push(["Type", c.isEnd ? "Joiner" : "Splitter"]);
      }
      if (c instanceof Components.TwoWaySwitch) other.push(["Switch Pos", c.executing]);
      if (c instanceof Components.Capacitor)
        other.push(
          ["Capacitance", c.capacitance + "µF"],
          ["Target", c.targetVoltage + "V"],
          ["State", CapacitorState[c.state]]
        );
      if (c instanceof Components.Motor)
        other.push([`<abbr title='If current = maxCurrent'>Max Speed</abbr>`, utils.roundTo(utils.rad2deg(c.K), 1) + "&deg;"],
          ["Speed", utils.roundTo(utils.rad2deg(c.delta()), 2) + "&deg; / frame"],
          ["Angle", c.angle()]
        );
      if (c instanceof Components.Heater)
        other.push(
          ["Temp", c.temp() + "°C"],
          ["Max Temp", c.maxTemp + "°C"],
          ["Capacity", utils.roundTo(c.percent()) + "%"],
          ["Efficiency", utils.roundTo(c.efficiency, 1) + "%"]
        );
      if (c instanceof Components.Thermistor)
        other.push(
          ["temp:resistance", (c.mode === ThermistorMode.NTC ? "Negative" : "Positive ") + " Correlation"],
          ["Temp Range", c.min + "°C to " + c.max + "°C"]
        );
      if (c instanceof Components.MaterialContainer)
        other.push(
          ["Material", utils.nicifyString(c.materialData.name, ' ')],
          ["Length", utils.roundTo(c.length / Page.control.pixelsPerCm, 3) + 'cm (' + Math.round(c.length) + 'px)'],
          ["Volume", utils.numberFormat(c.volume(true), 3) + 'cm³ (' + Math.round(c.volume(false)) + 'px)'],
          ["On-Scroll", c.changeMaterial ? "Change material" : "Change length"],
        );
      if (c instanceof Components.WireContainer)
        other.push(
          ["Material", utils.nicifyString(c.materialData.name, ' ')],
          ["Length", utils.roundTo(c.length / Page.control.pixelsPerCm, 3) + 'cm (' + Math.round(c.length) + 'px)'],
          ["Volume", utils.numberFormat(c.volume(true), 3) + 'cm³ (' + Math.round(c.volume(false)) + 'px)'],
          ["On-Scroll", c.changeMaterial ? "Change material" : "Change length"],
        );

      let otherHTML = "";
      for (let row of other) {
        otherHTML += `<tr><th>${row[0]}</th><td>${row[1]}</td></tr>`;
      }
      info.cOther.innerHTML = otherHTML;

      // // Config
      // const config = c.constructor.config;
      // if (Array.isArray(config)) {
      //   const fields = [];
      //   for (let i = 0; i < config.length; i++) {
      //     const cobj = config[i];
      //     const field = {
      //       field: cobj.field,
      //       type: cobj.type,
      //       name: cobj.name,
      //       html: "",
      //     };
      //     switch (cobj.type) {
      //       case "boolean":
      //         field.html = `<input type='radio' name='config-${
      //           cobj.field
      //           }' onclick='Page.controls.config(${i}, this)' value='0'${
      //           c["_" + cobj.field] ? "" : " checked"
      //           } /> ${utils.getHtmlBoolString(false)}
      //                                       <input type='radio' name='config-${
      //           cobj.field
      //           }' onclick='Page.controls.config(${i}, this)' value='1'${
      //           c["_" + cobj.field] ? " checked" : ""
      //           } /> ${utils.getHtmlBoolString(true)}`;
      //         break;
      //       case "number":
      //         if (cobj.slider) {
      //           field.html = `<input type='range' min='${cobj.min}' step='${cobj.step == undefined ? 1 : cobj.step}' value='${c["_" + cobj.field]}' max='${cobj.max}' oninput='Page.controls.config(${i}, this); document.getElementById("c-config-${cobj.field}-value").innerText = this.value;' /> <span id='c-config-${cobj.field}-value'>${c["_" + cobj.field]}</span>`;
      //         } else {
      //           field.html = `<input type='number' min='${cobj.min}' value='${c["_" + cobj.field]}' max='${cobj.max}' onchange='Page.controls.config(${i}, this);' />`;
      //         }
      //         break;
      //       case "dir":
      //         field.html = `<input type='radio' name='config-${
      //           cobj.field
      //           }' onclick='Page.controls.config(${i}, this)' value='0'${
      //           c["_" + cobj.field] ? "" : " checked"
      //           } /> Left
      //                           <input type='radio' name='config-${
      //           cobj.field
      //           }' onclick='Page.controls.config(${i}, this)' value='1'${
      //           c["_" + cobj.field] ? " checked" : ""
      //           } /> Right`;
      //         break;
      //       case "option": {
      //         if (cobj.options.length > 2) {
      //           field.html += `<select onchange='Page.controls.config(${i}, this)'>`;
      //           for (let option of cobj.options) {
      //             field.html += `<option value='${option.value}'${c["_" + cobj.field] === option.value ? " selected" : ""}>${option.name}</option>`;
      //           }
      //           field.html += '</select>';
      //         } else {
      //           for (let option of cobj.options) {
      //             field.html += `<input type='radio' name='config-${cobj.field}' value='${option.value}'${c["_" + cobj.field] === option.value ? " checked" : ""} onclick='Page.controls.config(${i}, this);' /> ${option.name}`;
      //           }
      //         }
      //         break;
      //       }
      //       default:
      //         console.warn(
      //           `${c.toString()} : config('${
      //           cobj.field
      //           }'): type '${cobj.type}' is not available`
      //         );
      //         continue;
      //     }
      //     fields.push(field);
      //   }

      //   // Show config info
      //   let html = "";
      //   for (let field of fields) {
      //     html += `<tr><th title='${c.toString()}.${field.field}: ${field.type}'>${field.name}</th><td>${field.html}</td></tr>`;
      //   }
      //   info.cConfig.innerHTML = html;

      //   // Connection info
      //   const inputs = c._inputs.length;
      //   const outputs = c._outputs.length;
      //   const rows = Math.max(inputs, outputs);
      //   let tmp;
      //   html = "";
      //   for (let i = 0; i < rows; i++) {
      //     html += '<tr>';

      //     if (i >= inputs) {
      //       html += '<td colspan="2" />';
      //     } else {
      //       tmp = c._inputs[i]._input;
      //       html += `<td>${tmp.toString()}</td><td><span class='del-btn' title='Delete' onclick='Page.controls.clickDeleteComponent(${tmp._id}, true);'>&times;</span></td>`;
      //     }

      //     if (i >= outputs) {
      //       html += '<td colspan="2" />';
      //     } else {
      //       tmp = c._outputs[i]._output;
      //       html += `<td>${tmp.toString()}</td><td><span class='del-btn' title='Delete' onclick='Page.controls.clickDeleteComponent(${tmp._id}, true);'>&times;</span></td>`;
      //     }

      //     html += '</tr>';
      //   }
      //   info.cConns.innerHTML = html;
      // }
    } else if (c instanceof Wire) {
      Page.show(info.analyseWire);
      info.name.innerText = c.toString();

      info.wHasRes.innerHTML = '<input type="radio" name="analyse-w-hasRes-radio" onclick="Page.controls.componentShowingInfo._hasResistance = true; Page.controls.analyse(1);" ' + (c.hasResistance ? "checked " : "") + '/> <span style="color: green;">Yes</span>';
      info.wHasRes.innerHTML += '<input type="radio" name="analyse-w-hasRes-radio" onclick="Page.controls.componentShowingInfo._hasResistance = false; Page.controls.analyse(1);" ' + (c.hasResistance ? "" : "checked ") + '/> <span style="color: crimson;">No</span>';

      info.wRes.innerText = utils.numberFormat(c.resistance, 4);

      const length = c.length;
      info.wLength.innerText = `${utils.roundTo(length / Page.control.pixelsPerCm, 2)}cm (${Math.round(length)}px)`;

      if (c.hasResistance) {
        const onclick = `Page.controls.componentShowingInfo.radiusPx(+this.value); document.getElementById("analyse-w-radius-text").innerText = utils.roundTo(Page.controls.componentShowingInfo.radiusCm(), 3) + "cm (" + utils.roundTo(Page.controls.componentShowingInfo.radiusPx(), 1) + "px)";`;
        let html = `<input type='range' min='${Wire.MIN_RADIUS}' value='${c.radiusPx()}' step='0.1' max='${Wire.MAX_RADIUS}' oninput='${onclick}' onchange='Page.controls.analyse(1);' /> <span id='analyse-w-radius-text'>${utils.roundTo(c.radiusCm(), 3)}cm (${utils.roundTo(c.radiusPx(), 1)}px)</span>`;
        info.wRadius.innerHTML = html;
      } else {
        info.wRadius.innerText = utils.roundTo(1.5 / Page.control.pixelsPerCm, 3) + 'cm';
      }

      info.wVolume.innerHTML = utils.numberFormat(c.volume(true), 3);

      let html = "<select onchange='Page.controls.componentShowingInfo._material = +this.value; Page.controls.analyse(1);'>";
      for (let i = 0; i < Wire.MATERIALS_KEYS.length; i++) {
        const material: string = Wire.MATERIALS_KEYS[i];
        html += `<option value="${i}"${c.materialIndex === i ? " selected" : ""}>${utils.nicifyString(material, ' ')} (${utils.numberFormat(Wire.MATERIALS[i].resistance, 2)} Ω/m³)</option>`;
      }
      info.wMaterial.innerHTML = html + "</select>";
    } else {
      // Clear all HTML
      for (let prop in info) {
        if (info.hasOwnProperty(prop) && (prop[0] === 'c' || prop[0] === 'w')) {
          info[prop].innerHTML = "";
        }
      }
      info.name.innerText = "none";
    }
  }

  /**
   * Re-analyse the current component
   */
  public static reAnalyse(): void {
    Controls.analyse(Controls.componentShowingInfo);
  }
}

export default Controls;