import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostMasterListComponent } from './post-master-list.component';

describe('PostMasterListComponent', () => {
  let component: PostMasterListComponent;
  let fixture: ComponentFixture<PostMasterListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostMasterListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PostMasterListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
