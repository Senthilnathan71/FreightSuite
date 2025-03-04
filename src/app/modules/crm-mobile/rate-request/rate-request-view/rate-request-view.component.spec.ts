import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RateRequestViewComponent } from './rate-request-view.component';

describe('RateRequestViewComponent', () => {
  let component: RateRequestViewComponent;
  let fixture: ComponentFixture<RateRequestViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RateRequestViewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RateRequestViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
