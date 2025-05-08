import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PackageTypeEntryComponent } from './package-type-entry.component';

describe('PackageTypeEntryComponent', () => {
  let component: PackageTypeEntryComponent;
  let fixture: ComponentFixture<PackageTypeEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PackageTypeEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PackageTypeEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
