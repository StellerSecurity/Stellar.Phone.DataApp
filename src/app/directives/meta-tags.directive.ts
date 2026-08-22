import { Directive, Input, OnInit, OnDestroy } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription, filter, map, mergeMap } from 'rxjs';


@Directive({
  selector: '[appMetaTags]',
  standalone: true
})
export class MetaTagsDirective implements OnInit, OnDestroy {

  @Input() title!: string;
  @Input() description?: string;
  @Input() keywords?: string;
  @Input() image?: string;
  @Input() url?: string;
  subscriptions: Subscription[] = [];

  constructor(
    private meta: Meta,
    private titleService: Title,
    private router: Router,
    private route: ActivatedRoute,
  ){}

  ngOnInit(): void {
      this.setMetaData();

      this.subscriptions.push( this.router.events.pipe(
        filter(event => event instanceof NavigationEnd),
        map(() => this.route),
        map(route => {
          while (route.firstChild) route = route.firstChild;
          return route;
        }),
        mergeMap(route => route.data)
      ).subscribe(data => {
        this.titleService.setTitle(this.title);
      }));
  }

  ngOnDestroy(): void {
      this.subscriptions.forEach(s => s.unsubscribe())
  }

  private setMetaData(){
    this.titleService.setTitle(this.title);
    this.meta.updateTag({ name: 'description', content: this.description || '' });
    this.meta.updateTag({ name: 'keywords', content: this.keywords || '' });

    //open graph (OG) tags
    this.meta.updateTag({ property: 'og:site_name', content: 'Stellar Secret' });
    this.meta.updateTag({ property: 'og:title', content: this.title || '' });
    this.meta.updateTag({ property: 'og:description', content: this.description || '' });
    this.meta.updateTag({ property: 'og:image', content: this.image  || '' });
    this.meta.updateTag({ property: 'og:image:alt', content: 'Stellar Secret'});
    this.meta.updateTag({ property: 'og:url', content: this.url  || '' });
    this.meta.updateTag({ property: 'og:type', content: 'website' });

    //twitter card tags
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image'});
    this.meta.updateTag({ name: 'twitter:title', content: this.title  || '' });
    this.meta.updateTag({ name: 'twitter:description', content: this.description || ''  });
    this.meta.updateTag({ name: 'twitter:image', content: this.image  || '' });
    this.meta.updateTag({ property: 'twitter:url', content: this.url || '' })
  }

}
