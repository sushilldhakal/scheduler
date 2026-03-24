// Healthcare preset types

export interface HealthcareBlockMeta {
  ward?: string
  patientId?: string
  procedureCode?: string
  qualification?: string
  urgency?: 'routine' | 'urgent' | 'emergency'
  notes?: string
}

export interface HealthcareStaffMeta {
  qualification?: string
  licenceNumber?: string
  department?: string
  contractType?: 'full-time' | 'part-time' | 'bank' | 'agency'
  maxHoursPerWeek?: number
}
