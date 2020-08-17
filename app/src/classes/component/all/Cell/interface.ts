import { IAdditionalComponentData } from "models/saveData";

export interface ICellData extends IAdditionalComponentData {
  voltage: number;
}

export default ICellData;