import { IAdditionalComponentData } from "models/saveData";

export interface ICapacitorData extends IAdditionalComponentData {
  capacitance: number; // micro-farads
  target: number; // Target voltage
  // Voltage is sorted out isPowerSource()
}

export default ICapacitorData;