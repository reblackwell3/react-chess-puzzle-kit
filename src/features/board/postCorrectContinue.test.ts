import { resolvePostCorrectContinue } from './postCorrectContinue';

describe('resolvePostCorrectContinue', () => {
  const handler = () => {};

  it('ordinary assisted recovery → single-next (not full autoplay)', () => {
    expect(
      resolvePostCorrectContinue({
        assistedByAnswerArrow: true,
        hasResumeConfig: false,
        onAssistedRecoveryContinue: handler,
      }),
    ).toBe('single-next');
  });

  it('resume assisted recovery → assisted-recovery', () => {
    expect(
      resolvePostCorrectContinue({
        assistedByAnswerArrow: true,
        hasResumeConfig: true,
        onAssistedRecoveryContinue: handler,
      }),
    ).toBe('assisted-recovery');
  });

  it('resume clean correct → resume-auto-advance', () => {
    expect(
      resolvePostCorrectContinue({
        assistedByAnswerArrow: false,
        hasResumeConfig: true,
        onAssistedRecoveryContinue: handler,
      }),
    ).toBe('resume-auto-advance');
  });

  it('ordinary clean correct → single-next', () => {
    expect(
      resolvePostCorrectContinue({
        assistedByAnswerArrow: false,
        hasResumeConfig: false,
      }),
    ).toBe('single-next');
  });
});
