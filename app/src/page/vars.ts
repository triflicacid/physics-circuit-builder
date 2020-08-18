import { IMaterialDef } from "models/material";
import { IComponentInfoCollection } from "models/ComponentInfo";

export class Vars {
  public static readonly materials: IMaterialDef[] = []; // Store info for each material
  public static readonly componentInfo: IComponentInfoCollection = {}; // Store info for each component
}

export default Vars;