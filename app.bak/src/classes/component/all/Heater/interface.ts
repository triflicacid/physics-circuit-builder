import { IAdditionalComponentData } from "models/saveData";

export interface IHeaterData extends IAdditionalComponentData {
  eff: number; // _efficiency
  maxT: number; // _maxTemp
}
export default IHeaterData;