import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


import { IonButton, IonContent, IonIcon } from '@ionic/angular';
import { BlogPostPageRoutingModule } from './blog-post-routing.module';

import { BlogPostPage } from './blog-post.page';
import {FooterComponent} from "../../app/components/footer/footer.component";
import {HeaderComponent} from "../../app/components/header/header.component";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonButton,
        IonContent,
        IonIcon,
        BlogPostPageRoutingModule,
        FooterComponent,
        HeaderComponent
    ],
  declarations: [BlogPostPage]
})
export class BlogPostPageModule {}
