import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SendComponent } from './send.component';

describe('SendComponent', () => {
    let component: SendComponent;
    let fixture: ComponentFixture<SendComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SendComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(SendComponent);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
