import React from 'react'

interface ICalendarProps {
  size?: number
  color?: string
}

export const ICalendar: React.FC<ICalendarProps> = ({ size = 13, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5">
    <rect x="1" y="3" width="14" height="12" rx="2" />
    <path d="M1 7h14M5 1v4M11 1v4" />
  </svg>
)

interface IChevLProps {
  size?: number
}

export const IChevL: React.FC<IChevLProps> = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 3L5 8l5 5" />
  </svg>
)

interface IChevRProps {
  size?: number
}

export const IChevR: React.FC<IChevRProps> = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 3l5 5-5 5" />
  </svg>
)

interface IChevDProps {
  size?: number
}

export const IChevD: React.FC<IChevDProps> = ({ size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6l5 5 5-5" />
  </svg>
)

interface IPlusProps {
  size?: number
  color?: string
}

export const IPlus: React.FC<IPlusProps> = ({ size = 12, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="2">
    <path d="M8 3v10M3 8h10" />
  </svg>
)

interface IUsersProps {
  size?: number
}

export const IUsers: React.FC<IUsersProps> = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="6" cy="5" r="3" />
    <path d="M1 14c0-3 2.2-5 5-5s5 2 5 5" />
    <circle cx="12" cy="5" r="2" />
    <path d="M15 13c0-2-1.3-3.5-3-3.5" />
  </svg>
)

interface ICopyProps {
  size?: number
}

export const ICopy: React.FC<ICopyProps> = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="5" y="5" width="9" height="9" rx="1.5" />
    <path d="M11 5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v7a1 1 0 001 1h2" />
  </svg>
)

interface IGridProps {
  size?: number
}

export const IGrid: React.FC<IGridProps> = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="1" y="1" width="6" height="6" rx="1" />
    <rect x="9" y="1" width="6" height="6" rx="1" />
    <rect x="1" y="9" width="6" height="6" rx="1" />
    <rect x="9" y="9" width="6" height="6" rx="1" />
  </svg>
)

interface IListProps {
  size?: number
}

export const IList: React.FC<IListProps> = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 4h10M3 8h10M3 12h10" />
  </svg>
)

interface IMagicProps {
  size?: number
}

export const IMagic: React.FC<IMagicProps> = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 14L9 7M7 2l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2zM12 8l.5 1 1 .5-1 .5-.5 1-.5-1-1-.5 1-.5.5-1z" />
  </svg>
)

interface ICheckProps {
  size?: number
}

export const ICheck: React.FC<ICheckProps> = ({ size = 9 }) => (
  <svg width={size} height={size} viewBox="0 0 9 9">
    <path d="M1 4.5l2.5 2.5L8 1" stroke="#fff" strokeWidth="1.5" fill="none" />
  </svg>
)

interface IWarnProps {
  size?: number
}

export const IWarn: React.FC<IWarnProps> = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M8 2L1 14h14L8 2z" />
    <path d="M8 7v3M8 12v.5" />
  </svg>
)