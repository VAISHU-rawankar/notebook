import { useMemo } from 'react';

const SUGGESTIONS: [RegExp, string][] = [
  [/today was a$/i, 'productive day'],
  [/today i$/i, 'am grateful for'],
  [/i feel$/i, 'grateful and at peace'],
  [/i am$/i, 'proud of my progress'],
  [/this morning$/i, 'I woke up feeling refreshed'],
  [/i learned$/i, 'something valuable today'],
  [/i am grateful for$/i, 'the little things in life'],
  [/tomorrow i will$/i, 'focus on what matters most'],
  [/one thing i$/i, 'want to remember is'],
  [/i spent the day$/i, 'working on something meaningful'],
  [/the weather was$/i, 'pleasant and refreshing'],
  [/i realized$/i, 'that consistency is the key'],
  [/my goal is$/i, 'to grow a little every day'],
  [/i struggled with$/i, 'patience, but I am learning'],
  [/today was$/i, 'a good day overall'],
];

export function useSuggestions(text: string): string {
  return useMemo(() => {
    const lastLine = text.split('\n').pop() ?? '';
    const trimmed = lastLine.trimStart();
    if (trimmed.length < 4) return '';
    for (const [pattern, suggestion] of SUGGESTIONS) {
      if (pattern.test(trimmed)) return suggestion;
    }
    return '';
  }, [text]);
}
