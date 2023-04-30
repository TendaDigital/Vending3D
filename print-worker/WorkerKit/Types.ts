import { JobRequest } from './JobRequest'

export interface Job {
  _id: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'canceled'
  message?: string
  progress?: number
}

export interface Printer {
  config: PrinterConfig
  connect(): Promise<void>
  waitToBeReady(): Promise<void>
  printJob(job: JobRequest): Promise<void>
  cancelJob(): Promise<void>
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
  }
  cups?: {
    url: string
  }
}
