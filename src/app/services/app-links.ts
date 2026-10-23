export function internalAppRoute(target: string, origin: string, route: 'topup' | 'checkout'): string {
  try {
    const url = new URL(target, origin);
    if (url.origin !== origin && url.origin !== 'https://data.stellarsecurity.com') return '';
    const pattern = route === 'topup' ? /^\/topup\/[^/]+\/?$/i : /^\/topup-checkout\/?$/i;
    return pattern.test(url.pathname) ? `${url.pathname}${url.search}${url.hash}` : '';
  } catch { return ''; }
}
