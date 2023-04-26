import mdns from "mdns";

const browser = mdns.createBrowser(mdns.tcp("ipp"));

mdns.Browser.defaultResolverSequence[1] =
  "DNSServiceGetAddrInfo" in mdns.dns_sd
    ? mdns.rst.DNSServiceGetAddrInfo()
    : mdns.rst.getaddrinfo({ families: [4] });

browser.on("serviceUp", function (rec) {
  // console.log(rec);
  console.log(
    rec.name,
    "http://" + rec.host + ":" + rec.port + "/" + rec.txtRecord.rp
  );
});
browser.start();
// setTimeout(() => browser.stop(), 6000);

import ipp from "ipp";

const printer = ipp.Printer("ipp://192.168.1.124/ipp/print", {
  version: "1.0",
});
// printer.execute("Get-Jobs", null, function (err, res) {
//   console.log(err, res);
// });
printer.execute("Get-Printer-Attributes", null, function (err, res) {
  console.log(err, res);
});
