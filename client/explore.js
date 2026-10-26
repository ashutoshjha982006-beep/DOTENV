
const form = document.getElementById("repoForm");
const input = document.getElementById("repoUrl");
const message = document.getElementById("message");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const repoUrl = input.value.trim();

    message.textContent = "Analyzing...";

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

        message.textContent = "Analysis successful!";
        console.log(result.data);

    } catch (error) {
        message.textContent = error.message;
        console.error(error);
    }
});
