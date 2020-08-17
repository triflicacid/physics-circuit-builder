import ICellData from "../Cell/interface";

export interface IDCPowerSupplyData extends ICellData {
  delta: number; // _delta / sensitivity()
  maxVoltage: number
}

export default IDCPowerSupplyData;