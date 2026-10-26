
const form = document.getElementById("repoForm");
const input = document.getElementById("repoUrl");
const message = document.getElementById("message");
const resultBox = document.getElementById("result");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const repoUrl = input.value.trim();

    if (!repoUrl) {
        message.textContent = "Please enter a repository URL.";
        return;
    }

    message.textContent = "Analyzing repository...";
    resultBox.textContent = "";

    const button = form.querySelector("button");
    button.disabled = true;

    try {
        const response = await fetch(
            "http://localhost:8000/api/v1/repos/analyze",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ repoUrl })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Analysis failed");
        }

        message.textContent = "Repository analyzed successfully!";

        resultBox.textContent = JSON.stringify(result.data, null, 2);

        console.log(result.data);

    } catch (error) {
        message.textContent = error.message;
        console.error("API Error:", error);

    } finally {
        button.disabled = false;
    }
});
