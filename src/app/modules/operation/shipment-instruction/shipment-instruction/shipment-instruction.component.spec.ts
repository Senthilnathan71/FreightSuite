import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShipmentInstructionComponent } from './shipment-instruction.component';

describe('ShipmentInstructionComponent', () => {
  let component: ShipmentInstructionComponent;
  let fixture: ComponentFixture<ShipmentInstructionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShipmentInstructionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ShipmentInstructionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
