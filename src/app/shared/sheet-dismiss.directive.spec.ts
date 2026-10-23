import { SheetDismissDirective } from './sheet-dismiss.directive';

describe('bottom-sheet dismissal', () => {
  let directive: SheetDismissDirective;
  let sheet: HTMLElement;
  let handle: HTMLElement;
  let emitted: jasmine.Spy;
  let offset: number;
  let captured: Set<number>;
  let classes: Set<string>;

  beforeEach(() => {
    jasmine.clock().install();
    offset = 0;
    captured = new Set();
    classes = new Set();
    handle = {
      closest: () => handle,
      setPointerCapture: (id: number) => captured.add(id),
      hasPointerCapture: (id: number) => captured.has(id),
      releasePointerCapture: (id: number) => captured.delete(id),
    } as unknown as HTMLElement;
    sheet = {
      contains: (target: Element) => target === handle,
      offsetHeight: 400,
      ownerDocument: { defaultView: { innerHeight: 800 } },
      getBoundingClientRect: () => ({ top: 400 + offset }),
      style: { setProperty: (_: string, value: string) => offset = parseFloat(value) },
      classList: {
        add: (...names: string[]) => names.forEach(name => classes.add(name)),
        remove: (name: string) => classes.delete(name),
      },
    } as unknown as HTMLElement;
    directive = new SheetDismissDirective({ nativeElement: sheet });
    emitted = spyOn(directive.sheetDismiss, 'emit');
  });

  afterEach(() => {
    directive.ngOnDestroy();
    jasmine.clock().uninstall();
  });

  function pointer(y: number, time: number, id = 1, target = handle): PointerEvent {
    return { target, clientY: y, timeStamp: time, pointerId: id, isPrimary: true,
      button: 0, preventDefault: jasmine.createSpy() } as unknown as PointerEvent;
  }

  function click(detail = 1): void {
    directive.onHandleClick({ target: handle, detail, preventDefault: () => {}, stopPropagation: () => {} } as unknown as MouseEvent);
  }

  it('follows a downward drag and closes once after leaving the screen', () => {
    directive.onPointerDown(pointer(420, 0));
    directive.onPointerMove(pointer(530, 400));
    expect(offset).toBe(110);
    expect(captured.has(1)).toBeTrue();
    expect(classes.has('sheet-dragging')).toBeTrue();
    directive.onPointerUp(pointer(530, 450));
    expect(captured.size).toBe(0);
    expect(offset).toBeGreaterThan(400);
    expect(emitted).not.toHaveBeenCalled();
    click();
    directive.onTransitionEnd({ target: sheet, propertyName: 'transform' } as unknown as TransitionEvent);
    jasmine.clock().tick(250);
    expect(emitted).toHaveBeenCalledTimes(1);
  });

  it('snaps a short slow drag back without its generated click closing the panel', () => {
    directive.onPointerDown(pointer(420, 0));
    directive.onPointerMove(pointer(455, 200));
    directive.onPointerUp(pointer(455, 250));
    click();
    jasmine.clock().tick(250);
    expect(offset).toBe(0);
    expect(classes.has('sheet-dragging')).toBeFalse();
    expect(emitted).not.toHaveBeenCalled();
  });

  it('closes on a short fast downward flick, including a final pointer-up sample', () => {
    directive.onPointerDown(pointer(420, 0));
    directive.onPointerUp(pointer(460, 40));
    jasmine.clock().tick(250);
    expect(emitted).toHaveBeenCalledTimes(1);
  });

  it('does not treat a paused drag as a flick', () => {
    directive.onPointerDown(pointer(420, 0));
    directive.onPointerMove(pointer(460, 40));
    directive.onPointerUp(pointer(460, 300));
    jasmine.clock().tick(250);
    expect(offset).toBe(0);
    expect(emitted).not.toHaveBeenCalled();
  });

  it('leaves list scrolling and controls outside the handle alone', () => {
    const body = { closest: () => null } as unknown as HTMLElement;
    directive.onPointerDown(pointer(420, 0, 1, body));
    const move = pointer(600, 200, 1, body);
    directive.onPointerMove(move);
    directive.onPointerUp(pointer(600, 250, 1, body));
    jasmine.clock().tick(250);
    expect(move.preventDefault).not.toHaveBeenCalled();
    expect(captured.size).toBe(0);
    expect(offset).toBe(0);
    expect(emitted).not.toHaveBeenCalled();
  });

  it('ignores a different pointer during an active drag', () => {
    directive.onPointerDown(pointer(420, 0));
    directive.onPointerMove(pointer(600, 100, 2));
    directive.onPointerUp(pointer(600, 150, 2));
    expect(offset).toBe(0);
    expect(captured.has(1)).toBeTrue();
  });

  it('keeps an upward drag on screen and ignores its generated click', () => {
    directive.onPointerDown(pointer(420, 0));
    directive.onPointerMove(pointer(380, 200));
    directive.onPointerUp(pointer(380, 250));
    click();
    jasmine.clock().tick(250);
    expect(offset).toBe(0);
    expect(emitted).not.toHaveBeenCalled();
  });

  it('resets a cancelled gesture without leaving pointer capture or dismissing', () => {
    directive.onPointerDown(pointer(420, 0));
    directive.onPointerMove(pointer(460, 100));
    directive.onPointerCancel(pointer(460, 150));
    click();
    jasmine.clock().tick(250);
    expect(captured.size).toBe(0);
    expect(offset).toBe(0);
    expect(emitted).not.toHaveBeenCalled();
  });

  it('allows a deliberate handle tap after a cancelled drag', () => {
    directive.onPointerDown(pointer(420, 0));
    directive.onPointerCancel(pointer(420, 1));
    directive.onPointerDown(pointer(420, 300));
    directive.onPointerUp(pointer(420, 350));
    click();
    jasmine.clock().tick(250);
    expect(emitted).toHaveBeenCalledTimes(1);
  });

  it('allows keyboard activation after a short drag', () => {
    directive.onPointerDown(pointer(420, 0));
    directive.onPointerMove(pointer(455, 200));
    directive.onPointerUp(pointer(455, 250));
    click(0);
    jasmine.clock().tick(250);
    expect(emitted).toHaveBeenCalledTimes(1);
  });

  it('blocks dismissal while an Auto Top-Up update is in progress', () => {
    directive.sheetDismissDisabled = true;
    directive.onPointerDown(pointer(420, 0));
    directive.onPointerUp(pointer(650, 250));
    click(0);
    directive.onEscape({ preventDefault: () => {}, stopPropagation: () => {} } as KeyboardEvent);
    jasmine.clock().tick(250);
    expect(captured.size).toBe(0);
    expect(emitted).not.toHaveBeenCalled();
  });

  it('cancels a pending dismissal if saving starts or the view is destroyed', () => {
    click(0);
    directive.sheetDismissDisabled = true;
    jasmine.clock().tick(250);
    expect(offset).toBe(0);
    expect(emitted).not.toHaveBeenCalled();
    directive.sheetDismissDisabled = false;
    click(0);
    directive.ngOnDestroy();
    jasmine.clock().tick(250);
    expect(emitted).not.toHaveBeenCalled();
  });
});
