import Axios from 'axios'
import { IntegrationJobsResult, IntegrationProdider } from '../IntegrationProvider'

export default class EstandeDigital_Leads implements IntegrationProdider {
  async fetchJobs(options: any, cursor: any): Promise<IntegrationJobsResult> {
    if (cursor?.key !== options.participationId) {
      cursor = undefined
    }
    let after = cursor?.after ?? options.after ?? undefined
    const result = await Axios.request({
      url: options.url,
      method: 'GET',
      params: {
        timeout: 10000,
        limit: 1000,
        after,
        participationId: options.participationId,
      },
      headers: {
        'x-secret': options.secret,
      },
    })

    const leads = result.data.leads as {
      eventRef: string
      updatedAt: string
    }[]

    if (leads.length === 0) {
      return {
        cursor,
        tasks: [],
      }
    }

    after = leads[leads.length - 1].updatedAt
    return {
      cursor: {
        after,
        key: options.participationId,
      },
      tasks: leads
        // Filter only numeric eventRefs
        .filter((lead) => /^\d+$/.test(lead.eventRef))
        // Map to Task
        .map((lead) => ({
          id: lead.eventRef,
          file: `data:JB\nJO\nJ${lead.eventRef}\nJS150\nJS110\nJD`,
        })),
    }
  }
  // async markCompleted(ids) {
  //   // Void
  // }
}
