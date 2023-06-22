import ipp, {
  CancelReleaseJobRequest,
  GetJobAttributesRequest,
  JobState,
  JobStatusAttributes,
  PrintJobRequest,
  PrintJobResponse,
  PrinterStateReasons,
} from 'ipp'
import { JobStatusMessage, Printer, PrinterConfig, PrinterStatusMessage } from '../../Types'
import Sleep from '../../Util/Sleep'
import CupsParser from 'ipp/lib/parser'
import { JobRequest } from '../../JobRequest'
import { PrinterOpertaion } from 'ipp'
import { FullResponse } from 'ipp'
import { FullRequest } from 'ipp'
import { GetPrinterAttributesResponse } from 'ipp'
import { GetJobsResponse } from 'ipp'
import { GetJobsRequest } from 'ipp'
import { readFileSync } from 'fs'

/**
 * Disable ipp parser to avoid errors when receiving unknown tags
 */
CupsParser.handleUnknownTag = () => {
  /** do nothing */
}

const TAG = '[CupsDriver]'
export namespace CupsDriver {
  class CupsPrinter implements Printer {
    config: PrinterConfig
    printer: ipp.Printer
    constructor(config: PrinterConfig) {
      this.config = config

      if (!config.cups) throw new Error('Cups config is missing')
      if (!config.cups.url) throw new Error('Cups url is missing')

      this.printer = new ipp.Printer(config.cups.url)
      // printer.execute = promisify(printer.execute.bind(printer))
    }

    debug(...args: any[]) {
      this.config.debug && console.log(TAG, ...args)
    }

    async connect() {
      // const jobs = await this.executeIppCall<GetJobsResponse, GetJobsRequest>('Get-Jobs', null)
      try {
        await this.#ippStatus()
      } catch (e) {
        if (e.message.includes('client-error-not-found')) {
          throw new Error('Printer is not available: ' + this.config.cups?.url)
        }
      }
    }

    async #getCurrentMessage({ ignoreReasons }: { ignoreReasons?: string[] } = {}): Promise<
      PrinterStatusMessage & { reasons: string[] }
    > {
      const status = await this.#ippStatus()
      // console.log(status)
      // this.debug({ status })
      const excludedReasons = ['none', 'wifi-not-configured-report', ...(ignoreReasons ?? [])]
      const isReady = status.reasons.every((reason) => excludedReasons.includes(reason))
      // console.log({ isReady, reasons: status.reasons.join(',') })
      if (!isReady) {
        const humanReadableReason = this.#getHumanReadablePrinterReason(status.reasons)
        return {
          type: 'printer',
          status: 'waiting',
          message: humanReadableReason,
          reasons: status.reasons.filter((reason) => !excludedReasons.includes(reason)),
        }
      }
    }

    async *waitToBeReady(): AsyncGenerator<PrinterStatusMessage> {
      // Wait printer status to be ready
      let hadException = false
      let reasons = null
      let pending = 0
      let didSentEmptyPrintToCheckOutOFPaper = false
      do {
        const printerMessage = await this.#getCurrentMessage({
          ignoreReasons: [
            // 'media-empty-error',
            // 'media-needed-error',
          ],
        })
        if (printerMessage) {
          hadException = true
          if (printerMessage.message != reasons) {
            reasons = printerMessage.message
            this.debug(`Printer is not ready: ${reasons} (${printerMessage.reasons.join(',')})`)
          }
          // Specif edge case for out of paper
          if (printerMessage.reasons.some((s) => s.includes('media-empty-'))) {
            const jobs = await this.#ippGetJobs()
            if (jobs.length == 0) {
              await this.#printDummyJob()
              yield {
                type: 'printer',
                status: 'waiting',
                message: `Printing dummy job to clear out of paper error`,
              }
            } else {
              yield {
                type: 'printer',
                status: 'waiting',
                message: `Waiting ${jobs.length} pending jobs to be printed`,
              }
            }
          } else {
            yield printerMessage
          }
          await Sleep(500)
          continue
        }

        // Wait printer jobs to be empty
        const jobs = await this.#ippGetJobs()
        if (jobs.length !== 0) {
          hadException = true
          if (pending != jobs.length) {
            pending = jobs.length
            this.debug(`Waiting for ${jobs.length} pending jobs to be printed`)
          }
          yield {
            type: 'printer',
            status: 'waiting',
            message: `Waiting ${jobs.length} pending jobs to be printed`,
          }
          await Sleep(500)
          continue
        }

        if (hadException) this.debug('Printer is ready')
        break
        // eslint-disable-next-line no-constant-condition
      } while (true)
    }

    async *printJob(job: JobRequest): AsyncGenerator<JobStatusMessage> {
      // Check if job is already printed
      const documentRef = `PrintWorker:${job.id}`
      const documentName = `${documentRef} - ${job.name}`

      const previousJobs = await this.#ippGetJobs()
      const previousJob = previousJobs.find((job) => job['document-name-supplied']?.startsWith(documentRef))

      let jobId = previousJob?.['job-id']
      if (previousJob) {
        this.debug(`Job ${job.id} is already in queue. Continuing tracking...`)
      } else {
        const file = await job.loadFile()
        const result = await this.#executeIppCall<PrintJobResponse, PrintJobRequest>('Print-Job', {
          'operation-attributes-tag': {
            'requesting-user-name': 'felipetiozo',
            'document-name': documentName,
          },
          'job-attributes-tag': {
            'media-col': {
              'media-size': {
                'x-dimension': 29700,
                'y-dimension': 42000,
              },
              'media-top-margin': 0,
              'media-left-margin': 0,
              'media-right-margin': 0,
              'media-bottom-margin': 0,
            },
            'print-color-mode': 'color',
            'print-quality': 'draft',
            'multiple-document-handling': 'separate-documents-collated-copies',
            sides: 'two-sided-long-edge',
            'orientation-requested': 'landscape',
          },

          // Convert ArrayBuffer to binary Buffer
          data: Buffer.from(file),
        })

        jobId = result['job-attributes-tag']['job-id']

        this.debug(`Job ${job.id} sent to printer. Tracking...`)
      }

      yield {
        type: 'job',
        status: 'running',
        message: 'Sent job to printer',
        progress: 25,
      }

      let didCancel = false
      do {
        if (job.stopped && !didCancel) {
          didCancel = true
          await this.#ippCancelJob(jobId)
          this.debug(`Job ${job.id} was canceled`)
          yield {
            type: 'job',
            message: 'Cancelling job...',
          }
        }

        const printerMessage = await this.#getCurrentMessage({
          ignoreReasons: ['cups-waiting-for-job-completed', 'other-report'],
        })
        if (printerMessage) {
          // throw new Error('Printer is not ready: ' + printerMessage.message)
          // yield {
          //   type: 'job',
          //   message: printerMessage.message,
          // }
          // Cancel job
          await this.#ippCancelJob(jobId)
          throw new Error('Printer got into unknown state: ' + printerMessage.message)
          // await Sleep(500)
          // continue
        }

        const result = await this.#ippGetJob(jobId)
        const state = result['job-state'] as JobState
        // const printerMessage = result['job-printer-state-message']
        // const reasons = [].concat(result['job-state-reasons'] ?? [])
        // this.debug(state, printerMessage, reasons)

        if (state == 'completed') {
          return yield {
            type: 'job',
            message: 'Completed.',
            status: 'success',
            progress: 100,
          }
        } else if (state == 'canceled') {
          // throw new Error('Print job was canceled')
          return yield {
            type: 'job',
            message: 'Print job was canceled',
            status: 'failed',
          }
        } else if (state == 'aborted') {
          // throw new Error('')
          return yield {
            type: 'job',
            message: 'Print job was aborted',
            status: 'failed',
          }
        } else if (!didCancel) {
          const impressions = result['job-impressions-completed'] ?? 1
          yield {
            type: 'job',
            message: `Printing page #${impressions}`,
            progress: 50 + impressions * 1,
          }
        }
        await Sleep(1000)
        // eslint-disable-next-line no-constant-condition
      } while (true)
      // this.debug('loaded file', file)
    }

    async #printDummyJob() {
      this.debug('Printing dummy job')
      const result = await this.#executeIppCall<PrintJobResponse, PrintJobRequest>('Print-Job', {
        'operation-attributes-tag': {
          'requesting-user-name': 'felipetiozo',
          'document-name': 'PrintWorker:dummy',
        },
        'job-attributes-tag': {
          'media-col': {
            'media-size': {
              'x-dimension': 29700,
              'y-dimension': 42000,
            },
            'media-top-margin': 0,
            'media-left-margin': 0,
            'media-right-margin': 0,
            'media-bottom-margin': 0,
          },
          'print-color-mode': 'color',
          'print-quality': 'draft',
          'multiple-document-handling': 'separate-documents-collated-copies',
          sides: 'two-sided-long-edge',
          'orientation-requested': 'landscape',
        },

        // Convert ArrayBuffer to binary Buffer
        data: Buffer.from(readFileSync('./WorkerKit/Drivers/Cups/blank.pdf')),
      })
    }

    #getHumanReadablePrinterReason(reasons: PrinterStateReasons[]): string {
      const str = reasons.join(',')
      if (str.includes('media-empty-report')) {
        return 'Out of paper (coloque papel e imprima a página teste)'
      } else if (str.includes('media-empty-error')) {
        return 'Out of paper (durante a impressão)'
      } else if (str.includes('jam')) {
        return 'Paper jam'
      } else if (str.includes('open')) {
        return 'Printer door is open'
      } else if (str.includes('cups-waiting-for-job-completed')) {
        return 'Printer is waiting for previous job to be completed'
      } else if (str.includes('offline-report')) {
        return 'Printer is offline'
      } else if (str.includes('paused')) {
        return 'Printer is paused'
      }

      return `Printer is not ready yet: ${reasons.join(',')}`
    }
    async #ippStatus(): Promise<{ message: string; reasons: PrinterStateReasons[] }> {
      const result = await this.#executeIppCall<GetPrinterAttributesResponse>('Get-Printer-Attributes', null)
      const tags = result['printer-attributes-tag']
      // delete result['printer-attributes-tag']['operations-supported']
      // delete result['printer-attributes-tag']['media-supported']
      // delete result['printer-attributes-tag']['media-source-supported']
      // delete result['printer-attributes-tag']['media-size-supported']
      // delete result['printer-attributes-tag']['which-jobs-supported']
      // delete result['printer-attributes-tag']['notify-events-supported']
      // delete result['printer-attributes-tag']['printer-settable-attributes-supported']
      // delete result['printer-attributes-tag']['document-format-supported']
      // delete result['printer-attributes-tag']['job-hold-until-supported']
      // delete result['printer-attributes-tag']['job-creation-attributes-supported']
      // delete result['printer-attributes-tag']['multiple-document-handling-supported']
      // delete result['printer-attributes-tag']['pdf-versions-supported']
      // delete result['printer-attributes-tag']['job-settable-attributes-supported']
      // delete result['printer-attributes-tag']['media-col-supported']
      // delete result['printer-attributes-tag']['job-sheets-supported']
      // delete result['printer-attributes-tag']['number-up-layout-supported']
      // delete result['printer-attributes-tag']['marker-types']
      // delete result['printer-attributes-tag']['media-type-supported']

      // console.log(result)
      const status = {
        message: tags?.['printer-state-message'],
        // Make sure it is an array
        reasons: [].concat(tags?.['printer-state-reasons']),
      }
      return status
    }

    async #ippGetJobs(): Promise<JobStatusAttributes[]> {
      const result = await this.#executeIppCall<GetJobsResponse, GetJobsRequest>('Get-Jobs', {
        'operation-attributes-tag': {
          'requesting-user-name': 'felipetiozo',
          'requested-attributes': ['all'],
        },
      })
      const jobs = [].concat(result['job-attributes-tag'] ?? []) as JobStatusAttributes[]
      return jobs
    }

    async #ippCancelJob(jobId: number) {
      await this.#executeIppCall<unknown, CancelReleaseJobRequest>('Cancel-Job', {
        'operation-attributes-tag': {
          'requesting-user-name': 'felipetiozo',
          'job-id': jobId,
        },
      })
    }

    async #ippGetJob(jobId: number): Promise<JobStatusAttributes> {
      const result = await this.#executeIppCall<FullResponse, GetJobAttributesRequest>('Get-Job-Attributes', {
        'operation-attributes-tag': {
          'job-id': jobId,
          'requested-attributes': ['all'],
        },
      })
      return result['job-attributes-tag'] as JobStatusAttributes
    }

    // async #ippGetDocument(jobId: number) {
    //   const result = await this.#executeIppCall<FullResponse, GetJobAttributesRequest>('Get-Document-Attributes', {
    //     'operation-attributes-tag': {
    //       'job-id': jobId,
    //       'requested-attributes': ['all'],
    //     },
    //   })
    // }

    async #executeIppCall<Response = FullResponse, Request = FullRequest>(
      command: PrinterOpertaion,
      message?: Request
    ): Promise<Response> {
      return await new Promise((resolve, reject) => {
        this.printer.execute(command, message, (err, res) => {
          if (err) return reject(err)

          if (res.statusCode.startsWith('successful-ok')) resolve(res as Response)

          const error = new CupsError(res)
          return reject(error)
        })
      })
    }
  }

  export function build(printerConfig: PrinterConfig): Printer {
    return new CupsPrinter(printerConfig)
  }

  export class CupsError extends Error {
    response: FullResponse
    constructor(response: FullResponse) {
      if (response.statusCode.startsWith('client-error')) super(`Client: ${response.statusCode}`)
      else if (response.statusCode.startsWith('server-error')) super(`Server: ${response.statusCode}`)
      else super(response.statusCode)
      this.name = this.constructor.name
      Error.captureStackTrace(this, this.constructor)
    }
  }
}
