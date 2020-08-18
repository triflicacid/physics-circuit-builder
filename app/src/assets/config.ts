import { IConfig } from "models/Config";
import * as utils from "./utils";

export class Config {
  /**
   * Default input for any value
   * @param header          Header text
   * @param defaultValue    OPTIONAL default value
   * @param onChange        Function triggered onChange
   */
  public static newDefault<T>(header: string, defaultValue?: T, onChange?: (c: any, value: string) => void): (c: any) => IConfig {
    return (c: any): IConfig => {
      // <td />
      const input = document.createElement('input');
      input.setAttribute('type', 'text');
      if (defaultValue != undefined) {
        input.setAttribute('placeholder', defaultValue + "");
        input.setAttribute('value', defaultValue + "");
      }
      if (onChange != undefined) input.addEventListener('change', (ev: Event) => {
        const value: string = (<HTMLInputElement>ev.target).value;
        onChange(c, value);

        // Set new defaut value
        input.setAttribute("value", value);
      });

      const td: HTMLTableDataCellElement = document.createElement('td');
      td.appendChild(input);

      // <th />
      const th: HTMLTableHeaderCellElement = document.createElement("th");
      th.innerText = header;

      return { th, td };
    };
  }

  /**
   * Number input
   * @param slider          SHould the input be a slider?
   * @param header          Header text
   * @param min             Minimum numeric value
   * @param max             Maximum numeric value
   * @param defaultValue    OPTIONAL default value
   * @param step            Value the input should step up/down in
   * @param onChange        Function triggered onChange
   */
  public static newNumberInput(slider: boolean, header: string, min: number, max: number, defaultValue?: number, step: number = 1, onChange?: (c: any, value: number) => void): (c: any) => IConfig {
    defaultValue = defaultValue ?? (max - min) / 2;
    if (defaultValue < min || defaultValue > max) throw new RangeError(`NumberInput: default value cannot exceed range set by min and max`);
    step = step ?? 1;

    return (c: any): IConfig => {
      // <td />
      const input: HTMLInputElement = document.createElement("input");
      input.setAttribute('type', slider ? "range" : "number");
      input.setAttribute('min', min.toString());
      input.setAttribute('value', defaultValue + "");
      input.setAttribute('max', max.toString());
      input.setAttribute('step', step.toString());
      if (onChange != undefined) {
        input.addEventListener("change", (e: Event) => {
          // Clamp value
          const value: number = +input.value;

          if (value < min || value > max) {
            input.setAttribute("value", defaultValue + "");
            input.value = defaultValue + "";
            window.alert(`Invalid entry for ${header}.\nValue must be between ${min} and ${max}, got ${value}`);
          } else {
            onChange(c, value);

            // Set new default value
            input.setAttribute("value", value.toString());
          }
        });
      }

      const td: HTMLTableDataCellElement = document.createElement("td");
      td.appendChild(input);

      // <th />
      const th = document.createElement('th');
      th.innerText = header;

      return {
        td,
        th,
      };
    }
  }

  public static newMultiOption<T>(header: string, defaultValue: T, options: { text: string, value: T }[], onChange?: (c: any, value: T) => void): (c: any) => IConfig {
    return (c: any) => {
      // <td />
      const td: HTMLTableDataCellElement = document.createElement("td");

      if (options.length > 3) {
        const select: HTMLSelectElement = document.createElement("select");

        if (onChange != undefined) {
          select.addEventListener("change", (ev: Event) => onChange(c, <T>(<any>select.value)));

          // Remove "selected" from each <option />, and add "selected" to the new value
          const optionEls: HTMLOptionsCollection = select.options;
          for (let el of optionEls) {
            if (el.value == select.value) {
              el.setAttribute("selected", "selected");
            } else {
              el.removeAttribute("selected");
            }
          }
        }

        // Add options
        for (let option of options) {
          const elem: HTMLOptionElement = document.createElement("option");
          elem.setAttribute("value", option.value + "");
          elem.innerText = option.text;
          if (option.value === defaultValue) elem.setAttribute("selected", "selected");
          select.appendChild(elem);
        }

        td.appendChild(select);
      } else {
        // Push radio inputs
        for (let option of options) {
          const input: HTMLInputElement = document.createElement("input");
          input.setAttribute("type", "radio");
          input.setAttribute("name", "config-" + header);
          input.setAttribute("value", option.value + "");
          if (option.value === defaultValue) input.setAttribute("checked", "checked");
          if (onChange != undefined) {
            input.addEventListener("click", (ev: Event) => {
              onChange(c, option.value);

              let els: HTMLElement[] = utils.querySelectorAll("input[type='radio']", td);
              for (let el of els) el.removeAttribute("checked");

              input.setAttribute("checked", "checked");
            });
          }

          const span: HTMLSpanElement = document.createElement("span");
          span.appendChild(input);
          span.innerText += " " + option.text + " &nbsp;";
          span.appendChild(input);

          td.appendChild(span);
        }
      }
      // <th />
      const th = document.createElement("th");
      th.innerText = header;

      return { td, th };
    }
  }
}

export default Config;