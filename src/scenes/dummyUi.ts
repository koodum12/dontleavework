/**
 * UI 스켈레톤 확인용 더미 데이터.
 * 스토리 데이터가 아니다 — Day 2에서 public/data/**.json 으로 대체된다.
 */
import type { Note } from '@/data/types';
import type { Message } from '@/components/phone/MessageList';
import type { Memo } from '@/components/phone/VoiceMemo';

export const DUMMY_MESSAGES: Message[] = [
  { id: 'm1', from: '알 수 없음', text: '(더미) 문자 내용', time: '22:28' },
];

export const DUMMY_NOTES: Note[] = [
  { id: 'n1', fact: '(더미) 사실', assumption: '(더미) 추측', nextCheck: '(더미) 다음 확인' },
];

export const DUMMY_MEMOS: Memo[] = [{ id: 'v1', title: '(더미) 음성 메모', length: '0:12' }];

export const DUMMY_PHOTOS: string[] = ['(더미) 사진 1'];
