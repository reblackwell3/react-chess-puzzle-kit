export type PostCorrectContinue =
  | 'assisted-recovery'
  | 'resume-auto-advance'
  | 'single-next';

/** Route after a correct (or assisted-recovery) ply animation finishes. */
export function resolvePostCorrectContinue(input: {
  assistedByAnswerArrow: boolean;
  hasResumeConfig: boolean;
  onAssistedRecoveryContinue?: unknown;
}): PostCorrectContinue {
  if (input.assistedByAnswerArrow) {
    if (input.hasResumeConfig && input.onAssistedRecoveryContinue) {
      return 'assisted-recovery';
    }
    return 'single-next';
  }
  if (input.hasResumeConfig) {
    return 'resume-auto-advance';
  }
  return 'single-next';
}
