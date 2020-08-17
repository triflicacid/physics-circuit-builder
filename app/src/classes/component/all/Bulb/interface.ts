import { IAdditionalComponentData } from "models/saveData";
import { NBoolean } from "models/enum";

export interface IBulbData extends IAdditionalComponentData {
  voltage: number;
  oldSymbol: NBoolean;
}

export default IBulbData;