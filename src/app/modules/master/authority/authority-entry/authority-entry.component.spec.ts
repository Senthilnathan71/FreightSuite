import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthorityEntryComponent } from './authority-entry.component';

describe('AuthorityEntryComponent', () => {
  let component: AuthorityEntryComponent;
  let fixture: ComponentFixture<AuthorityEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthorityEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AuthorityEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
