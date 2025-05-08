import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommodityListComponent } from './commodity-list.component';

describe('CommodityListComponent', () => {
  let component: CommodityListComponent;
  let fixture: ComponentFixture<CommodityListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommodityListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CommodityListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
