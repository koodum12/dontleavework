import type { Condition } from './Condition';

export interface PhoneMessage {
  id: string;
  from: string;
  text: string;
  time: string;
  /** 문자 세부정보 — 발신/도착 시간, 식별값 등 */
  detail?: Record<string, string>;
  /** 삭제된 항목으로 분류되며, 이 플래그가 켜져야 복구된다 */
  recoveredBy?: string;
}

export interface PhonePhoto {
  id: string;
  title: string;
  description?: string;
}

export interface VoiceMemoData {
  id: string;
  title: string;
  length: string;
  transcript?: string;
  recoveredBy?: string;
}

export interface PhoneFile {
  messages: Record<string, PhoneMessage>;
  photos: Record<string, PhonePhoto>;
  memos: Record<string, VoiceMemoData>;
  /** 휴대폰을 열었을 때 조건을 만족하면 시작되는 이벤트 (day3 §5 onPhoneOpen) */
  onOpen?: { eventId: string; conditions?: Condition[] }[];
}
