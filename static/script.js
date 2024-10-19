document.addEventListener("DOMContentLoaded", function () {
    const stepsContainer = document.getElementById("steps-container");
    const addStepButton = document.getElementById("add-step");

    // Function to re-number all steps and manage dependency button states
    function renumberSteps() {
        const fieldsets = stepsContainer.querySelectorAll(".step-fieldset");
        fieldsets.forEach((fieldset, index) => {
            const legend = fieldset.querySelector("legend");
            legend.textContent = `Step ${index + 1}`;
            const addDependencyButton = fieldset.querySelector(".add-dependency");
            if (fieldsets.length > 1) {
                addDependencyButton.disabled = false;
            } else {
                addDependencyButton.disabled = true;
            }
        });

        // Allow removal only if more than one step
        fieldsets.forEach((fieldset) => {
            const removeButton = fieldset.querySelector(".remove-step");
            if (fieldsets.length > 1) {
                removeButton.disabled = false;
            } else {
                removeButton.disabled = true;
            }
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
                <button type="button" class="add-dependency btn btn-secondary" disabled>+ Add Dependency</button>
                <div class="dependencies-container mt-2"></div>
            </div>

            <button type="button" class="remove-step btn btn-danger">Remove</button>
        `;

        stepsContainer.appendChild(fieldset);

        // Add event listener to the remove button
        fieldset.querySelector(".remove-step").addEventListener("click", () => {
            stepsContainer.removeChild(fieldset);
            renumberSteps(); // Renumber remaining steps after removal
            updateDependencyOptions();
        });

        // Add event listener to the add dependency button
        fieldset.querySelector(".add-dependency").addEventListener("click", () => {
            addDependencyOptions(fieldset);
        });

        // Add event listener to update dependencies when step name changes
        const nameInput = fieldset.querySelector(`[id^="name_"]`);
        nameInput.addEventListener("input", updateDependencyOptions);

        renumberSteps(); // Renumber all steps after adding a new one
    }

    // Function to add dependency options to a step
    function addDependencyOptions(fieldset) {
        const dependenciesContainer = fieldset.querySelector(".dependencies-container");
        const stepId = Array.from(stepsContainer.children).indexOf(fieldset) + 1;
        const availableSteps = Array.from(stepsContainer.children).filter((_, index) => index + 1 !== stepId);
        const maxDependencies = availableSteps.length;

        if (dependenciesContainer.querySelectorAll("select").length >= maxDependencies) {
            alert("All possible dependencies have been selected.");
            return; // Maximum number of dependencies reached
        }

        const dependencyDiv = document.createElement("div");
        dependencyDiv.classList.add("dependency-item", "d-flex", "align-items-center", "mb-2");

        const select = document.createElement("select");
        select.classList.add("form-select", "me-2");
        select.required = true;
        select.name = `dependencies_${stepId}`;

        // Create a default option
        const defaultOption = document.createElement("option");
        defaultOption.textContent = "Select a step";
        defaultOption.disabled = true;
        defaultOption.selected = true;
        select.appendChild(defaultOption);

        // Add other steps as options, filtering out already selected dependencies
        const selectedValues = Array.from(dependenciesContainer.querySelectorAll("select")).map(s => s.value);
        availableSteps.forEach((availableStep) => {
            const stepNameInput = availableStep.querySelector(`[id^="name_"]`).value;
            if (stepNameInput && !selectedValues.includes(stepNameInput)) {
                const option = document.createElement("option");
                option.value = stepNameInput;
                option.textContent = stepNameInput;
                select.appendChild(option);
            }
        });

        // Append select to dependency div
        dependencyDiv.appendChild(select);

        // Add remove button for dependency
        const removeDependencyButton = document.createElement("button");
        removeDependencyButton.type = "button";
        removeDependencyButton.classList.add("btn", "btn-danger", "btn-sm");
        removeDependencyButton.textContent = "Remove";
        removeDependencyButton.addEventListener("click", () => {
            dependenciesContainer.removeChild(dependencyDiv);
            updateDependencyOptions();
        });

        // Append remove button to dependency div
        dependencyDiv.appendChild(removeDependencyButton);

        // Append dependency div to dependencies container
        dependenciesContainer.appendChild(dependencyDiv);

        updateDependencyOptions();

        // Add event listener to remove selected options from future selections
        select.addEventListener("change", updateDependencyOptions);
    }

    // Function to update dependency options across all selects dynamically
    function updateDependencyOptions() {
        const allDependencies = Array.from(stepsContainer.querySelectorAll(".dependencies-container select"));
        const selectedValues = allDependencies.map(s => s.value);
        const allSteps = Array.from(stepsContainer.children);

        allDependencies.forEach(select => {
            const currentValue = select.value;
            const fieldset = select.closest(".step-fieldset");
            const stepId = Array.from(stepsContainer.children).indexOf(fieldset) + 1;
            const availableSteps = allSteps.filter((_, index) => index + 1 !== stepId);

            // Clear existing options except for the default
            select.innerHTML = "";

            // Create a default option
            const defaultOption = document.createElement("option");
            defaultOption.textContent = "Select a step";
            defaultOption.disabled = true;
            defaultOption.selected = true;
            select.appendChild(defaultOption);

            // Add updated steps as options
            availableSteps.forEach((availableStep) => {
                const stepNameInput = availableStep.querySelector(`[id^="name_"]`).value;
                const option = document.createElement("option");
                option.value = stepNameInput;
                option.textContent = stepNameInput;
                if (stepNameInput === currentValue) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        });
    }

    // Event listener for the "+ Add Step" button
    addStepButton.addEventListener("click", createStep);

    // Create the first step on page load
    createStep();
});