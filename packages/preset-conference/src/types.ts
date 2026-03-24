// Conference scheduling preset types

export interface ConferenceBlockMeta {
  sessionTitle?: string
  speaker?: string
  speakerBio?: string
  track?: string
  roomCapacity?: number
  format?: 'talk' | 'workshop' | 'panel' | 'keynote' | 'break' | 'networking'
  tags?: string[]
  abstract?: string
}

export interface ConferenceRoomMeta {
  capacity?: number
  equipment?: string[]
  floor?: number
  accessibilityFeatures?: string[]
}
