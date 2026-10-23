import { Directive, ElementRef, EventEmitter, HostListener, Input, OnDestroy, Output } from '@angular/core';

/** Drag only the handle so scrolling and controls inside the sheet keep working. */
@Directive({ selector: '[appSheetDismiss]', standalone: true })
export class SheetDismissDirective implements OnDestroy {
  @Output() sheetDismiss = new EventEmitter<void>();
  private disabled = false;
  private pointerId: number | null = null;
  private handle: HTMLElement | null = null;
  private startY = 0;
  private offset = 0;
  private lastMoveAt = 0;
  private velocity = 0;
  private dragged = false;
  private ignoreClick = false;
  private closing = false;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private element: ElementRef<HTMLElement>) {}

  @Input() set sheetDismissDisabled(value: boolean) {
    this.disabled = value;
    if (value) this.reset();
  }

  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent): void {
    const handle = (event.target as Element).closest<HTMLElement>('[data-sheet-handle]');
    if (this.disabled || this.closing || this.pointerId !== null || !event.isPrimary || event.button !== 0
      || !handle || !this.element.nativeElement.contains(handle)) return;

    this.pointerId = event.pointerId;
    this.handle = handle;
    this.startY = event.clientY;
    this.lastMoveAt = event.timeStamp;
    this.velocity = 0;
    this.dragged = this.ignoreClick = false;
    this.element.nativeElement.classList.add('sheet-dragging', 'sheet-interacted');
    handle.setPointerCapture(event.pointerId);
  }

  @HostListener('pointermove', ['$event'])
  onPointerMove(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) return;
    event.preventDefault();
    const offset = Math.max(0, event.clientY - this.startY);
    this.velocity = (offset - this.offset) / Math.max(1, event.timeStamp - this.lastMoveAt);
    this.lastMoveAt = event.timeStamp;
    this.dragged ||= Math.abs(event.clientY - this.startY) > 6;
    this.setOffset(offset);
  }

  @HostListener('pointerup', ['$event'])
  onPointerUp(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) return;
    // Pointer-up can be the last movement sample on a fast touch gesture.
    if (Math.max(0, event.clientY - this.startY) !== this.offset) this.onPointerMove(event);
    const threshold = Math.min(120, this.element.nativeElement.offsetHeight * 0.25);
    const flick = this.offset >= 24 && this.velocity > 0.5 && event.timeStamp - this.lastMoveAt < 100;
    const dismiss = this.offset >= threshold || flick;
    this.ignoreClick = this.dragged;
    this.releasePointer();
    if (dismiss) this.dismiss();
    else this.setOffset(0);
  }

  @HostListener('pointercancel', ['$event'])
  @HostListener('lostpointercapture', ['$event'])
  onPointerCancel(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) return;
    this.ignoreClick = true;
    this.reset();
  }

  @HostListener('click', ['$event'])
  onHandleClick(event: MouseEvent): void {
    if (!(event.target as Element).closest('[data-sheet-handle]')) return;
    event.preventDefault();
    event.stopPropagation();
    // A drag may produce a click on release. A keyboard click (detail 0) is intentional.
    if (!this.ignoreClick || event.detail === 0) this.dismiss();
  }

  @HostListener('keydown.escape', ['$event'])
  onEscape(event: KeyboardEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dismiss();
  }

  @HostListener('transitionend', ['$event'])
  onTransitionEnd(event: TransitionEvent): void {
    if (event.target === this.element.nativeElement && event.propertyName === 'transform') this.completeDismiss();
  }

  ngOnDestroy(): void { this.reset(); }

  private dismiss(): void {
    if (this.disabled || this.closing) return;
    this.releasePointer();
    this.closing = true;
    const sheet = this.element.nativeElement;
    sheet.classList.add('sheet-interacted');
    const viewportHeight = sheet.ownerDocument.defaultView?.innerHeight || sheet.offsetHeight;
    this.setOffset(this.offset + viewportHeight - sheet.getBoundingClientRect().top + 16);
    // Fallback also covers reduced motion or a missing transitionend event.
    this.closeTimer = setTimeout(() => this.completeDismiss(), 200);
  }

  private completeDismiss(): void {
    if (!this.closing || this.disabled) return;
    this.closing = false;
    this.clearTimer();
    this.sheetDismiss.emit();
  }

  private setOffset(offset: number): void {
    this.offset = offset;
    this.element.nativeElement.style.setProperty('--sheet-drag-offset', `${offset}px`);
  }

  private releasePointer(): void {
    const id = this.pointerId;
    this.pointerId = null;
    if (id !== null && this.handle?.hasPointerCapture(id)) this.handle.releasePointerCapture(id);
    this.handle = null;
    this.element.nativeElement.classList.remove('sheet-dragging');
  }

  private clearTimer(): void {
    if (this.closeTimer !== null) clearTimeout(this.closeTimer);
    this.closeTimer = null;
  }

  private reset(): void {
    this.clearTimer();
    this.closing = false;
    this.releasePointer();
    this.setOffset(0);
  }
}
