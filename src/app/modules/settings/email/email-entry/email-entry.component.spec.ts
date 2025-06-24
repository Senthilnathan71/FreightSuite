import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailEntryComponent } from './email-entry.component';

describe('EmailEntryComponent', () => {
  let component: EmailEntryComponent;
  let fixture: ComponentFixture<EmailEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmailEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
