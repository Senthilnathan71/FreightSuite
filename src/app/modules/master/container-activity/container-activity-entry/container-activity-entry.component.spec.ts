import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContainerActivityEntryComponent } from './container-activity-entry.component';

describe('ContainerActivityEntryComponent', () => {
  let component: ContainerActivityEntryComponent;
  let fixture: ComponentFixture<ContainerActivityEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContainerActivityEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ContainerActivityEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
