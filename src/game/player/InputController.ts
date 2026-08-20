'use client';

/** day1 §4 — 키코드를 컴포넌트에 흩지 않는다. 매핑은 여기 한 곳. */
export type MoveAction = 'up' | 'down' | 'left' | 'right';
export type TriggerAction = 'interact' | 'phone' | 'inventory' | 'map' | 'menu' | 'advance';

/** 한글 입력 상태에서도 동작하도록 e.key 가 아니라 e.code 를 쓴다 */
const MOVE_KEYS: Record<string, MoveAction> = {
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

const TRIGGER_KEYS: Record<string, TriggerAction> = {
  KeyE: 'interact',
  Space: 'advance',
  Enter: 'advance',
  NumpadEnter: 'advance',
  Tab: 'phone',
  KeyI: 'inventory',
  KeyM: 'map',
  Escape: 'menu',
};

export interface InputControllerOptions {
  onTrigger: (action: TriggerAction) => void;
}

export class InputController {
  /** 눌려 있는 키 집합. keydown 1회성 처리로 이동하면 OS 키 리피트에 끊긴다. */
  private readonly pressed = new Set<MoveAction>();
  private readonly onTrigger: (action: TriggerAction) => void;

  constructor({ onTrigger }: InputControllerOptions) {
    this.onTrigger = onTrigger;
  }

  isDown(action: MoveAction) {
    return this.pressed.has(action);
  }

  /** 이동 방향 벡터 (대각선도 길이 1로 정규화) */
  getMoveVector(): { x: number; y: number } {
    let x = 0;
    let y = 0;
    if (this.pressed.has('left')) x -= 1;
    if (this.pressed.has('right')) x += 1;
    if (this.pressed.has('up')) y -= 1;
    if (this.pressed.has('down')) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = Math.SQRT1_2; // 1/√2
      x *= inv;
      y *= inv;
    }
    return { x, y };
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Tab') e.preventDefault(); // 기본 포커스 이동 차단
    if (e.code === 'Space') e.preventDefault(); // 스페이스로 페이지가 스크롤되지 않게

    const move = MOVE_KEYS[e.code];
    if (move) {
      this.pressed.add(move);
      return;
    }
    if (e.repeat) return;
    const trigger = TRIGGER_KEYS[e.code];
    if (trigger) this.onTrigger(trigger);
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    const move = MOVE_KEYS[e.code];
    if (move) this.pressed.delete(move);
  };

  /** 창 포커스를 잃으면 눌린 키가 남아 무한 이동하는 것을 막는다 */
  private handleBlur = () => this.reset();

  reset() {
    this.pressed.clear();
  }

  attach() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
  }

  detach() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    this.reset();
  }
}
