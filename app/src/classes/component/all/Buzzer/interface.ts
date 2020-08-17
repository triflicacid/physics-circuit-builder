import { IAdditionalComponentData } from "models/saveData";
import { NBoolean } from "models/enum";

export interface IBuzzerData extends IAdditionalComponentData {
  freq: number;
  mute: NBoolean;
}

export default IBuzzerData;