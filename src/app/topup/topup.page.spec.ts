import { TopupPage } from './topup.page';
import en from '../i18n/en';

describe('top-up summary', () => {
  function page(): TopupPage {
    return new TopupPage({} as any, {} as any, {} as any, {} as any, {} as any, {} as any,
      { currentLang: 'en', instant: (key: string) => (en as Record<string, string>)[key] || key } as any, {} as any);
  }
  it('does not turn missing remaining data into a zero balance', () => {
    const view = page(); view.sim = { remaining_bytes: null };
    expect(view.getRemainingData()).toBe('');
    view.sim = { remaining_bytes: 0 };
    expect(view.getRemainingData()).toBe('0 GB');
  });
  it('does not mistake the first country of a regional plan for its whole coverage', () => {
    const view = page(); view.sim = {};
    view.currentPlan = { raw: { locationNetworkList: [{ locationName: 'Albania' }, { locationName: 'Denmark' }] } };
    expect(view.getCurrentPlanArea()).toBe('');
  });
});
