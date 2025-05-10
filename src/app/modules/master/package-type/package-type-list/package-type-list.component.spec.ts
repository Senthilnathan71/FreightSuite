import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PackageTypeListComponent } from './package-type-list.component';

describe('PackageTypeListComponent', () => {
  let component: PackageTypeListComponent;
  let fixture: ComponentFixture<PackageTypeListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PackageTypeListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PackageTypeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
