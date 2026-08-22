import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonButton, IonChip, IonContent, IonIcon, IonLabel, ToastController } from '@ionic/angular';

import { BlogPost } from '../blog.types';
import { BlogContentRendererComponent } from '../blog-content-renderer/blog-content-renderer.component';
import { BlogPostCardComponent } from '../blog-post-card/blog-post-card.component';
import { BlogTocComponent } from '../blog-toc/blog-toc.component';
import { ClipboardService } from '../../../services/clipboard.service';

@Component({
  selector: 'app-blog-post',
  templateUrl: './blog-post.component.html',
  styleUrls: ['./blog-post.component.scss'],
  standalone: true,
  imports: [CommonModule, IonButton, IonChip, IonContent, IonIcon, IonLabel, RouterModule, BlogTocComponent, BlogContentRendererComponent, BlogPostCardComponent],
})
export class BlogPostComponent {
  @Input({ required: true }) post!: BlogPost;
  @Input() related: BlogPost[] = [];

  constructor(
    private toastController: ToastController,
    private clipboard: ClipboardService,
  ) {}

  get dateLabel(): string {
    try {
      return new Date(this.post.dateISO).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
      });
    } catch {
      return this.post.dateISO;
    }
  }

  async copyLink() {
    const href = typeof window !== 'undefined' ? window.location.href : '';
    const copied = href ? await this.clipboard.copyText(href) : false;

    const toast = await this.toastController.create({
      message: copied ? 'Link copied' : 'Could not copy link',
      duration: copied ? 1200 : 1500,
      position: 'bottom',
    });
    await toast.present();
  }
}
