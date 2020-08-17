import { IAdditionalComponentData } from "models/saveData";
import { Direction } from "models/enum";

export interface IDiodeData extends IAdditionalComponentData {
  dir: Direction;
}

export default IDiodeData;