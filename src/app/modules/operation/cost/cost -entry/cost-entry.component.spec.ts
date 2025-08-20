import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CostEntryComponent } from './cost-entry.component';

describe('CostEntryComponent', () => {
  let component: CostEntryComponent;
  let fixture: ComponentFixture<CostEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CostEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CostEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
