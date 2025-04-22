import { SerialPort } from 'serialport'
import { JobRequest } from '../../JobRequest'
import { JobStatusMessage, Printer, PrinterStatusMessage } from '../../Types'
import { PrinterConfig } from '../../Types'
import { getDeviceList, findByIds, WebUSB } from 'usb'
import util from 'util'
import Sleep from '../../Util/Sleep'

const TAG = '[OpticomDriver]'
export namespace OpticomDriver {
  class OpticomPrinter implements Printer {
    config: PrinterConfig
    device: USBDevice
    constructor(config: PrinterConfig) {
      this.config = config
    }

    debug(...args: any[]) {
      this.config.debug && console.log(TAG, ...args)
    }

    async connect(): Promise<void> {
      this.debug('connect')
      console.log(await SerialPort.list())
      // console.log(await SerialPort.list())
      // const devices = findByIds(1626, 9)
      // console.log(devices)
      const webusb = new WebUSB({
        // Bypass cheking for authorised devices
        allowAllDevices: true,
      })

      const allDevices = await webusb.getDevices()
      const devices = allDevices.filter((device) => device.manufacturerName?.toLowerCase().includes('optoelectronics'))

      if (devices.length === 0) {
        throw new Error('No printer found')
      } else if (devices.length > 1) {
        console.log(devices)
        throw new Error('Multiple printers found')
      }

      this.device = devices[0]
      // console.log(device)
      // Print using inspect with colors
      console.log(util.inspect(this.device, { colors: true, depth: 10 }))
      await this.device.open()
      await this.device.reset()
      if (this.device.configuration === null) await this.device.selectConfiguration(1)
      await this.device.claimInterface(0)
      await this.device.controlTransferOut({
        requestType: 'standard',
        recipient: 'interface',
        request: 0x22,
        value: 0x01,
        index: 0x00,
      })
      // const res = await device.transferOut(1, Buffer.from([0x01, 0x02, 0x00, 0x9f, 0xde]))
      // const res = await device.controlTransferOut(
      //   {
      //     index: 0,
      //     requestType: 'standard',
      //     recipient: 'device',
      //     request: 0x01,
      //     value: 0x02,
      //   },
      //   Buffer.from([0x01, 0x02, 0x00, 0x9f, 0xde])
      // )
      // console.log(res)
      // device.transferIn()
      // device.transferOut(1, Buffer.from([0x1b, 0x40]))
      // console.log(device.configurations.map((e) => e.interfaces[0].alternate.endpoints))
      // device.isochronousTransferIn()
      // throw new Error('Could not connect to printer')
    }
    async *waitToBeReady(): AsyncGenerator<PrinterStatusMessage> {
      while (1) {
        yield {
          type: 'printer',
          status: 'waiting',
          message: 'Waiting to connect...',
        }

        const ss = await this.device.transferOut(1, Buffer.from([0x1b, 0x40]))
        const res = await this.device.transferIn(1, 64)
        // console.log({ res })

        await Sleep(500)
      }
    }
    async *printJob(job: JobRequest): AsyncGenerator<JobStatusMessage> {
      yield {
        type: 'job',
        status: 'running',
        message: 'Printing...',
      }
    }
  }

  export function build(printerConfig: PrinterConfig): Printer {
    return new OpticomPrinter(printerConfig)
  }
}
