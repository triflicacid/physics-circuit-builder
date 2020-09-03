import IDCPowerSupplyData from "../DCPowerSupply/interface";

export interface IACPowerSupplyData extends IDCPowerSupplyData {
  frame: number;
}

export default IACPowerSupplyData;