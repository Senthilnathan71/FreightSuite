import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasterJobListComponent } from './master-job-list.component';

describe('MasterJobListComponent', () => {
  let component: MasterJobListComponent;
  let fixture: ComponentFixture<MasterJobListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasterJobListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MasterJobListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
