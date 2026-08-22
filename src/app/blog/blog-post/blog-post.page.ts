import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { BlogService, BlogPost } from '../blog.service';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
  selector: 'app-blog-post',
  templateUrl: './blog-post.page.html',
  styleUrls: ['./blog-post.page.scss'],
})
export class BlogPostPage implements OnInit {
  isLoading = true;
  post: BlogPost | null = null;

  // Meta for <app-header/>
  metaTitle = 'Blog';
  metaDescription = '';
  metaKeywords = '';
  url = '/blog';

  constructor(
      @Inject(DOCUMENT) private readonly document: Document,
      private route: ActivatedRoute,
      private blog: BlogService,
      private title: Title,
      private meta: Meta,
      private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const getSlug = () =>
        this.route.snapshot.paramMap.get('slug')
        || this.route.parent?.snapshot.paramMap.get('slug')
        || '';

    this.isLoading = true;

    // Subscribe so it also updates when navigating between posts
    this.route.paramMap.subscribe(() => {
      const slug = getSlug();

      this.isLoading = true;
      this.blog.getPostBySlug(slug).subscribe({
        next: (p) => {
          this.post = p;
          this.isLoading = false;

          if (p) {
            const titleText = `${p.title} | Stellar Secret Blog`;
            const description = p.excerpt || 'Stellar Secret blog post.';
            const keywords = (p.tags || []).join(', ');
            const url = `/blog/${p.slug}`;

            // <app-header> inputs
            this.metaTitle = titleText;
            this.metaDescription = description;
            this.metaKeywords = keywords;
            this.url = url;

            // Real document SEO tags
            this.applySeo(titleText, description, keywords, url);
          } else {
            const titleText = 'Post not found | Stellar Secret Blog';
            const description = 'This blog post does not exist.';
            const url = `/blog/${slug}`;

            this.metaTitle = titleText;
            this.metaDescription = description;
            this.metaKeywords = '';
            this.url = url;

            this.applySeo(titleText, description, '', url);
          }

          this.cdr.markForCheck();
        },
        error: () => {
          const slug = getSlug();
          const titleText = 'Post not found | Stellar Secret Blog';
          const description = 'This blog post does not exist.';
          const url = `/blog/${slug}`;

          this.post = null;
          this.isLoading = false;

          this.metaTitle = titleText;
          this.metaDescription = description;
          this.metaKeywords = '';
          this.url = url;

          this.applySeo(titleText, description, '', url);
          this.cdr.markForCheck();
        }
      });
    });
  }

  private applySeo(titleText: string, description: string, keywords: string, url: string) {
    // Title
    this.title.setTitle(titleText);

    // Standard meta
    this.meta.updateTag({ name: 'description', content: description || '' });
    if (keywords) this.meta.updateTag({ name: 'keywords', content: keywords });
    else this.meta.removeTag(`name='keywords'`);

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: titleText });
    this.meta.updateTag({ property: 'og:description', content: description || '' });
    this.meta.updateTag({ property: 'og:type', content: 'article' });
    this.meta.updateTag({ property: 'og:url', content: url });

    // Twitter
    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
    this.meta.updateTag({ name: 'twitter:title', content: titleText });
    this.meta.updateTag({ name: 'twitter:description', content: description || '' });

    // Canonical
    this.setCanonical(url);
  }

  private setCanonical(url: string) {
    const rel = 'canonical';
    let link = this.document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', rel);
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  formatDate(iso: string) {
    return iso;
  }

  trackBlock(_: number, block: any) {
    return `${block?.type}-${block?.text || (block?.items || []).join('|')}`;
  }
}
