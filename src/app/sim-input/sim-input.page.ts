import { Component, ViewChild } from '@angular/core';
import { IonInput, NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { SimSessionService, isSimId, normalizeSimId, lookupErrorKey } from '../services/sim-session.service';

@Component({
  selector: 'app-sim-input',
  templateUrl: './sim-input.page.html',
  styleUrls: ['./sim-input.page.scss'],
})
export class SimInputPage {
  @ViewChild(IonInput) input?: IonInput;
  userInput = '';
  isSubmitting = false;
  errorKey = '';
  savedSimId = '';
  private cancel = new Subject<void>();
  private attempt = 0;

  constructor(private navCtrl: NavController, private route: ActivatedRoute, private session: SimSessionService) {}

  ionViewWillEnter(): void {
    if (this.route.snapshot.queryParamMap.get('clear') === '1') this.session.clear();
    const notice = this.session.takeNotice();
    this.savedSimId = this.session.currentId;
    this.userInput = notice?.id || this.savedSimId;
    this.errorKey = notice?.key || '';
  }

  ionViewWillLeave(): void { this.cancelLookup(); }

  get isValidInput(): boolean { return isSimId(this.userInput); }

  onInputChange(event: Event): void {
    const input = event.target as HTMLIonInputElement;
    this.userInput = normalizeSimId(String(input.value ?? ''));
    input.value = this.userInput;
    this.errorKey = this.userInput.length > 16 ? 'HOME_INPUT_ERROR' : '';
  }

  validateInput(): void {
    if (this.userInput && !this.isValidInput) this.errorKey = 'HOME_INPUT_ERROR';
  }

  useDifferentSim(): void {
    this.session.clear();
    this.userInput = '';
    this.savedSimId = '';
    this.errorKey = '';
    void this.input?.setFocus();
  }

  cancelLookup(): void {
    this.attempt++;
    this.cancel.next();
    this.isSubmitting = false;
  }

  async saveInput(): Promise<void> {
    if (this.isSubmitting) return;
    if (!this.isValidInput) { this.errorKey = 'HOME_INPUT_ERROR'; return; }
    const id = this.userInput;
    const attempt = ++this.attempt;
    this.errorKey = '';
    this.isSubmitting = true;
    try {
      const overview = await this.session.lookup(id, this.cancel);
      if (attempt !== this.attempt) return;
      this.session.remember(id, overview);
      await this.navCtrl.navigateRoot('/tabs/tab1');
    } catch (error) {
      if (attempt === this.attempt) this.errorKey = lookupErrorKey(error);
    } finally {
      if (attempt === this.attempt) this.isSubmitting = false;
    }
  }
}
