import type { Block } from "../types"

/**
 * Export the given container element to a PNG image. Requires optional peer dependency "html2canvas".
 * If html2canvas is not installed, throws with a message to add it.
 */
export async function exportToImage(
  container: HTMLElement,
  filename = "scheduler.png"
): Promise<void> {
  try {
    const html2canvas = (await import("html2canvas")).default
    const canvas = await html2canvas(container, { useCORS: true, scale: 2, logging: false })
    const url = canvas.toDataURL("image/png")
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
  } catch (e) {
    if (e && typeof (e as { code?: string }).code === "string" && (e as { code: string }).code === "MODULE_NOT_FOUND") {
      throw new Error("exportToImage requires optional dependency html2canvas. Install it: npm install html2canvas")
    }
    throw e
  }
}

/**
 * Export the given container element to PDF. Requires optional peer dependencies "jspdf" and "html2canvas".
 * If not installed, throws with a message to add them.
 */
export async function exportToPDF(
  container: HTMLElement,
  filename = "scheduler.pdf"
): Promise<void> {
  try {
    const [html2canvas, { jsPDF }] = await Promise.all([
      import("html2canvas").then((m) => m.default),
      import("jspdf"),
    ])
    const canvas = await html2canvas(container, { useCORS: true, scale: 2, logging: false })
    const imgData = canvas.toDataURL("image/png")
    const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] })
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height)
    pdf.save(filename)
  } catch (e) {
    if (e && typeof (e as { code?: string }).code === "string" && (e as { code: string }).code === "MODULE_NOT_FOUND") {
      throw new Error("exportToPDF requires optional dependencies jspdf and html2canvas. Install them: npm install jspdf html2canvas")
    }
    throw e
  }
}

/**
 * Export blocks to CSV. Flattens meta fields as additional columns (meta_key format).
 * No external dependency; triggers browser download of filename.
 */
export function exportToCSV(blocks: Block[], filename = "scheduler-export.csv"): void {
  if (blocks.length === 0) {
    const header = "id,categoryId,employeeId,date,startH,endH,employee,status\n"
    download(header, filename, "text/csv;charset=utf-8")
    return
  }
  const metaKeys = new Set<string>()
  for (const b of blocks) {
    if (b.meta && typeof b.meta === "object") {
      for (const k of Object.keys(b.meta)) metaKeys.add(k)
    }
  }
  const metaArr = Array.from(metaKeys).sort()
  const header =
    "id,categoryId,employeeId,date,startH,endH,employee,status" +
    (metaArr.length ? "," + metaArr.map((k) => `meta_${k}`).join(",") : "") +
    "\n"
  const rows = blocks.map((b) => {
    const base = [
      escapeCsv(b.id),
      escapeCsv(b.categoryId),
      escapeCsv(b.employeeId),
      escapeCsv(b.date),
      String(b.startH),
      String(b.endH),
      escapeCsv(b.employee),
      escapeCsv(b.status),
    ]
    const metaVals = metaArr.map((k) =>
      b.meta && typeof b.meta === "object" && k in b.meta
        ? escapeCsv(String((b.meta as Record<string, unknown>)[k]))
        : ""
    )
    return base.join(",") + (metaVals.length ? "," + metaVals.join(",") : "") + "\n"
  })
  download(header + rows.join(""), filename, "text/csv;charset=utf-8")
}

function escapeCsv(v: string): string {
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`
  return v
}

function download(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Export blocks to an iCalendar (.ics) file. Pure string — no external dependency.
 * startH / endH are decimal hours (e.g. 9.5 = 09:30). Triggers browser download.
 */
export function exportToICS(blocks: Block[], filename = "scheduler-export.ics"): void {
  function toHHMMSS(h: number): string {
    const hh = String(Math.floor(h)).padStart(2, "0")
    const mm = String(Math.floor((h % 1) * 60)).padStart(2, "0")
    return `${hh}${mm}00`
  }

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//shadcn-scheduler//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ]

  for (const block of blocks) {
    // date is YYYY-MM-DD — strip dashes for iCal format
    const dateCompact = block.date.replace(/-/g, "")
    lines.push(
      "BEGIN:VEVENT",
      `UID:${block.id}@shadcn-scheduler`,
      `DTSTART:${dateCompact}T${toHHMMSS(block.startH)}`,
      `DTEND:${dateCompact}T${toHHMMSS(block.endH)}`,
      `SUMMARY:${block.employee ?? ""}`,
      `DESCRIPTION:${block.categoryId} — ${block.status}`,
      "END:VEVENT",
    )
  }

  lines.push("END:VCALENDAR")
  download(lines.join("\r\n"), filename, "text/calendar;charset=utf-8")
}
