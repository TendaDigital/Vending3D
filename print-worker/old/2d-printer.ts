// import mdns from "mdns";

// const browser = mdns.createBrowser(mdns.tcp("ipp"));

// mdns.Browser.defaultResolverSequence[1] =
//   "DNSServiceGetAddrInfo" in mdns.dns_sd
//     ? mdns.rst.DNSServiceGetAddrInfo()
//     : mdns.rst.getaddrinfo({ families: [4] });

// browser.on("serviceUp", function (rec) {
//   // console.log(rec);
//   console.log(
//     rec.name,
//     "http://" + rec.host + ":" + rec.port + "/" + rec.txtRecord.rp
//   );
// });
// browser.start();
// // setTimeout(() => browser.stop(), 6000);

import ipp from "ipp";
import Printer from "ipp/lib/printer";

const printer = ipp.Printer(
  "http://localhost:631/printers/Canon_MB5100_series"
) as Printer;

// Promisify the execute function
printer["execute"] = function (operation, msg) {
  return new Promise((resolve, reject) => {
    this.execute(operation, msg, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
};

// printer.execute("Get-Jobs", null, function (err, res) {
//   console.log(err, res);
// });
console.log(await printer.execute("Get-Printer-Attributes", null));
