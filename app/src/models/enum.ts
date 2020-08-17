// DIrection of stuff
export enum Direction {
  Left,
  Right
}

// Represent numeric boolean values
export enum NBoolean {
  False,
  True
}

// Flags used by components
export enum ComponentFlag {
  ON = 0b1,
  BLOWN = 0b10,
  LUMINOUS = 0b100,
}

// State of switch
export enum State {
  Closed,
  Open
}

export enum MouseButton {
  Left,
  Middle,
  Right
}

// Connector and TwoWaySwitch: which circuit are we executing?
export enum CircuitExec {
  All,
  One,
  Two
}

// Capacitor states
export enum CapacitorState {
  Null,
  Full,
  Charging,
  Discharging,
}