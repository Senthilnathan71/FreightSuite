import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BranchEntryComponent } from './branch-entry.component';

describe('BranchEntryComponent', () => {
  let component: BranchEntryComponent;
  let fixture: ComponentFixture<BranchEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BranchEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BranchEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
