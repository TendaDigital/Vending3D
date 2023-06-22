import sleep from "../../sleep.js";
import MarlinServer from "../MarlinServer.js";
import PrinterPrusa from "./PrinterPrusa.js";

export default class PrinterVPlotter extends PrinterPrusa {
  static match({ serialport }) {
    const vendorId = serialport.vendorId || "";
    return vendorId == "27b1";
  }

  constructor(options) {
    super(options);

    this.channel = new MarlinServer(options, {
      START_COMMAND: true,
      START_TOKEN: "start",
      baudRate: 250000,
    });

    this.channel.on("state:switch", ({ place, triggered }) => {
      // console.log('switch updated: ', {place, triggered})
      this.updateSwitchState(place, triggered);
      // Update button switch to detect keypresses
      if (place == "x_max") this.updateSwitchState("button", triggered);
    });
  }

  async waitForButtonPress() {
    await sleep(1000);
  }
}
