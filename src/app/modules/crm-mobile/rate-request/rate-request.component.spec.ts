import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RateRequestComponent } from './rate-request.component';

describe('RateRequestComponent', () => {
  let component: RateRequestComponent;
  let fixture: ComponentFixture<RateRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RateRequestComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RateRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
