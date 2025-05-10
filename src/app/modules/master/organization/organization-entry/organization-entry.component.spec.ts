import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationEntryComponent } from './organization-entry.component';

describe('OrganizationEntryComponent', () => {
  let component: OrganizationEntryComponent;
  let fixture: ComponentFixture<OrganizationEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OrganizationEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
