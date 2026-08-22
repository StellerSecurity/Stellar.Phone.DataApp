import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonChip, IonLabel } from '@ionic/angular';

import { BlogIndexEntry } from '../blog.types';

@Component({
  selector: 'app-blog-post-card',
  templateUrl: './blog-post-card.component.html',
  styleUrls: ['./blog-post-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonChip, IonLabel, RouterModule],
})
export class BlogPostCardComponent {
  @Input({ required: true }) post!: BlogIndexEntry;
  @Input() hrefBase = '/blog';

  get href(): any[] {
    return [this.hrefBase, this.post.slug];
  }

  get dateLabel(): string {
    try {
      return new Date(this.post.dateISO).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      });
    } catch {
      return this.post.dateISO;
    }
  }
}
