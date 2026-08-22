import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BlogPage } from './blog.page';
import { BlogPageModule } from './blog.module';

describe('BlogPage', () => {
  let component: BlogPage;
  let fixture: ComponentFixture<BlogPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlogPageModule],
    }).compileComponents();

    fixture = TestBed.createComponent(BlogPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
