/** 실루엣 구분용 외형 — public/assets/images/README.md */
export interface CharacterArt {
  hair?: 'short' | 'bob' | 'long' | 'tied';
  accessory?: 'none' | 'badge' | 'cap' | 'glasses' | 'tie';
}

export interface Character {
  id: string;
  name: string;
  /** 같은 초상을 쓰는 문맥별 표시 이름. 예: 사랑 / 과거의 사랑 */
  speakerLabels?: string[];
  role?: string;
  description?: string;
  /** 옷 기본색 — 스프라이트와 실루엣 대체 색의 원본 */
  color?: string;
  /** public/assets/images/characters 아래의 파일명 */
  sprite?: string;
  /** public/assets/images/portraits 아래의 파일명 */
  portrait?: string;
  art?: CharacterArt;
}

export type CharacterFile = Record<string, Character>;
