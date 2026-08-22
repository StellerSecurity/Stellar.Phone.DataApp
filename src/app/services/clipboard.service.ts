import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ClipboardService {
  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: object,
    @Inject(DOCUMENT) private readonly document: Document,
  ) {}

  async copyText(text: string): Promise<boolean> {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    // Try the synchronous selection path first while we still have the original
    // user gesture. This is the most reliable path in Safari and Capacitor
    // WebViews, where navigator.clipboard can reject or lose gesture context.
    if (this.copyWithSelection(text)) {
      return true;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Report failure to the caller; never require a second click implicitly.
    }

    return false;
  }

  private copyWithSelection(text: string): boolean {
    const body = this.document.body;
    if (!body) {
      return false;
    }

    const textArea = this.document.createElement('textarea');
    const activeElement = this.document.activeElement as HTMLElement | null;

    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.setAttribute('aria-hidden', 'true');
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '1px';
    textArea.style.height = '1px';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';

    body.appendChild(textArea);

    try {
      textArea.focus({ preventScroll: true });
      textArea.select();
      textArea.setSelectionRange(0, text.length);
      return this.document.execCommand('copy');
    } catch {
      return false;
    } finally {
      body.removeChild(textArea);
      try {
        activeElement?.focus?.({ preventScroll: true });
      } catch {
        // Restoring focus is best-effort only.
      }
    }
  }
}
