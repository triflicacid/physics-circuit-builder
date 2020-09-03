import { IMaterialDef } from "models/material";
import { IComponentInfoCollection } from "models/ComponentInfo";

export class Vars {
  public static materials: IMaterialDef[] = []; // Store info for each material
  public static componentInfo: IComponentInfoCollection = {}; // Store info for each component

  // Default voltage options for bulb, cell etc...
  public static readonly defaultVoltageOptions: { text: string; value: number; }[] = [
    { text: '1.5V', value: 1.5 },
    { text: '3V', value: 3 },
    { text: '5V', value: 5 },
    { text: '6V', value: 6 },
    { text: '9V', value: 9 },
  ];

  // GCSE mode?
  public static gcseMode: boolean = true;
}

export default Vars;