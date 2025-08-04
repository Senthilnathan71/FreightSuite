import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentAuthorizationComponent } from './document-authorization.component';

describe('DocumentAuthorizationComponent', () => {
  let component: DocumentAuthorizationComponent;
  let fixture: ComponentFixture<DocumentAuthorizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentAuthorizationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DocumentAuthorizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
