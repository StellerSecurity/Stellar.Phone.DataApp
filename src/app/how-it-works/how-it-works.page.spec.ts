import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HowItWorksPage } from './how-it-works.page';
import { HowItWorksPageModule } from './how-it-works.module';

describe('HowItWorksPage', () => {
  let component: HowItWorksPage;
  let fixture: ComponentFixture<HowItWorksPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HowItWorksPageModule],
    }).compileComponents();

    fixture = TestBed.createComponent(HowItWorksPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
