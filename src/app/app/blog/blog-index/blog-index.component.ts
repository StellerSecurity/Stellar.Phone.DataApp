import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';

import { BlogIndexEntry, BlogQuery } from '../blog.types';
import { BlogFilterBarComponent } from '../blog-filter-bar/blog-filter-bar.component';
import { BlogPaginationComponent } from '../blog-pagination/blog-pagination.component';
import { BlogPostCardComponent } from '../blog-post-card/blog-post-card.component';

@Component({
  selector: 'app-blog-index',
  templateUrl: './blog-index.component.html',
  styleUrls: ['./blog-index.component.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, BlogFilterBarComponent, BlogPaginationComponent, BlogPostCardComponent],
})
export class BlogIndexComponent {
  @Input() title = 'Security Guides';
  @Input() subtitle = 'Practical, non-theatrical security advice for sharing sensitive info.';

  @Input() posts: BlogIndexEntry[] = [];
  @Input() total = 0;
  @Input() categories: string[] = [];
  @Input() tags: string[] = [];
  @Input() query: BlogQuery = { page: 1, pageSize: 12 };

  @Output() queryChange = new EventEmitter<BlogQuery>();

  onFilterChange(q: BlogQuery) {
    this.queryChange.emit({ ...this.query, ...q });
  }

  onPageChange(page: number) {
    this.queryChange.emit({ ...this.query, page });
  }
}
