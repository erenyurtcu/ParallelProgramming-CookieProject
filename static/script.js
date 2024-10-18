document.addEventListener("DOMContentLoaded", function () {
    const stepsContainer = document.getElementById("steps-container");
    const addStepButton = document.getElementById("add-step");

    // Function to re-number all steps
    function renumberSteps() {
        const fieldsets = stepsContainer.querySelectorAll(".step-fieldset");
        fieldsets.forEach((fieldset, index) => {
            const legend = fieldset.querySelector("legend");
            legend.textContent = `Step ${index + 1}`;
        });
    }

    // Function to create a new step
    function createStep() {
        const stepId = stepsContainer.children.length + 1; // New step number based on current length
        const fieldset = document.createElement("fieldset");
        fieldset.classList.add("step-fieldset");

        fieldset.innerHTML = `
            <legend>Step ${stepId}</legend>

            <div class="mb-3">
                <label for="name_${stepId}" class="form-label">Name</label>
                <input type="text" id="name_${stepId}" name="name_${stepId}" class="form-control" required>
            </div>

            <div class="mb-3">
                <label for="duration_${stepId}" class="form-label">Duration (minutes)</label>
                <input type="number" id="duration_${stepId}" name="duration_${stepId}" class="form-control" min="1" required>
            </div>

            <div class="mb-3">
                <label class="form-label">CPU-bound</label><br>
                <input type="radio" id="cpu_bound_${stepId}_yes" name="cpu_bound_${stepId}" value="yes" required>
                <label for="cpu_bound_${stepId}_yes">Yes</label>
                <input type="radio" id="cpu_bound_${stepId}_no" name="cpu_bound_${stepId}" value="no" required>
                <label for="cpu_bound_${stepId}_no">No</label>
            </div>

            <div class="mb-3">
                <label for="dependencies_${stepId}" class="form-label">Dependencies (semicolon-separated)</label>
                <input type="text" id="dependencies_${stepId}" name="dependencies_${stepId}" class="form-control">
            </div>

            ${stepId > 1 ? `<button type="button" class="remove-step btn btn-danger">Remove</button>` : ""}
        `;

        stepsContainer.appendChild(fieldset);

        // Add event listener to the remove button (if available)
        if (stepId > 1) {
            fieldset.querySelector(".remove-step").addEventListener("click", () => {
                stepsContainer.removeChild(fieldset);
                renumberSteps(); // Renumber remaining steps after removal
            });
        }

        renumberSteps(); // Renumber all steps after adding a new one
    }

    // Event listener for the "+ Add Step" button
    addStepButton.addEventListener("click", createStep);

    // Create the first step on page load
    createStep();
});
