const WA_NUMBER = '918885166007'

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`
}

export function batchBookingMessage(params: {
  courseName: string
  mode: string
  startDate: string
  centre?: string | null
  schedule: string
}): string {
  if (params.mode === 'Online') {
    return `Hi Coss Cloud Solutions Team,\n\nI want to enroll in the online ${params.courseName} batch.\n\nBatch details:\n- Start date: ${params.startDate}\n- Schedule: ${params.schedule}\n- Mode: Online\n\nPlease share enrollment details. Thank you!`
  }
  return `Hi Coss Cloud Solutions Team,\n\nI want to book a seat for the ${params.courseName} batch.\n\nBatch details:\n- Start date: ${params.startDate}\n- Centre: ${params.centre || 'Coss Cloud Solutions'}\n- Schedule: ${params.schedule}\n- Mode: ${params.mode}\n\nPlease confirm my seat. Thank you!`
}

export function jobApplyMessage(params: {
  jobTitle: string
  company: string
}): string {
  return `Hi Coss Cloud Solutions Team,\n\nI'm interested in the ${params.jobTitle} position at ${params.company}.\n\nI found this job on your website and would like to know more about applying through Coss Cloud Solutions placement assistance.\n\nPlease guide me on next steps. Thank you!`
}
