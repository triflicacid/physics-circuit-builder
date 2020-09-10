export interface ISaveData {
  width: number; // Width of circuit board
  height: number; // Height of circuit board

  pxcm: number; // px:cm ratio
  temp: number; // Temperature of environment
  light: number; // Light level of environment
  lock: boolean; // Is circuit locked for editing

  components: IComponentData[]
}

export interface IComponentData {
  type: string; // Type of component (class constructor name)
  pos: number[]; // (x, y) coords on canvas

  conns: IConnectionData[]; // All connections
  data?: IAdditionalComponentData; // Other component data
}

export interface IAdditionalComponentData {
  [prop: string]: number;
}

// Mainly used for saving, but also used in Wire constructor
export interface IConnectionData {
  index?: number; // Index of target component in Control.components
  path: number[][]; // Extra path nodes of component. If empty, connection is straight

  hasRes?: boolean; // Is resistance enabled for the wire?
  material?: number; // Index of material of wire in Wire.MATERIAL_KEYS
  r?: number; // Radius (thickness) of wire
}

export default ISaveData;