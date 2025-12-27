import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('Utils', () => {
  it('should merge class names correctly', () => {
    const result = cn('px-2', 'py-4');
    expect(result).toBeTruthy();
  });

  it('should handle conditional classes', () => {
    const result = cn('base-class', false && 'conditional-class');
    expect(result).toContain('base-class');
    expect(result).not.toContain('conditional-class');
  });
});
