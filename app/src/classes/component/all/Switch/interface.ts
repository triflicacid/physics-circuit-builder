import { IAdditionalComponentData } from "models/saveData";
import { State } from "models/enum";

export interface ISwitchData extends IAdditionalComponentData {
  state: State;
}

export default ISwitchData;