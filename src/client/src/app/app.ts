import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { HeaderComponent } from "./layout/header/header.component";
import { FooterComponent } from "./layout/footer/footer.component";

@Component({
    selector: "app-root",
    imports: [RouterOutlet, HeaderComponent, FooterComponent],
    templateUrl: "./app.html",
    styleUrls: ["./app.scss"],
})
export class App {

    ngOnInit() {

        // Assign Value
        const backgroundImageNumber = Math.floor(Math.random() * 5) + 1;
        // Assign Background Image
        document.body.style.backgroundImage = `url("/images/backgrounds/background${backgroundImageNumber}.jpg")`;

    }

}
