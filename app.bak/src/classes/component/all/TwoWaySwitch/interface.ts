import { IAdditionalComponentData } from "models/saveData";
import { CircuitExec } from "models/enum";

export interface ITwoWaySwitchData extends IAdditionalComponentData {
  exec: CircuitExec;
  origExec: CircuitExec;
}

export default ITwoWaySwitchData;