import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HSSACComponent } from './hs-sac.component';

describe('HSSACComponent', () => {
  let component: HSSACComponent;
  let fixture: ComponentFixture<HSSACComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HSSACComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HSSACComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
