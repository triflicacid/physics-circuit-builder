import { IAdditionalComponentData } from "models/saveData";
import { NBoolean } from "models/enum";

export interface IResistorData extends IAdditionalComponentData {
  resistance: number;
  us: NBoolean; // _american
}

export default IResistorData;