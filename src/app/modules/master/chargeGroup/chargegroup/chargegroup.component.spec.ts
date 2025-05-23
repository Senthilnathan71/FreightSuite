import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChargegroupComponent } from './chargegroup.component';

describe('ChargegroupComponent', () => {
  let component: ChargegroupComponent;
  let fixture: ComponentFixture<ChargegroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChargegroupComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChargegroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
