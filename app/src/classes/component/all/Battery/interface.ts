import { IAdditionalComponentData } from "models/saveData";

export interface IBatteryData extends IAdditionalComponentData {
  cells: number;
  voltage: number; // Voltage of whole thing
}

export default IBatteryData;