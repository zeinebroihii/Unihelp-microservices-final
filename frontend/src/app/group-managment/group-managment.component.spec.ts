import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupManagmentComponent } from './group-managment.component';

describe('GroupManagmentComponent', () => {
  let component: GroupManagmentComponent;
  let fixture: ComponentFixture<GroupManagmentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GroupManagmentComponent]
    });
    fixture = TestBed.createComponent(GroupManagmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
