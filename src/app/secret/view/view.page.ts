import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, Inject, OnDestroy, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { SecretapiService } from '../../services/secretapi.service';

import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { Secret } from '../../models/secret';
import * as CryptoJS from 'crypto-js';
import { isPlatformBrowser } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { TranslationService } from '../../services/translation.service';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { firstValueFrom } from 'rxjs';
import { ClipboardService } from '../../services/clipboard.service';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
    selector: 'app-view',
    templateUrl: './view.page.html',
    styleUrls: ['./view.page.scss'],
})
export class ViewPage implements OnDestroy {
    private readonly redirectDurationMs = 300000;
    private readonly redirectDurationSeconds = Math.floor(this.redirectDurationMs / 1000);

    private id: string = '';
    private unlockAnimationTimer: ReturnType<typeof setTimeout> | null = null;
    private typewriterTimer: ReturnType<typeof setInterval> | null = null;
    private redirectTimer: ReturnType<typeof setTimeout> | null = null;
    private countdownTimer: ReturnType<typeof setInterval> | null = null;
    private encryptedMessage = '';
    private encryptedFileContent = '';

    public secretModel: Secret = new Secret();

    public unlocked = false;
    public unlockingAnimation = false;
    public inputPassword = '';
    public openingLoading = false;
    public unlockingLoading = false;
    public openMessage = false;
    public passwordProtected = false;

    public displayedMessage = '';
    public isTypingMessage = false;

    public redirectCountdownSeconds = this.redirectDurationSeconds;

    public url: string = '';
    metaDescription: string = '';
    metaTitle: string = 'Secret Message - Stellar Secret';
    metaKeywords: string = '';

    constructor(
        @Inject(PLATFORM_ID) private platformId: Object,
        private router: Router,
        private toastController: ToastController,
        private alertController: AlertController,
        private loadingCtrl: LoadingController,
        private activatedRoute: ActivatedRoute,
        private secretapi: SecretapiService,
        private translationService: TranslationService,
        private clipboard: ClipboardService,
        private readonly cdr: ChangeDetectorRef
    ) {
        this.activatedRoute.params.subscribe((params: Params) => {
            this.id = params['id'];
        });
    }

    ionViewWillEnter(): void {
        this.clear();
    }

    @HostListener('window:pageshow', ['$event'])
    async onPageShow(event: PageTransitionEvent): Promise<void> {
        if (!event.persisted) {
            return;
        }

        this.clear();
        await this.router.navigateByUrl('/', { replaceUrl: true });
    }

    ionViewWillLeave(): void {
        // Ionic can cache routed pages. Remove decrypted plaintext/ciphertext as
        // soon as this page is left rather than keeping it in a cached instance.
        this.clear();
    }

    ngOnDestroy(): void {
        this.clear();
    }

    private async lightTap(): Promise<void> {
        try {
            await Haptics.impact({ style: ImpactStyle.Light });
        } catch {
            // ignore on unsupported platforms
        }
    }

    private async mediumTap(): Promise<void> {
        try {
            await Haptics.impact({ style: ImpactStyle.Medium });
        } catch {
            // ignore on unsupported platforms
        }
    }

    private clearTimers(): void {
        if (this.unlockAnimationTimer) {
            clearTimeout(this.unlockAnimationTimer);
            this.unlockAnimationTimer = null;
        }

        if (this.typewriterTimer) {
            clearInterval(this.typewriterTimer);
            this.typewriterTimer = null;
        }

        if (this.redirectTimer) {
            clearTimeout(this.redirectTimer);
            this.redirectTimer = null;
        }

        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
    }

    private startUnlockAnimation(): void {
        if (this.unlockAnimationTimer) {
            clearTimeout(this.unlockAnimationTimer);
        }

        this.unlocked = true;
        this.unlockingAnimation = true;

        this.unlockAnimationTimer = setTimeout(() => {
            this.unlockingAnimation = false;
            this.unlockAnimationTimer = null;
            this.cdr.markForCheck();
        }, 1400);
    }

    private startTypewriterMessage(fullMessage: string): void {
        if (this.typewriterTimer) {
            clearInterval(this.typewriterTimer);
            this.typewriterTimer = null;
        }

        this.displayedMessage = '';
        this.isTypingMessage = true;

        if (!fullMessage || fullMessage.length === 0) {
            this.isTypingMessage = false;
            return;
        }

        const characters = Array.from(fullMessage);

        // Angular 22 is zoneless/OnPush by default. Render the first character
        // synchronously so an unlocked secret can never show only the caret,
        // then explicitly mark the view from every timer tick.
        this.displayedMessage = characters[0] || '';
        let index = this.displayedMessage ? 1 : 0;
        this.isTypingMessage = index < characters.length;
        this.cdr.markForCheck();

        if (index >= characters.length) {
            return;
        }

        const typingDelay = this.getTypingDelay(fullMessage);

        this.typewriterTimer = setInterval(() => {
            const nextCharacter = characters[index];
            if (nextCharacter !== undefined) {
                this.displayedMessage += nextCharacter;
                index += 1;
            }

            if (index >= characters.length) {
                if (this.typewriterTimer) {
                    clearInterval(this.typewriterTimer);
                    this.typewriterTimer = null;
                }

                this.isTypingMessage = false;
            }

            this.cdr.markForCheck();
        }, typingDelay);
    }

    private getTypingDelay(message: string): number {
        const length = message.length;

        if (length <= 120) {
            return 18;
        }

        if (length <= 300) {
            return 12;
        }

        if (length <= 700) {
            return 8;
        }

        return 5;
    }

    private async renderBusyState(): Promise<void> {
        this.cdr.detectChanges();

        if (!isPlatformBrowser(this.platformId)) {
            return;
        }

        // Give the browser two paint opportunities before API/crypto work.
        // CryptoJS decrypt is synchronous and can otherwise make the button
        // appear frozen, particularly when a secret contains a large file.
        await new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });
    }

    private decryptValue(ciphertext: string, key: string): string | null {
        if (!ciphertext) {
            return '';
        }

        try {
            const plaintext = CryptoJS.AES.decrypt(ciphertext, key).toString(CryptoJS.enc.Utf8);
            return plaintext.length > 0 ? plaintext : null;
        } catch {
            return null;
        }
    }

    private parsePasswordFlag(value: unknown): boolean {
        return value === true || value === 1 || value === '1' || value === 'true';
    }

    private parseResponseCode(value: unknown): number | null {
        if (value === null || value === undefined || value === '') {
            return null;
        }

        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    private normalizeSecretPayload(rawBody: unknown): { responseCode: number | null; secret: Secret | null } {
        if (!rawBody || typeof rawBody !== 'object') {
            return { responseCode: null, secret: null };
        }

        const body = rawBody as Record<string, unknown>;
        const responseCode = this.parseResponseCode(
            body['response_code'] ?? body['responseCode'] ?? body['code']
        );

        const candidates: unknown[] = [
            body['secret'],
            body['data'],
            body['response_data'],
            body['result'],
            rawBody,
        ];

        for (const candidate of candidates) {
            if (!candidate || typeof candidate !== 'object') {
                continue;
            }

            const candidateObject = candidate as Record<string, unknown>;
            const nestedSecret = candidateObject['secret'];
            const payload = nestedSecret && typeof nestedSecret === 'object'
                ? nestedSecret as Record<string, unknown>
                : candidateObject;

            const hasMessage = typeof payload['message'] === 'string';
            const hasFiles = Array.isArray(payload['files']);
            const hasPasswordFlag = 'has_password' in payload || 'hasPassword' in payload;

            if (!hasMessage && !hasFiles && !hasPasswordFlag) {
                continue;
            }

            const secret = new Secret();
            secret.id = typeof payload['id'] === 'string' ? payload['id'] : '';
            secret.message = typeof payload['message'] === 'string' ? payload['message'] : '';
            secret.expires_at = typeof payload['expires_at'] === 'string' ? payload['expires_at'] : '';
            secret.has_password = this.parsePasswordFlag(
                payload['has_password'] ?? payload['hasPassword']
            );
            secret.files = Array.isArray(payload['files'])
                ? payload['files'].filter((file): file is any => !!file && typeof file === 'object').map((file: any) => ({ ...file }))
                : [];

            return { responseCode, secret };
        }

        return { responseCode, secret: null };
    }

    private async showUnavailableSecret(): Promise<void> {
        this.openingLoading = false;

        const alert = await this.alertController.create({
            header: this.translationService.allTranslations?.SECRET_ERROR || 'Error',
            message:
                this.translationService.allTranslations
                    ?.THE_SECRET_LINK_DOES_NOT_EXIST_OR_HAS_ALREADY_BEEN_VIEWED ||
                'The secret link does not exist or has already been viewed.',
            buttons: [this.translationService.allTranslations?.OK || 'OK'],
        });

        await alert.present();
        await alert.onDidDismiss();
        this.clear();
        await this.router.navigateByUrl('/', { replaceUrl: true });
    }

    private async showDecryptionError(): Promise<void> {
        this.openingLoading = false;
        this.unlocked = false;
        this.displayedMessage = '';

        const alert = await this.alertController.create({
            header: this.translationService.allTranslations?.SECRET_ERROR || 'Error',
            message: this.translationService.allTranslations?.SOMETHING_WENT_WRONG || 'Something went wrong',
            buttons: [this.translationService.allTranslations?.OK || 'OK'],
        });

        await alert.present();
        await alert.onDidDismiss();
        this.clear();
        await this.router.navigateByUrl('/', { replaceUrl: true });
    }

    private revealUnlockedSecret(decryptedMessage: string): void {
        this.secretModel.message = decryptedMessage;
        this.startUnlockAnimation();
        this.startTypewriterMessage(decryptedMessage);
        this.startRedirectCountdown();
        this.cdr.markForCheck();
    }

    private startRedirectCountdown(): void {
        if (this.redirectTimer) {
            clearTimeout(this.redirectTimer);
            this.redirectTimer = null;
        }

        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }

        this.redirectCountdownSeconds = this.redirectDurationSeconds;

        this.countdownTimer = setInterval(() => {
            if (this.redirectCountdownSeconds > 0) {
                this.redirectCountdownSeconds -= 1;
            }

            if (this.redirectCountdownSeconds <= 0 && this.countdownTimer) {
                clearInterval(this.countdownTimer);
                this.countdownTimer = null;
            }

            this.cdr.markForCheck();
        }, 1000);

        this.redirectTimer = setTimeout(async () => {
            this.clear();
            await this.router.navigateByUrl('/', { replaceUrl: true });
        }, this.redirectDurationMs);
    }

    public get redirectCountdownLabel(): string {
        const minutes = Math.floor(this.redirectCountdownSeconds / 60);
        const seconds = this.redirectCountdownSeconds % 60;
        const paddedSeconds = seconds.toString().padStart(2, '0');

        return `${minutes}:${paddedSeconds}`;
    }

    public get isCountdownEndingSoon(): boolean {
        return this.redirectCountdownSeconds <= 30;
    }

    base64ToFile(base64String: string, mimeType: string, fileName: string): void {
        const base64Data = base64String.replace(/^data:.+;base64,/, '');
        const byteCharacters = atob(base64Data);
        const byteArray = new Uint8Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
            byteArray[i] = byteCharacters.charCodeAt(i);
        }
        const blob = new Blob([byteArray], { type: mimeType });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        link.remove();

        // Revoking immediately can race the download in Safari/WebViews.
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    public async copy(): Promise<void> {
        const copyText = this.secretModel.message || '';
        const copied = await this.clipboard.copyText(copyText);

        const toast = await this.toastController.create({
            message: copied
                ? (this.translationService.allTranslations?.THE_MESSAGE_HAS_BEEN_COPIED || 'The message has been copied.')
                : (this.translationService.allTranslations?.SOMETHING_WENT_WRONG || 'Could not copy the message.'),
            duration: copied ? 2500 : 1800,
            position: 'top',
        });

        if (copied) {
            void this.lightTap();
        }

        await toast.present();
    }

    public async loadSecret(): Promise<void> {
        if (this.openingLoading || this.openMessage) {
            return;
        }

        // Busy state must be visible before haptics, network I/O or CryptoJS.
        this.openingLoading = true;
        await this.renderBusyState();
        void this.lightTap();

        await this.openMessageBox();
    }

    private async openMessageBox(): Promise<void> {
        try {
            if (!this.id) {
                await this.showUnavailableSecret();
                return;
            }

            // Observe the real HTTP status as well as the body. The API has
            // historically returned response_code in the JSON body, but that
            // value can be a string or be omitted entirely while HTTP is 200.
            // A one-time secret must never be fetched twice just to compensate
            // for response-shape differences, so normalize the single response.
            const httpResponse: HttpResponse<any> = await firstValueFrom(this.secretapi.view(this.id));

            if (httpResponse.status < 200 || httpResponse.status >= 300) {
                await this.showUnavailableSecret();
                return;
            }

            const { responseCode, secret } = this.normalizeSecretPayload(httpResponse.body);

            // If the API explicitly provides an application response code,
            // respect it. Accept both numeric 200 and string "200".
            if ((responseCode !== null && responseCode !== 200) || !secret) {
                await this.showUnavailableSecret();
                return;
            }

            this.secretModel = secret;
            this.passwordProtected = this.parsePasswordFlag(this.secretModel.has_password);

            // Keep ciphertext out of the UI-facing model. It is held only in
            // private fields until a successful decrypt has completed.
            this.encryptedMessage = (this.secretModel.message || '').toString();
            this.secretModel.message = '';

            this.encryptedFileContent = '';
            if (this.secretModel.files && this.secretModel.files.length > 0) {
                this.encryptedFileContent = (this.secretModel.files[0].content || '').toString();
                this.secretModel.files[0].content = '';
            }

            // A secret can legitimately contain only a file. Reject only an
            // actually empty payload, not an empty message string.
            if (!this.encryptedMessage && !this.encryptedFileContent) {
                await this.showDecryptionError();
                return;
            }

            // Only move to the password UI after the API response has been
            // safely captured. No-password secrets keep the original spinner
            // visible throughout synchronous decryption as well.
            if (this.passwordProtected) {
                this.openMessage = true;
                this.openingLoading = false;
                this.cdr.markForCheck();
                this.cdr.detectChanges();
                return;
            }

            const decryptedMessage = this.encryptedMessage
                ? this.decryptValue(this.encryptedMessage, this.id)
                : '';
            const decryptedFileContent = this.encryptedFileContent
                ? this.decryptValue(this.encryptedFileContent, this.id)
                : '';

            if (decryptedMessage === null || decryptedFileContent === null) {
                await this.showDecryptionError();
                return;
            }

            if (this.secretModel.files && this.secretModel.files.length > 0) {
                this.secretModel.files[0].content = decryptedFileContent;
            }

            this.openMessage = true;
            this.revealUnlockedSecret(decryptedMessage);
            this.openingLoading = false;
            this.cdr.markForCheck();
            this.cdr.detectChanges();
            void this.mediumTap();
        } catch {
            this.openingLoading = false;
            this.cdr.markForCheck();

            const alert = await this.alertController.create({
                header: this.translationService.allTranslations?.SECRET_ERROR || 'Error',
                message: this.translationService.allTranslations?.SOMETHING_WENT_WRONG || 'Something went wrong',
                buttons: [this.translationService.allTranslations?.OK || 'OK'],
            });

            await alert.present();
        }
    }

    public async downloadAttachedFile(): Promise<void> {
        if (!this.secretModel.files || this.secretModel.files.length === 0) {
            const alert = await this.alertController.create({
                header: this.translationService.allTranslations?.SECRET_ERROR || 'Error',
                message: this.translationService.allTranslations?.SOMETHING_WENT_WRONG || 'Something went wrong',
                buttons: [this.translationService.allTranslations?.OK || 'OK'],
            });
            await alert.present();
            return;
        }

        const confirmAlert = await this.alertController.create({
            header: this.translationService.allTranslations?.DOWNLOAD_ATTACHED_FILE_CONFIRM_TITLE || 'Download attached file?',
            message: this.translationService.allTranslations?.DOWNLOAD_LOCAL_COPY_NOTE || 'A local copy of the attached file will be downloaded to your device.',
            buttons: [
                {
                    text: this.translationService.allTranslations?.CANCEL || 'Cancel',
                    role: 'cancel',
                },
                {
                    text: this.translationService.allTranslations?.DOWNLOAD || 'Download',
                    role: 'confirm',
                },
            ],
        });

        await confirmAlert.present();

        const result = await confirmAlert.onDidDismiss();

        if (result.role !== 'confirm') {
            return;
        }

        void this.mediumTap();

        const loading = await this.loadingCtrl.create();
        await loading.present();

        try {
            const fileContent = this.secretModel.files[0].content || '';
            const mime = fileContent.split(';');
            mime[0] = mime[0].replace('data:', '');

            const randomNumber = Math.floor(Math.random() * (999999999 - 9999) + 9999);
            const originalName = (this.secretModel.files[0].name || '').trim();
            const fileName = originalName || 'File-' + randomNumber;
            this.base64ToFile(fileContent, mime[0], fileName);
        } finally {
            await loading.dismiss();
        }
    }

    public async unlockByPassword(): Promise<void> {
        if (this.unlockingLoading || this.unlocked) {
            return;
        }

        this.unlockingLoading = true;
        await this.renderBusyState();
        void this.lightTap();

        const inputPwd = this.inputPassword || '';
        const decryptedMessage = this.decryptValue(this.encryptedMessage, inputPwd);
        const decryptedFileContent = this.encryptedFileContent
            ? this.decryptValue(this.encryptedFileContent, inputPwd)
            : '';

        if (decryptedMessage === null || decryptedFileContent === null) {
            this.unlockingLoading = false;
            this.cdr.markForCheck();

            const alert = await this.alertController.create({
                header: this.translationService.allTranslations?.SECRET_ERROR || 'Error',
                message:
                    this.translationService.allTranslations?.THE_PASSWORD_IS_NOT_CORRECT_TRY_AGAIN ||
                    'The password is not correct. Try again.',
                buttons: [this.translationService.allTranslations?.OK || 'OK'],
            });

            await alert.present();
            return;
        }

        if (this.secretModel.files && this.secretModel.files.length > 0) {
            this.secretModel.files[0].content = decryptedFileContent;
        }

        this.revealUnlockedSecret(decryptedMessage);
        this.unlockingLoading = false;
        this.cdr.markForCheck();
        void this.mediumTap();
    }

    public async reply(): Promise<void> {
        void this.lightTap();
        this.clear();
        await this.router.navigateByUrl('/', { replaceUrl: true });
    }

    private clear(): void {
        this.clearTimers();

        this.openingLoading = false;
        this.unlockingLoading = false;
        this.secretModel = new Secret();
        this.unlocked = false;
        this.unlockingAnimation = false;
        this.openMessage = false;
        this.inputPassword = '';
        this.passwordProtected = false;
        this.encryptedMessage = '';
        this.encryptedFileContent = '';
        this.displayedMessage = '';
        this.isTypingMessage = false;
        this.redirectCountdownSeconds = this.redirectDurationSeconds;
    }
}