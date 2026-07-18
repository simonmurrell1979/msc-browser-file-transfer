import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SendComponent } from './send.component';
import { DbService } from "../../services/db.service";
import { ServiceWorkerCommsService } from "../../services/serviceworkercomms.service";

describe('SendComponent', () => {
    let component: SendComponent;
    let fixture: ComponentFixture<SendComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SendComponent],
            providers: [
                {
                    provide: DbService,
                    useValue: {
                        findLatestUpload: () => Promise.resolve(null)
                    }
                },
                {
                    provide: ServiceWorkerCommsService,
                    useValue: {
                        setMessageHandler: () => {},
                        sendMessage: () => Promise.resolve()
                    }
                }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(SendComponent);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
