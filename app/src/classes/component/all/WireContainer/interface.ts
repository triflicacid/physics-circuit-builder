import { IAdditionalComponentData } from "models/saveData";

export interface IWireContainerData extends IAdditionalComponentData {
  material: number; // Index
  length: number; // Length of wire
  r: number; // Radius of wire
}

export default IWireContainerData;