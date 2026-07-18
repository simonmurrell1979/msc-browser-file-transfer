import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DownloadComponent } from "./download.component";
import { ActivatedRoute } from "@angular/router";

describe("DownloadComponent", () => {
    let component: DownloadComponent;
    let fixture: ComponentFixture<DownloadComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DownloadComponent],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            paramMap: {
                                get: (key: string) => "test-guid"
                            }
                        }
                    }
                }
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(DownloadComponent);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
