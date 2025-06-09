import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChargeTaxComponent } from './charge-tax.component';

describe('ChargeTaxComponent', () => {
  let component: ChargeTaxComponent;
  let fixture: ComponentFixture<ChargeTaxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChargeTaxComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChargeTaxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
