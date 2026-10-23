import { SimInputPage } from './sim-input.page';

describe('SIM entry flow', () => {
  const id = '0000000000000001';
  function setup() {
    const session = {
      currentId: '', takeNotice: () => null, clear: jasmine.createSpy(),
      lookup: jasmine.createSpy().and.resolveTo({ id, total_data: 5 }),
      remember: jasmine.createSpy(),
    };
    const nav = { navigateRoot: jasmine.createSpy().and.resolveTo(true) };
    const route = { snapshot: { queryParamMap: { get: () => null } } };
    const page = new SimInputPage(nav as any, route as any, session as any);
    return { page, session, nav };
  }
  it('blocks short and overlong inputs without truncating them', async () => {
    const { page, session, nav } = setup();
    for (const value of ['1'.repeat(15), '1'.repeat(17)]) {
      page.onInputChange({ target: { value } } as any);
      await page.saveInput();
      expect(page.userInput).toBe(value);
      expect(page.errorKey).toBe('HOME_INPUT_ERROR');
    }
    expect(session.lookup).not.toHaveBeenCalled();
    expect(nav.navigateRoot).not.toHaveBeenCalled();
  });
  it('normalizes pasted separators and preserves leading zeros', () => {
    const { page } = setup();
    const event = { target: { value: '0000 0000-0000 0001' } };
    page.onInputChange(event as any);
    expect(page.userInput).toBe(id);
    expect(event.target.value).toBe(id);
    expect(page.isValidInput).toBeTrue();
  });
  it('persists and navigates only after a successful lookup', async () => {
    const { page, session, nav } = setup();
    page.userInput = id;
    await page.saveInput();
    expect(session.remember).toHaveBeenCalledWith(id, { id, total_data: 5 });
    expect(nav.navigateRoot).toHaveBeenCalledWith('/tabs/tab1');
    expect(page.isSubmitting).toBeFalse();
  });
  it('keeps the ID and error on login after failed lookup, including saved SIMs', async () => {
    const { page, session, nav } = setup();
    session.currentId = id;
    session.lookup.and.rejectWith({ status: 0 });
    page.ionViewWillEnter();
    await page.saveInput();
    expect(page.userInput).toBe(id);
    expect(page.errorKey).toBe('CONNECTION_ERROR');
    expect(page.isSubmitting).toBeFalse();
    expect(session.remember).not.toHaveBeenCalled();
    expect(nav.navigateRoot).not.toHaveBeenCalled();
  });
  it('ignores repeated submissions and late responses after cancellation', async () => {
    const { page, session, nav } = setup();
    let resolve!: (value: any) => void;
    session.lookup.and.returnValue(new Promise(done => resolve = done));
    page.userInput = id;
    const pending = page.saveInput();
    await page.saveInput();
    expect(session.lookup).toHaveBeenCalledTimes(1);
    expect(page.isSubmitting).toBeTrue();
    page.cancelLookup();
    resolve({ id, total_data: 5 });
    await pending;
    expect(page.isSubmitting).toBeFalse();
    expect(session.remember).not.toHaveBeenCalled();
    expect(nav.navigateRoot).not.toHaveBeenCalled();
  });
});
