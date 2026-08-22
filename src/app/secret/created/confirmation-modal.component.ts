import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  standalone: false,
  selector: 'app-confirmation-modal',
  templateUrl: './confirmation-modal.component.html',
  styleUrls: ['./confirmation-modal.component.scss'],
})
export class ConfirmationModalComponent {

  constructor(private modalCtrl: ModalController) { }

  dismiss(confirm: boolean) {
    this.modalCtrl.dismiss(confirm);
  }
}