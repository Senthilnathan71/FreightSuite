import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocReferenceComponent } from './doc-reference.component';


describe('DocReferenceComponent', () => {
  let component: DocReferenceComponent;
  let fixture: ComponentFixture<DocReferenceComponent>;


  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocReferenceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DocReferenceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('should create', () => {
    expect(component).toBeTruthy();
  });
});                       

