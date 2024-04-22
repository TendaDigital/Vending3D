export interface IntegrationJobsResult {
  cursor: object
  tasks: { id: string; file: string }[]
}
export interface IntegrationProdider {
  fetchJobs(options: object, cursor: object): Promise<IntegrationJobsResult>
  // markCompleted?(ids: string[]): Promise<void>
}
