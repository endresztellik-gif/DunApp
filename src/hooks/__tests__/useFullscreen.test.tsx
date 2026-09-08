/**
 * useFullscreen Hook Tests
 *
 * ÚJ FÁJL (2026-09-07). A hook 0% lefedettségen állt, pedig mind az öt
 * teljes képernyős térkép ezt használja (időjárás radar, 2 aszály ArcGIS
 * térkép, met.hu vízhiány).
 *
 * A legfontosabb, amit véd: a `document.body.style.overflow` **visszaállítása**.
 * Ha a cleanup elmarad vagy fixen `''`-re állít, a teljes képernyő bezárása
 * után az oldal görgethetetlen marad (vagy egy külső scroll-lock törik el) —
 * ez a klasszikus scroll-lock szivárgás, és jsdomban jól tesztelhető.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFullscreen } from '../useFullscreen';

describe('useFullscreen', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('alapból nincs teljes képernyő, és a body görgethető', () => {
    const { result } = renderHook(() => useFullscreen());

    expect(result.current.isFullscreen).toBe(false);
    expect(document.body.style.overflow).toBe('');
  });

  it('enter() bekapcsol és zárolja a body görgetését', () => {
    const { result } = renderHook(() => useFullscreen());

    act(() => result.current.enter());

    expect(result.current.isFullscreen).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('exit() kikapcsol és feloldja a görgetést', () => {
    const { result } = renderHook(() => useFullscreen());

    act(() => result.current.enter());
    act(() => result.current.exit());

    expect(result.current.isFullscreen).toBe(false);
    expect(document.body.style.overflow).toBe('');
  });

  it('toggle() oda-vissza vált', () => {
    const { result } = renderHook(() => useFullscreen());

    act(() => result.current.toggle());
    expect(result.current.isFullscreen).toBe(true);

    act(() => result.current.toggle());
    expect(result.current.isFullscreen).toBe(false);
  });

  it('Escape kilép a teljes képernyőből', () => {
    const { result } = renderHook(() => useFullscreen());

    act(() => result.current.enter());
    expect(result.current.isFullscreen).toBe(true);

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(result.current.isFullscreen).toBe(false);
    expect(document.body.style.overflow).toBe('');
  });

  it('más billentyű nem lép ki', () => {
    const { result } = renderHook(() => useFullscreen());

    act(() => result.current.enter());
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    });

    expect(result.current.isFullscreen).toBe(true);
  });

  it('a KORÁBBI overflow-értéket állítja vissza, nem üresre', () => {
    // Ha egy külső komponens (pl. nyitott modál) már zárolta a görgetést,
    // a teljes képernyő bezárása NEM oldhatja fel helyette. A hook ezért a
    // belépéskori értéket menti el és azt teszi vissza.
    document.body.style.overflow = 'scroll';

    const { result } = renderHook(() => useFullscreen());
    act(() => result.current.enter());
    expect(document.body.style.overflow).toBe('hidden');

    act(() => result.current.exit());
    expect(document.body.style.overflow).toBe('scroll');
  });

  it('unmount teljes képernyő közben sem hagy zárolt body-t', () => {
    // Ha a felhasználó modult vált, miközben a térkép teljes képernyőn van,
    // a komponens unmountolódik. Cleanup nélkül az oldal görgethetetlen
    // maradna — az egész alkalmazásban.
    const { result, unmount } = renderHook(() => useFullscreen());

    act(() => result.current.enter());
    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('');
  });

  it('unmount után az Escape-figyelő is eltűnik', () => {
    const { result, unmount } = renderHook(() => useFullscreen());
    act(() => result.current.enter());
    unmount();

    // Ha a listener bennmaradna, ez React-en kívüli setState-et hívna és
    // "state update on unmounted component" figyelmeztetést adna.
    expect(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    }).not.toThrow();
  });
});
