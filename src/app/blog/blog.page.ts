import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { BlogService, BlogPost } from './blog.service';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
  selector: 'app-blog',
  templateUrl: './blog.page.html',
  styleUrls: ['./blog.page.scss'],
})
export class BlogPage implements OnInit {
  metaTitle = 'Stellar Secret Blog';
  metaDescription = 'Guides & updates on secure one-time sharing, passwords, API keys, and privacy basics.';
  metaKeywords = 'one-time secret, secure sharing, password sharing, api keys, privacy, encryption';
  url = '/blog';

  isLoading = true;

  search = '';
  selectedCategory = 'All';
  selectedTag = 'All';

  posts: BlogPost[] = [];
  visiblePosts: BlogPost[] = [];

  categories: string[] = ['All'];
  tags: string[] = ['All'];

  pageSize = 8;
  page = 1;
  hasMore = false;

  constructor(private blog: BlogService, private readonly cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadPosts();
  }

  private loadPosts(done?: () => void) {
    this.isLoading = true;

    this.blog.getPosts().subscribe({
      next: (data) => {
        this.posts = (data || []).slice().sort((a, b) => {
          const f = (a.featured === b.featured) ? 0 : (a.featured ? -1 : 1);
          if (f !== 0) return f;

          const ad = String(a.dateISO || '');
          const bd = String(b.dateISO || '');
          return bd.localeCompare(ad); // newest first
        });

        this.buildFilters();

        if (!this.categories.includes(this.selectedCategory)) this.selectedCategory = 'All';
        if (!this.tags.includes(this.selectedTag)) this.selectedTag = 'All';

        this.applyFilters(true);

        this.isLoading = false;
        this.cdr.markForCheck();
        done?.();
      },
      error: () => {
        this.posts = [];
        this.buildFilters();
        this.applyFilters(true);
        this.isLoading = false;
        this.cdr.markForCheck();
        done?.();
      }
    });
  }

  private buildFilters() {
    const cats = new Set<string>();
    const tagSet = new Set<string>();

    for (const p of this.posts) {
      if (p?.category) cats.add(p.category);
      (p?.tags || []).forEach(t => tagSet.add(t));
    }

    this.categories = ['All', ...Array.from(cats).sort((a, b) => a.localeCompare(b))];
    this.tags = ['All', ...Array.from(tagSet).sort((a, b) => a.localeCompare(b))];
  }

  onSearchInput(ev: any) {
    const value = ev?.detail?.value ?? ev?.target?.value ?? '';
    this.search = String(value);
    this.applyFilters(true);
  }

  onCategorySegmentChange(ev: any) {
    const value = ev?.detail?.value ?? 'All';
    this.selectedCategory = String(value || 'All');

    // Reset tag to avoid accidental “Nothing found”
    this.selectedTag = 'All';

    this.applyFilters(true);
  }

  onTagChange(value: string) {
    const v = value || 'All';
    this.selectedTag = (this.selectedTag === v) ? 'All' : v;
    this.applyFilters(true);
  }

  doRefresh(ev: any) {
    this.loadPosts(() => ev?.target?.complete?.());
  }

  loadMore(ev: any) {
    setTimeout(() => {
      this.page += 1;
      this.applyFilters(false);
      ev?.target?.complete?.();
      this.cdr.markForCheck();
      // DO NOT set ev.target.disabled here. Control it via [disabled] in HTML.
    }, 200);
  }

  // Manual fallback button
  loadMoreManual() {
    this.page += 1;
    this.applyFilters(false);
  }

  private applyFilters(resetPaging: boolean) {
    if (resetPaging) this.page = 1;

    const q = this.search.trim().toLowerCase();
    const cat = this.selectedCategory;
    const tag = this.selectedTag;

    const filtered = (this.posts || [])
        .filter(p => (cat === 'All' ? true : p.category === cat))
        .filter(p => (tag === 'All' ? true : (p.tags || []).includes(tag)))
        .filter(p => {
          if (!q) return true;
          const hay = `${p.title || ''} ${p.excerpt || ''} ${p.category || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
          return hay.includes(q);
        });

    const limit = this.page * this.pageSize;
    this.visiblePosts = filtered.slice(0, limit);
    this.hasMore = this.visiblePosts.length < filtered.length;
  }

  trackBySlug(_: number, item: BlogPost) {
    return item.slug;
  }

  formatDate(iso: string) {
    return iso;
  }
}
