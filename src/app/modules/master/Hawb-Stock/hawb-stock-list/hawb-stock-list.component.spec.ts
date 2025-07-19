import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HawbStockListComponent } from './hawb-stock-list.component';

describe('HawbStockListComponent', () => {
  let component: HawbStockListComponent;
  let fixture: ComponentFixture<HawbStockListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HawbStockListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HawbStockListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
