/**
 * Purpose: Provide shared assessment lifecycle helpers for participant readiness and admin reporting.
 * Used by: Participant assessment/program views, admin assessment reporting, and future backend-aligned logic.
 * Main dependencies: None.
 * Public/main functions: `getAssessmentLifecycleSummary`.
 * Important side effects: None.
 */
export const getAssessmentLifecycleSummary = (registration) => ({
  preAssessmentCompleted: registration?.pre_assessment_status === 'completed',
  postAssessmentCompleted: registration?.post_assessment_status === 'completed',
  postAssessmentPassed: Number(registration?.post_assessment_score || 0) >= 70,
});
