import { of } from 'rxjs';
import { Tab1Page } from './tab1.page';

describe('usage dashboard', () => {
  const id = '0000000000000001';
  function setup() {
    const session = {
      currentId: id, takeOverview: jasmine.createSpy().and.returnValue(null),
      lookup: jasmine.createSpy().and.resolveTo({ id, total_data: 5, total_usage: 0 }),
      remember: jasmine.createSpy(), returnToLogin: jasmine.createSpy(),
    };
    const nav = { navigateRoot: jasmine.createSpy().and.resolveTo(true) };
    const translate = { setDefaultLang: () => {}, stream: () => of({}), get: () => of(''), instant: (key: string) => key };
    const page = new Tab1Page({} as any, {} as any, {} as any, {} as any, nav as any, translate as any, session as any);
    (page as any).viewActive = true;
    return { page, session, nav };
  }
  it('reuses the verified login response without a second lookup', async () => {
    const { page, session } = setup();
    session.takeOverview.and.returnValue({ id, total_data: 5, total_usage: 0 });
    await (page as any).getData();
    expect(session.lookup).not.toHaveBeenCalled();
    expect(page.data.id).toBe(id);
  });
  it('returns refresh failures to login with the attempted SIM', async () => {
    const { page, session, nav } = setup();
    session.lookup.and.rejectWith({ status: 404 });
    await (page as any).getData(true);
    expect(session.returnToLogin).toHaveBeenCalledWith(id, { status: 404 });
    expect(nav.navigateRoot).toHaveBeenCalledWith('/sim-input');
    expect(page.data).toBeNull();
    expect(page.isLoading).toBeFalse();
  });
  it('handles zero usage and exhausted packages without recursive getters', () => {
    const { page } = setup();
    page.data = { total_data: 5, total_usage: 0 };
    page.getPercentOfData();
    expect(page.percentUsedRounded).toBe(0);
    page.data = { total_data: 5, remaining: '0 GB' };
    page.getPercentOfData();
    expect(page.percentUsedRounded).toBe(100);
    page.data = { total_data: 0, remaining: 0, total_usage: 0 };
    page.getPercentOfData();
    expect(page.percentUsedRounded).toBe(0);
  });
});
