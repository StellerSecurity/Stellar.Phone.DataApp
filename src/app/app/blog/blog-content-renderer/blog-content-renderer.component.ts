import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';


import { BlogContentBlock, BlogCTA, BlogFAQItem } from '../blog.types';
import { BlogCtaComponent } from '../blog-cta/blog-cta.component';
import { BlogFaqComponent } from '../blog-faq/blog-faq.component';

@Component({
  selector: 'app-blog-content-renderer',
  templateUrl: './blog-content-renderer.component.html',
  styleUrls: ['./blog-content-renderer.component.scss'],
  standalone: true,
  imports: [CommonModule,  BlogCtaComponent, BlogFaqComponent],
})
export class BlogContentRendererComponent {
  @Input() blocks: BlogContentBlock[] = [];

  isCta(block: BlogContentBlock): block is { type: 'cta'; cta: BlogCTA } {
    return block.type === 'cta';
  }

  isFaq(block: BlogContentBlock): block is { type: 'faq'; items: BlogFAQItem[] } {
    return block.type === 'faq';
  }
}
