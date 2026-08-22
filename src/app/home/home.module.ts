import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomePage } from './home.page';

import { IonCol, IonContent, IonGrid, IonIcon, IonInput, IonRow, IonSpinner, IonTextarea } from '@ionic/angular';
import { HomePageRoutingModule } from './home-routing.module';
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
    IonIcon,
    IonInput,
    IonRow,
    IonSpinner,
    IonTextarea,
    HomePageRoutingModule,
    TranslatePipe,
    MetaTagsDirective,
    FooterComponent,
    HeaderComponent
],
  declarations: [HomePage]
})
export class HomePageModule {}
