import { IAdditionalComponentData } from "models/saveData";
import { AmmeterUnitsIndex } from "./index";

export interface IAmmeterData extends IAdditionalComponentData {
  units: AmmeterUnitsIndex
}

export default IAmmeterData;