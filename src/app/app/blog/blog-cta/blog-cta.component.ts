import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle } from '@ionic/angular';

import { BlogCTA } from '../blog.types';

@Component({
  selector: 'app-blog-cta',
  templateUrl: './blog-cta.component.html',
  styleUrls: ['./blog-cta.component.scss'],
  standalone: true,
  imports: [CommonModule, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, RouterModule],
})
export class BlogCtaComponent {
  @Input({ required: true }) cta!: BlogCTA;
  @Input() external = false;
}
