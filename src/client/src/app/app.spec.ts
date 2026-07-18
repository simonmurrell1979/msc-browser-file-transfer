import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [App],
        }).compileComponents();
    });

    it('should create the app', () => {
        const fixture = TestBed.createComponent(App);
        const app = fixture.componentInstance;
        expect(app).toBeTruthy();
    });

    it("should have a background set in the body", () => {

        // Set fixture
        const fixture = TestBed.createComponent(App);
        // Trigger change detection
        fixture.detectChanges();
        // Get background image
        const backgroundImage = document.body.style.backgroundImage;
        // Check that the background image is not empty / contains partial path
        expect(backgroundImage).not.toBe("");
        expect(backgroundImage).toContain("/images/backgrounds/background");

    });

});
