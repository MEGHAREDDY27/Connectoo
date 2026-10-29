import java.net.MalformedURLException;
import java.net.URL;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.remote.RemoteWebDriver;

import static org.junit.jupiter.api.Assertions.assertTrue;

class UiTest {
    private WebDriver driver;

    @Test
    void homePageTitleContainsConnectoo() throws MalformedURLException {
        String remoteUrl = System.getenv().getOrDefault(
                "SELENIUM_REMOTE_URL", "http://localhost:4444/wd/hub");
        driver = new RemoteWebDriver(new URL(remoteUrl), new ChromeOptions());
        driver.get("http://app:3000");

        assertTrue(driver.getTitle().contains("Connectoo"),
                () -> "Expected page title to contain Connectoo, got: " + driver.getTitle());
    }

    @AfterEach
    void closeDriver() {
        if (driver != null) {
            driver.quit();
        }
    }
}
