import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfitCenterComponent } from './profit-center.component';

describe('ProfitCenterComponent', () => {
  let component: ProfitCenterComponent;
  let fixture: ComponentFixture<ProfitCenterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfitCenterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProfitCenterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
