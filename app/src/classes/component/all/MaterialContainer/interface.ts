import { IAdditionalComponentData } from "models/saveData";

export interface IMaterialContainerData extends IAdditionalComponentData {
  material: number; // Index of material
  length: number; // Length of container
}
export default IMaterialContainerData;