import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeetingUpdateListComponent } from './meeting-update-list.component';

describe('MeetingUpdateListComponent', () => {
  let component: MeetingUpdateListComponent;
  let fixture: ComponentFixture<MeetingUpdateListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeetingUpdateListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MeetingUpdateListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
