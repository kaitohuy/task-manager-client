import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeetingDetailPanelComponent } from './meeting-detail-panel.component';

describe('MeetingDetailPanelComponent', () => {
  let component: MeetingDetailPanelComponent;
  let fixture: ComponentFixture<MeetingDetailPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeetingDetailPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MeetingDetailPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
