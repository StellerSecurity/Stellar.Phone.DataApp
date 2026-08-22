import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


import { IonCol, IonContent, IonGrid, IonIcon, IonInput, IonRow, IonSpinner } from '@ionic/angular';
import { ViewPageRoutingModule } from './view-routing.module';

import { ViewPage } from './view.page';
import { TranslatePipe } from '@ngx-translate/core';
import { FooterComponent } from '../../app/components/footer/footer.component';
import { HeaderComponent } from "../../app/components/header/header.component";


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonCol,
    IonContent,
    IonGrid,
    IonIcon,
    IonInput,
    IonRow,
    IonSpinner,
    ViewPageRoutingModule,
    TranslatePipe,
    FooterComponent,
    HeaderComponent
],
  declarations: [ViewPage]
})
export class ViewPageModule {}
