import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreatedPage } from './created.page';
import { CreatedPageModule } from './created.module';

describe('CreatedPage', () => {
  let component: CreatedPage;
  let fixture: ComponentFixture<CreatedPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatedPageModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CreatedPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
