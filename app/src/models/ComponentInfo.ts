export interface IComponentInfo {
  name: string; // Component name
  added: string; // Version added e.g. "1.2.2"
  about: string[]; // Info about component. Elements seperated by <br>
  right: string | null; // right-click action?
  left: string | null; // left-click action?
  scroll: string | null; // onscroll action?
  config: Array<[string, string]> | null; // Config options available to component [name, desc]
  tags: null | string[]; // Array of tags
}

export interface IComponentInfoCollection {
  [name: string]: IComponentInfo
}