// For errors based on connection
export class ConnectionError extends Error {
  public name: string = "ConnectionError";

  constructor(message: string) {
    super(message);
  }
}

// For component-based errors
export class ComponentError extends Error {
  public name: string = "ComponentError";

  constructor(message: string) {
    super(message);
  }
}

// When something is null unexpectadley
export class NullError extends Error {
  public name: string = "NullError";

  constructor(name: string, other?: string) {
    super(`Expected '${name}', but got null` + (other !== undefined ? "\n" + other : ""));
  }
}

// For corrupt/malformed save files 
export class SaveError extends Error {
  public name: string = "SaveError";

  constructor(message: string, missingProperty?: string) {
    super(missingProperty != undefined ?
      `Expected save file to have property '${missingProperty}', but got 'undefined' or incorrect data type\n${message}` :
      message);
  }
}