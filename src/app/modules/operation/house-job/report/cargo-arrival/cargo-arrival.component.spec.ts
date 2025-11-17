import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CargoArrivalComponent } from './cargo-arrival.component';

describe('CargoArrivalComponent', () => {
  let component: CargoArrivalComponent;
  let fixture: ComponentFixture<CargoArrivalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CargoArrivalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CargoArrivalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
