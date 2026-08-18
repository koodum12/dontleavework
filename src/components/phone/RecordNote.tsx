'use client';

import type { Note } from '@/data/types';

const CHAPTER_LABEL: Record<string, string> = {
  prologue: '프롤로그',
  chapter01: '1장. 평범한 월요일',
  chapter02: '2장. 이상한 문자',
  chapter03: '3장. 회사에서도',
};

/** 기록 노트 — 사실 / 추측 / 다음 확인 3단. 획득 순서를 유지하고 챕터로 묶는다. */
export default function RecordNote({ notes }: { notes: Note[] }) {
  if (notes.length === 0) return <p>기록된 내용이 없습니다.</p>;

  const groups: { chapter: string; notes: Note[] }[] = [];
  for (const note of notes) {
    const chapter = note.chapter ?? 'etc';
    const last = groups[groups.length - 1];
    if (last && last.chapter === chapter) last.notes.push(note);
    else groups.push({ chapter, notes: [note] });
  }

  return (
    <div className="ui-notes" data-testid="record-note">
      {groups.map((g, gi) => (
        <section key={`${g.chapter}-${gi}`}>
          <h4 className="ui-note-chapter">{CHAPTER_LABEL[g.chapter] ?? '기록'}</h4>
          {g.notes.map((n) => (
            <article key={n.id} className="ui-note">
              {/* 사실은 정신력 연출의 면역 구역 — 항상 원문 */}
              <div className="ui-note-fact"><b>사실</b> {n.fact}</div>
              {n.assumption && <div className="ui-note-assumption"><b>추측</b> {n.assumption}</div>}
              {n.nextCheck && <div className="ui-note-next"><b>다음 확인</b> {n.nextCheck}</div>}
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}
