import { IAdditionalComponentData } from "models/saveData";
import { LightmeterUnitsIndex } from "./index";

export interface ILightmeterData extends IAdditionalComponentData {
  units: LightmeterUnitsIndex
}

export default ILightmeterData;