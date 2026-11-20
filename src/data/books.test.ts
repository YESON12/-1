import { describe, expect, it } from 'vitest';
import { BOOKS, formatRef, parseReference } from './books';

describe('books', () => {
  it('66권, 1189장', () => {
    expect(BOOKS).toHaveLength(66);
    expect(BOOKS.reduce((s, b) => s + b.chapters, 0)).toBe(1189);
  });
});

describe('parseReference', () => {
  it.each([
    ['요3:16', { book: 43, chapter: 3, verse: 16 }],
    ['요 3:16', { book: 43, chapter: 3, verse: 16 }],
    ['롬8', { book: 45, chapter: 8, verse: undefined }],
    ['창', { book: 1, chapter: 1, verse: undefined }],
    ['요일1', { book: 62, chapter: 1, verse: undefined }],
    ['창세기 1장 3절', { book: 1, chapter: 1, verse: 3 }],
    ['시 23', { book: 19, chapter: 23, verse: undefined }],
    ['사 53:5', { book: 23, chapter: 53, verse: 5 }],
    ['삼상3', { book: 9, chapter: 3, verse: undefined }],
    ['요한계', { book: 66, chapter: 1, verse: undefined }],
    ['창 99', { book: 1, chapter: 50, verse: undefined }],
  ])('%s', (input, expected) => {
    expect(parseReference(input)).toEqual(expected);
  });

  it('알 수 없는 입력은 null', () => {
    expect(parseReference('abc')).toBeNull();
    expect(parseReference('없는책 1')).toBeNull();
  });
});

describe('formatRef', () => {
  it('구간 묶기', () => {
    expect(formatRef(1, 1, [3, 1, 2, 5])).toBe('창 1:1-3,5');
    expect(formatRef(43, 3, [16])).toBe('요 3:16');
    expect(formatRef(19, 23)).toBe('시 23장');
  });
});
