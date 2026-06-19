/**
 * Purpose: Resolve the effective trainer profile for trainer-facing pages.
 * Used by: Trainer dashboard, batches, attendance, assessments, feedback, and reports pages.
 * Main dependencies: None.
 * Public/main functions: `resolveTrainerRecord`.
 * Important side effects: None.
 */
export const resolveTrainerRecord = (user, trainers = []) => {
  if (!user) {
    return null;
  }

  if (user.email?.toLowerCase() === 'trainer@vteki.local') {
    return (
      trainers.find((trainer) => trainer.email?.toLowerCase() === 'trainer@vteki.local') ||
      trainers.find((trainer) => trainer.full_name === 'Dr. Idha Kristiana, S.Kom., MMSI., SMIEEE') ||
      null
    );
  }

  return (
    trainers.find((trainer) => trainer.id === user.id) ||
    trainers.find((trainer) => trainer.email?.toLowerCase() === user.email?.toLowerCase()) ||
    trainers.find((trainer) => trainer.full_name === user.full_name) ||
    null
  );
};
