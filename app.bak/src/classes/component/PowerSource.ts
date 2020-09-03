import Component from "./Component";
import type Circuit from "classes/circuit";

/**
 * This is simply so I know that control._head MUST be a power source
 * This adds nada
 */
export class PowerSource extends Component {
  public constructor(parentCircuit: Circuit) {
    super(parentCircuit);
    this._resistance = 0;
  }

  public onMouseDown(event: MouseEvent): void {
    this.flip(true);
  }
}

export default PowerSource;