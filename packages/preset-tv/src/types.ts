// TV scheduling preset types

/** Domain-specific metadata for TV programme blocks */
export interface TvBlockMeta {
  programmeTitle?: string
  episodeNumber?: string
  seriesNumber?: string
  duration?: number
  genre?: string
  rating?: string
  isLive?: boolean
  isRepeat?: boolean
}

/** TV channel resource metadata */
export interface TvChannelMeta {
  channelNumber?: number
  logoUrl?: string
  region?: string
}
