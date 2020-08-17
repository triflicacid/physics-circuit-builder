import { IAdditionalComponentData } from "models/saveData";
import { NBoolean } from "models/enum";

export interface IBulbData extends IAdditionalComponentData {
  wattage: number;
  oldSymbol: NBoolean;
}

export default IBulbData;