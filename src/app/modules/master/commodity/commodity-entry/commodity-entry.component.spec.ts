import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommodityEntryComponent } from './commodity-entry.component';

describe('CommodityEntryComponent', () => {
  let component: CommodityEntryComponent;
  let fixture: ComponentFixture<CommodityEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommodityEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CommodityEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
