// Pop-up blockers only allow window.open() during the click itself, not after an
// awaited submit. Forms that send the visitor to WhatsApp open a blank tab on
// the click, then point it at the WhatsApp link once the lead is saved.

/** Call synchronously inside the click/submit handler, after validation passes. */
export function openPendingWindow(): Window | null {
  try {
    const w = window.open('', '_blank')
    if (w) w.opener = null
    return w
  } catch {
    return null
  }
}

/** Sends the pending tab to url; opens a new tab instead if it was blocked or closed. */
export function navigatePendingWindow(w: Window | null, url: string): void {
  if (w && !w.closed) {
    w.location.href = url
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

/** Closes the pending tab when the submit fails. */
export function closePendingWindow(w: Window | null): void {
  try {
    w?.close()
  } catch {
    /* already gone */
  }
}
