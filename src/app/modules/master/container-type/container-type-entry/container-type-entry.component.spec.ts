import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContainerTypeEntryComponent } from './container-type-entry.component';

describe('ContainerTypeEntryComponent', () => {
  let component: ContainerTypeEntryComponent;
  let fixture: ComponentFixture<ContainerTypeEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContainerTypeEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ContainerTypeEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
