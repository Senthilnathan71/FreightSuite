import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumnetGenerationEntryComponent } from './documnet-generation-entry.component';

describe('DocumnetGenerationEntryComponent', () => {
  let component: DocumnetGenerationEntryComponent;
  let fixture: ComponentFixture<DocumnetGenerationEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumnetGenerationEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DocumnetGenerationEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
