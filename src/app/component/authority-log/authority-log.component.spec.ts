import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthorityLogComponent } from './authority-log.component';

describe('AuthorityLogComponent', () => {
  let component: AuthorityLogComponent;
  let fixture: ComponentFixture<AuthorityLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthorityLogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AuthorityLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
