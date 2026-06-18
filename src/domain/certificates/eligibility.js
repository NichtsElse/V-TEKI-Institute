/**
 * Purpose: Centralize certificate eligibility rules for the V-TEKI MVP frontend.
 * Used by: Admin, participant, trainer, and future API/domain certificate flows.
 * Main dependencies: None.
 * Public/main functions: `isCertificateEligible` and `getCertificateEligibilityChecklist`.
 * Important side effects: None.
 */
export const getCertificateEligibilityChecklist = (enrollment) => ({
  paymentPaid: enrollment?.payment_status === 'paid',
  attendanceReached: Number(enrollment?.attendance_percentage || 0) >= 80,
  postAssessmentCompleted: enrollment?.post_assessment_status === 'completed',
  feedbackSubmitted: Boolean(enrollment?.feedback_submitted || enrollment?.feedback_status === 'submitted'),
  completionDone: enrollment?.completion_status === 'completed',
});

export const isCertificateEligible = (enrollment) => {
  const checklist = getCertificateEligibilityChecklist(enrollment);
  return Object.values(checklist).every(Boolean);
};
