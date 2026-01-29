import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HawbBillListComponent } from './hawb-bill-list.component';

describe('HawbBillListComponent', () => {
  let component: HawbBillListComponent;
  let fixture: ComponentFixture<HawbBillListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HawbBillListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HawbBillListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
