import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


import { IonCol, IonContent, IonGrid, IonRow } from '@ionic/angular';
import { HowItWorksPageRoutingModule } from './how-it-works-routing.module';
import { HowItWorksPage } from './how-it-works.page';
import { TranslatePipe } from '@ngx-translate/core';
import { MetaTagsDirective } from '../directives/meta-tags.directive';
import { FooterComponent } from '../app/components/footer/footer.component';
import { HeaderComponent } from "../app/components/header/header.component";


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonCol,
    IonContent,
    IonGrid,
    IonRow,
    HowItWorksPageRoutingModule,
    TranslatePipe,
    MetaTagsDirective,
    FooterComponent,
    HeaderComponent
],
  declarations: [HowItWorksPage]
})
export class HowItWorksPageModule {}
