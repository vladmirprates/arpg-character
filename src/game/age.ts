/**
 * Character level = my age. Experience fills over the year: 0% on my birthday, ~99% the day before
 * the next one, when it rolls over and the level goes up.
 */
export interface Birthday {
  year: number;
  /** 1–12. */
  month: number;
  day: number;
}

export function levelAt(birthday: Birthday, now: Date): { level: number; experience: number } {
  // Calendar dates at local midnight, so the bar moves once per day, not once per millisecond.
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const birthdayIn = (year: number) => new Date(year, birthday.month - 1, birthday.day);

  let year = today.getFullYear();
  if (today < birthdayIn(year)) year--;
  const last = birthdayIn(year);
  const next = birthdayIn(year + 1);
  return {
    level: year - birthday.year,
    experience: (today.getTime() - last.getTime()) / (next.getTime() - last.getTime()),
  };
}
