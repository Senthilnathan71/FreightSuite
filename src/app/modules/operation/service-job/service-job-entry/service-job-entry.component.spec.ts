import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceJobEntryComponent } from './service-job-entry.component';

describe('ServiceJobEntryComponent', () => {
  let component: ServiceJobEntryComponent;
  let fixture: ComponentFixture<ServiceJobEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceJobEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ServiceJobEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
