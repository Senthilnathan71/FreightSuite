import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonEntryHeaderComponent } from './common-entry-header.component';

describe('CommonEntryHeaderComponent', () => {
  let component: CommonEntryHeaderComponent;
  let fixture: ComponentFixture<CommonEntryHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonEntryHeaderComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CommonEntryHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
