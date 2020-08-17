export interface IMaterial {
  name: string; // Material name
  resistance: number; // Resistance in ohm-metres
  colour: [number, number, number] | null; // RGB colour
}

export interface IMaterialDef {
  name: string; // Material name
  resistance: number; // Resistance in ohm-metres
  colour: [number, number, number] | null; // RGB colour
  wire: boolean; // Are we a material that a wire can be made of?
}

export default IMaterial;