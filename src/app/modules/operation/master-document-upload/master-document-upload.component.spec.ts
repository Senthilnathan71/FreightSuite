import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasterDocumentUploadComponent } from './master-document-upload.component';

describe('MasterDocumentUploadComponent', () => {
  let component: MasterDocumentUploadComponent;
  let fixture: ComponentFixture<MasterDocumentUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasterDocumentUploadComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MasterDocumentUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
