import { JobRequest } from './JobRequest'

export type JobStatus = 'queued' | 'running' | 'success' | 'failed' | 'canceled'
export type PrinterStatus = 'waiting' | 'printing' | 'idle'

export interface Job {
  id: string
  name: string
  status: JobStatus
  message?: string
  progress?: number
}

export interface Printer {
  config: PrinterConfig
  connect(): Promise<void>
  waitToBeReady(): AsyncGenerator<PrinterStatusMessage>
  printJob(job: JobRequest): AsyncGenerator<JobStatusMessage>
}

export type JobStatusMessage = {
  type: 'job'
  status?: JobStatus
  message?: string
  progress?: number
}

export type PrinterStatusMessage = {
  type: 'printer'
  status: PrinterStatus
  message?: string
}

export interface GlobalConfig {
  server: ServerConfig
  printers: PrinterConfig[]
}

export interface ServerConfig {
  url: string
}

export interface PrinterConfig {
  name: string
  queue: string
  debug?: boolean
  driver: 'cups' | 'marlin'
  mocked?: boolean
  marlin?: {
    port: string
    model: 'vplotter' | 'mocked' | 'ender'
    config?: {
      temperatureExtruder?: number
      temperatureBed?: number
      babyHeight?: string
      printOffset?: number
    }
  }
  cups?: {
    url: string
  }
}
