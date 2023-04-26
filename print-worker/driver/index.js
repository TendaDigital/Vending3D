import PrinterEnder from "./printers/PrinterEnder.js";
import PrinterMock from "./printers/PrinterMock.js";
import PrinterPrusa from "./printers/PrinterPrusa.js";

/**
 * Call this method with a SerialPort device spec to
 * find the appropiate Printer device instance and use it
 */
export function detectBestDeviceDriver(hints) {
  const Drivers = [PrinterMock, PrinterPrusa, PrinterEnder];
  const Driver = Drivers.find((Driver) => Driver.match(hints));

  if (!Driver) {
    console.error("No Driver detected with hints:", JSON.stringify(hints));
    throw new Error(
      `Could not detect available Driver for printer with available hints`
    );
  }

  return Driver;
}
