type PointerType = MouseEvent | TouchEvent | PointerEvent | TouchInit;
interface ResolvedPointer {
  x: PointerEvent['pageX'];
  y: PointerEvent['pageY'];
  id: PointerEvent['pageY'] | Touch['identifier'];
}
interface FirstTouch {
  newPointer: ResolvedPointer;
  oldPointer: ResolvedPointer | null;
}
type DownCallback = (startPointer: ResolvedPointer, ev: PointerType) => void;
type UpdateCallback =
  (changedPointer: ResolvedPointer, oldPointer: ResolvedPointer, ev: PointerType) => void;
export interface TrackerHandlers {
  down: DownCallback;
  move: UpdateCallback;
  up: UpdateCallback;
}

function toPointer(ev: PointerType): ResolvedPointer {
  const { clientX, clientY, pageX, pageY } = ev as PointerEvent;
  /**
   * NOTE: For MS Edge < 16, `PointerEvents` triggered by unit tests always fail to set defined
   * `pageX` and `pageY`. Those values are overriden by the browser but the values are incorrect as
   * they are less than 10.
   *
   * Therefore, we are finding the max values between `pageX` and `clientX`. Perhaps `client*`
   * properties can be used instead. For code safety during typical situation/ testing, this seems
   * like the best of both worlds.
   */
  const x = Math.max(pageX, clientX);
  const y = Math.max(pageY, clientY);
  const id = (ev as TouchInit).identifier || (ev as PointerEvent).pointerId;

  return { x, y, id: id == null ? 0 : id };
}

function getFirstTouch(startPointer: ResolvedPointer | null, ev: PointerType): FirstTouch {
  const changedTouches = (ev as TouchEvent).changedTouches;

  if (changedTouches == null) return { newPointer: toPointer(ev), oldPointer: startPointer };

  const touches = Array.from(changedTouches, n => toPointer(n));
  const newPointer = startPointer == null
    ? touches[0]
    : touches.find(n => n.id === startPointer.id)!;

  return { newPointer, oldPointer: startPointer };
}

export class Tracker {
  public readonly hasNativePointerEvent = 'PointerEvent' in window;

  private _startPointer: ResolvedPointer | null = null;
  private _started: boolean = false;
  // private readonly _element: HTMLElement;
  private readonly _down: DownCallback;
  private readonly _move: UpdateCallback;
  private readonly _up: UpdateCallback;

  constructor(private _element: HTMLElement, handlers: TrackerHandlers) {
    const { down, move, up } = handlers;

    this._down = down;
    this._move = move;
    this._up = up;

    this._onDown = this._onDown.bind(this);
    this._onMove = this._onMove.bind(this);
    this._onUp = this._onUp.bind(this);

    if (this.hasNativePointerEvent) {
      _element.addEventListener('pointerdown', this._onDown);
      _element.addEventListener('pointermove', this._onMove);
      _element.addEventListener('pointerup', this._onUp);
    } else {
      _element.addEventListener('mousedown', this._onDown);
      _element.addEventListener('touchstart', this._onDown);
      _element.addEventListener('touchmove', this._onMove);
      _element.addEventListener('touchend', this._onUp);
    }
  }

  public disconnect() {
    const rootEl = this._element;

    if (this.hasNativePointerEvent) {
      rootEl.removeEventListener('pointerdown', this._onDown);
      rootEl.removeEventListener('pointermove', this._onMove);
      rootEl.removeEventListener('pointerup', this._onUp);
    } else {
      rootEl.removeEventListener('mousedown', this._onDown);
      rootEl.removeEventListener('touchstart', this._onDown);
      rootEl.removeEventListener('touchmove', this._onMove);
      rootEl.removeEventListener('touchend', this._onUp);
    }
  }

  private _onDown(ev: PointerType) {
    (ev as MouseEvent).preventDefault();

    if (this._started) return;

    if (ev instanceof MouseEvent) {
      this._element.addEventListener('mousemove', this._onMove);
      this._element.addEventListener('mouseup', this._onUp);
    }

    const { newPointer } = getFirstTouch(this._startPointer, ev);

    this._down(newPointer, ev);
    this._startPointer = newPointer;
    this._started = true;
  }

  private _onMove(ev: PointerType) {
    if (this._started) {
      this._updatePointers(this._move, ev);
    }
  }

  private _onUp(ev: PointerType) {
    this._updatePointers(this._up, ev, true);
    this._started = false;
  }

  private _updatePointers(cb: (...args: any[]) => void, ev: PointerType, shouldReset?: boolean) {
    (ev as MouseEvent).preventDefault();

    if (!this._started) return;

    if (shouldReset && ev instanceof MouseEvent) {
      this._element.removeEventListener('mousemove', this._onMove);
      this._element.removeEventListener('mouseup', this._onUp);
    }

    const { newPointer, oldPointer } = getFirstTouch(this._startPointer, ev);

    cb(newPointer, oldPointer, ev);

    this._startPointer = shouldReset ? null : newPointer;
  }
}
