import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');
const failures = [];

function requireText(path, needle, reason) {
  const text = read(path);
  if (!text.includes(needle)) failures.push(`${path}: ${reason}`);
}

function forbidText(path, needle, reason) {
  const text = read(path);
  if (text.includes(needle)) failures.push(`${path}: ${reason}`);
}

function requireOrder(path, needles, reason) {
  const text = read(path);
  let cursor = -1;
  for (const needle of needles) {
    const index = text.indexOf(needle, cursor + 1);
    if (index < 0 || index <= cursor) {
      failures.push(`${path}: ${reason}`);
      return;
    }
    cursor = index;
  }
}

requireText(
  'src/app/home/home.page.ts',
  'if (this.creating || this.fileReading)',
  'Create must be blocked while creating or while an attachment is still being read.',
);
requireText(
  'src/app/home/home.page.ts',
  'this.cancelPendingFileRead();',
  'Composer reset/removal must invalidate pending FileReader work.',
);
requireOrder(
  'src/app/home/home.page.ts',
  ['this.creating = true;', 'await this.renderCreatingState();', 'CryptoJS.AES.encrypt'],
  'Create busy state must paint before synchronous encryption starts.',
);
forbidText(
  'src/app/home/home.page.ts',
  'this.addSecretModal.message = CryptoJS.AES.encrypt',
  'Composer plaintext must never be mutated into ciphertext.',
);

requireOrder(
  'src/app/secret/view/view.page.ts',
  ['this.openingLoading = true;', 'await this.renderBusyState();', 'firstValueFrom(this.secretapi.view(this.id))'],
  'Open-secret busy state must paint before the one-time API read starts.',
);

requireText(
  'src/app/home/home.page.ts',
  'const generation = ++this.fileReadGeneration;',
  'Attachment reads must be generation-guarded against stale async completion.',
);
requireText(
  'src/app/home/home.page.html',
  '[disabled]="creating || fileReading"',
  'Create must be disabled until an attachment has finished loading.',
);
requireText(
  'src/app/secret/view/view.page.ts',
  'ionViewWillLeave(): void',
  'Cached view pages must clear secret material when they are left.',
);
requireText(
  'src/app/secret/view/view.page.ts',
  'setTimeout(() => URL.revokeObjectURL(url), 1000)',
  'File downloads must not revoke their object URL before Safari/WebView starts the download.',
);
requireText(
  'src/app/secret/view/view.page.ts',
  'public unlockingLoading = false;',
  'Password decryption must have its own loading state.',
);
forbidText(
  'src/app/secret/view/view.page.ts',
  'this.secretapi.view(this.id).subscribe',
  'One-time secret reads must use the awaited error-handled path.',
);
requireText(
  'src/app/secret/view/view.page.html',
  '[disabled]="openingLoading"',
  'Open button must lock immediately while the secret is being opened.',
);
requireText(
  'src/app/secret/view/view.page.html',
  '*ngIf="openingLoading"',
  'Open spinner must be rendered only while opening is active.',
);
requireText(
  'src/app/secret/view/view.page.html',
  '[disabled]="unlockingLoading"',
  'Password unlock button must lock while decrypting.',
);
requireText(
  'src/app/secret/view/view.page.html',
  '(secretModel.files?.length || 0) > 0',
  'Download UI must only render when an attachment actually exists.',
);

requireText(
  'src/app/secret/created/created.page.ts',
  'await firstValueFrom(this.secretapi.delete(this.id));',
  'Burn-secret API call must use awaited error handling.',
);
requireText(
  'src/app/secret/created/created.page.ts',
  'finally {',
  'Burn-secret loading overlay must be dismissed on every outcome.',
);

for (const path of [
  'src/app/secret/created/created.page.ts',
  'src/app/secret/view/view.page.ts',
  'src/app/app/blog/blog-post/blog-post.component.ts',
]) {
  requireText(path, 'ClipboardService', 'Copy actions must use the shared one-click clipboard fallback.');
  forbidText(path, 'navigator.clipboard', 'Direct Clipboard API use bypasses the Safari/WebView fallback.');
}

requireText(
  'src/app/services/clipboard.service.ts',
  "this.document.execCommand('copy')",
  'Clipboard fallback must preserve the synchronous user-gesture path.',
);
requireText(
  'src/app/services/clipboard.service.ts',
  'navigator.clipboard?.writeText',
  'Clipboard service must retain the modern Clipboard API fallback.',
);

// Open-secret response handling must trust the real HTTP status and tolerate
// historical body response_code values being strings or omitted on HTTP 200.
requireText(
  'src/app/services/secretapi.service.ts',
  "observe: 'response' as const",
  'Secret view calls must expose the real HTTP status without issuing a second read.',
);
requireText(
  'src/app/secret/view/view.page.ts',
  'normalizeSecretPayload',
  'Secret view responses must be normalized before decryption.',
);
requireText(
  'src/app/secret/view/view.page.ts',
  'this.parseResponseCode',
  'response_code must accept numeric and string values.',
);
forbidText(
  'src/app/secret/view/view.page.ts',
  'response?.response_code !== 200',
  'Open-secret must not reject a successful HTTP 200 solely because response_code is absent or a string.',
);

// Angular 22 defaults to zoneless + OnPush. This migrated Ionic app still has
// timer/FileReader/RxJS state mutations, so those updates must either opt into
// ZoneJS scheduling or explicitly notify Angular.
requireText(
  'src/app/app.config.ts',
  'provideZoneChangeDetection',
  'Legacy Ionic async state requires ZoneJS scheduling during the Angular 22 migration.',
);
requireText(
  'src/app/secret/view/view.page.ts',
  'this.displayedMessage = characters[0] ||',
  'Unlocked messages must render content synchronously instead of showing a caret-only frame.',
);
requireText(
  'src/app/secret/view/view.page.ts',
  'this.cdr.markForCheck();',
  'Timer-driven message/countdown state must notify Angular 22 change detection.',
);
requireText(
  'src/app/secret/view/view.page.html',
  '{{ displayedMessage || secretModel.message }}',
  'Unlocked plaintext must have a direct render fallback if the typewriter animation is interrupted.',
);
requireText(
  'src/app/secret/view/view.page.ts',
  'changeDetection: ChangeDetectionStrategy.Eager',
  'The legacy secret view must preserve eager change detection semantics on Angular 22.',
);
requireText(
  'src/app/secret/created/created.page.html',
  'class="modal-close-icon"',
  'QR modal close control must use an inline icon that cannot disappear because of Ionicons registration.',
);

if (failures.length > 0) {
  console.error('Secret reliability verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Secret reliability verification passed.');
console.log('Create/open/unlock/reset/file/copy/burn/HTTP-response/modal/Angular22-CD invariants are clean.');
