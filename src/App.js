import React, { useState } from "react";
import "./App.css";

function App() {
  const [linkedinInfo, setLinkedinInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getLinkedInInfo = () => {
    setLoading(true);
    setError("");
    setLinkedinInfo({});

    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        let activeTab = tabs[0];

        chrome.scripting.executeScript(
          {
            target: { tabId: activeTab.id },
            function: extractLinkedInInfo, // Function to extract info from the page
          },
          (results) => {
            setLoading(false);

            if (chrome.runtime.lastError) {
              setError(
                "Failed to execute the script: " +
                  chrome.runtime.lastError.message
              );
            } else if (results && results[0] && results[0].result) {
              const result = results[0].result;
              if (result.emailAddress === "Not Available") {
                setError("Email not found in the Contact Info.");
              } else {
                setLinkedinInfo(result);
              }
            } else {
              setError("Could not extract LinkedIn data.");
            }
          }
        );
      });
    } else {
      setLoading(false);
      setError("Chrome API is not available.");
    }
  };

  const extractLinkedInInfo = () => {
    return new Promise((resolve) => {
      try {
        const contactInfoButton = document.querySelector(
          'a[href*="/overlay/contact-info/"]'
        );
        if (contactInfoButton) {
          contactInfoButton.click();

          setTimeout(() => {
            const emailElements = document.getElementsByClassName(
              "link-without-visited-state t-14"
            );
            let emailAddress = "Not Available";

            // Loop through the HTMLCollection for email
            for (let i = 0; i < emailElements.length; i++) {
              const emailHref = emailElements[i].getAttribute("href");
              if (emailHref && emailHref.startsWith("mailto:")) {
                emailAddress = emailHref.replace("mailto:", "");
                break; // Exit loop once we find the email
              }
            }

            // Extract name
            const name =
              document.querySelector("h1.text-heading-xlarge")?.innerText ||
              "Not Available";

            // Extract profile URL
            const profileUrl = window.location.href.split("/overlay/")[0];

            // Extract phone number
            let phoneNumber = "Not Available";
            const phoneSections = document.querySelectorAll(
              "section.pv-contact-info__contact-type"
            );
            phoneSections.forEach((section) => {
              const header = section.querySelector(
                "h3.pv-contact-info__header.t-16.t-black.t-bold"
              );
              if (header && header.innerText === "Phone") {
                const phoneListItem = section.querySelector(
                  "li.khljzSeNczhWRlKfgJcSYQgOltITKOTbvYRyk.t-14"
                );
                if (phoneListItem) {
                  phoneNumber =
                    phoneListItem
                      .querySelector("span.t-14.t-black.t-normal")
                      ?.innerText.trim() || "Not Available";
                }
              }
            });

            // Resolve with the extracted info
            resolve({ name, profileUrl, emailAddress, phoneNumber });
          }, 1000); // Adjust timeout if necessary
        } else {
          resolve({
            name: "Not Available",
            profileUrl: "Not Available",
            emailAddress: "Not Available",
            phoneNumber: "Not Available",
          });
        }
      } catch (error) {
        console.log("Error while extracting LinkedIn info:", error);
        resolve({ error: error.message });
      }
    });
  };

  return (
    <div className="App">
      <div className="App-header">
        <h1>LinkedIn Profile Info</h1>
        <button onClick={getLinkedInInfo} disabled={loading}>
          {loading ? "Loading..." : "Get LinkedIn Info"}
        </button>
        {loading && <p>Fetching LinkedIn data...</p>}

        {!loading && error && <p style={{ color: "red" }}>{error}</p>}

        {linkedinInfo.name && !loading && !error && (
          <div>
            <p>
              <strong>Name:</strong> {linkedinInfo.name}
            </p>
            <p>
              <strong>Profile URL:</strong> {linkedinInfo.profileUrl}
            </p>
            <p>
              <strong>Email Address:</strong> {linkedinInfo.emailAddress}
            </p>
            <p>
              <strong>Phone Number:</strong> {linkedinInfo.phoneNumber}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
