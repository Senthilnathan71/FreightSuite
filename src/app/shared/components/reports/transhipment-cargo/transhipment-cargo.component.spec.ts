import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranshipmentCargoComponent } from './transhipment-cargo.component';

describe('TranshipmentCargoComponent', () => {
  let component: TranshipmentCargoComponent;
  let fixture: ComponentFixture<TranshipmentCargoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranshipmentCargoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TranshipmentCargoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
