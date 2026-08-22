import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


import { IonCol, IonContent, IonGrid, IonIcon, IonModal, IonPopover, IonRow } from '@ionic/angular';
import { CreatedPageRoutingModule } from './created-routing.module';

import { CreatedPage } from './created.page';
import { TranslatePipe } from '@ngx-translate/core';
import { ConfirmationModalComponent } from './confirmation-modal.component';
import { FooterComponent } from '../../app/components/footer/footer.component';
import { HeaderComponent } from "../../app/components/header/header.component";
import { QrCodeComponent } from 'ng-qrcode';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonCol,
        IonContent,
        IonGrid,
        IonIcon,
        IonModal,
        IonPopover,
        IonRow,
        CreatedPageRoutingModule,
        TranslatePipe,
        FooterComponent,
        HeaderComponent,
        QrCodeComponent
    ],
  declarations: [CreatedPage,ConfirmationModalComponent]
})
export class CreatedPageModule {}
