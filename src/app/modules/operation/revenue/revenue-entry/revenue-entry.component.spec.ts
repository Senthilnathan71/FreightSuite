import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevenueEntryComponent } from './revenue-entry.component';

describe('RevenueEntryComponent', () => {
  let component: RevenueEntryComponent;
  let fixture: ComponentFixture<RevenueEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RevenueEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RevenueEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
