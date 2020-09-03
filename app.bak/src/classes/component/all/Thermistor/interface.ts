import IResistorData from "../Resistor/interface";
import { ThermistorMode } from "./index";

export interface IThermistorData extends IResistorData {
  mode: ThermistorMode;
}

export default IThermistorData;