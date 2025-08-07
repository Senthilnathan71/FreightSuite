import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumnetGenerationListComponent } from './documnet-generation-list.component';

describe('DocumnetGenerationListComponent', () => {
  let component: DocumnetGenerationListComponent;
  let fixture: ComponentFixture<DocumnetGenerationListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumnetGenerationListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DocumnetGenerationListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
