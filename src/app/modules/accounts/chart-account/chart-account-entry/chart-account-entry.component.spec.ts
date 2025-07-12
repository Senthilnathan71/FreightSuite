import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartAccountEntryComponent } from './chart-account-entry.component';

describe('ChartAccountEntryComponent', () => {
  let component: ChartAccountEntryComponent;
  let fixture: ComponentFixture<ChartAccountEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartAccountEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChartAccountEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
