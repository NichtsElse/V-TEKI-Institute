/**
 * Purpose: Provide shared helpers for attendance percentage and attendance status summaries.
 * Used by: Admin attendance flow, participant progress views, and future backend-aligned attendance logic.
 * Main dependencies: None.
 * Public/main functions: `calculateAttendancePercentage` and `countPresentLikeRecords`.
 * Important side effects: None.
 */
export const countPresentLikeRecords = (records = []) =>
  records.filter((record) => ['present', 'late', 'excused'].includes(record?.status)).length;

export const calculateAttendancePercentage = (records = []) => {
  if (!records.length) {
    return 0;
  }

  const attended = countPresentLikeRecords(records);
  return Math.round((attended / records.length) * 100);
};
