import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonItem, IonLabel, IonList } from '@ionic/angular';

import { BlogHeading } from '../blog.types';

@Component({
  selector: 'app-blog-toc',
  templateUrl: './blog-toc.component.html',
  styleUrls: ['./blog-toc.component.scss'],
  standalone: true,
  imports: [CommonModule, IonItem, IonLabel, IonList],
})
export class BlogTocComponent {
  @Input() headings: BlogHeading[] = [];
  @Input() title = 'On this page';

  scrollTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
