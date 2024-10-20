document.addEventListener("DOMContentLoaded", function () {
    const stepsContainer = document.getElementById("steps-container");
    const addStepButton = document.getElementById("add-step");

    function renumberSteps() {
        const fieldsets = stepsContainer.querySelectorAll(".step-fieldset");
        fieldsets.forEach((fieldset, index) => {
            const legend = fieldset.querySelector("legend");
            legend.textContent = `Step ${index + 1}`;
            const addDependencyButton = fieldset.querySelector(".add-dependency");
            addDependencyButton.disabled = fieldsets.length <= 1;
        });

        fieldsets.forEach((fieldset) => {
            const removeButton = fieldset.querySelector(".remove-step");
            removeButton.disabled = fieldsets.length <= 1;
        });
    }

    function createStep() {
        const stepId = stepsContainer.children.length + 1;
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
                <label class="form-label">Chef's Attention</label>
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="cpu_bound_${stepId}" name="cpu_bound_${stepId}" value="yes">
                    <label class="form-check-label" for="cpu_bound_${stepId}">Not Required</label>
                </div>
            </div>

            <div class="mb-3">
                <button type="button" class="add-dependency btn btn-secondary" disabled>+ Add Dependency</button>
                <div class="dependencies-container mt-2"></div>
            </div>

            <button type="button" class="remove-step btn btn-danger">Remove</button>
        `;

        stepsContainer.appendChild(fieldset);

        const cpuBoundSwitch = fieldset.querySelector(`#cpu_bound_${stepId}`);
        const label = fieldset.querySelector(`label[for="cpu_bound_${stepId}"]`);

        // Switch durumuna göre label metnini günceller
        cpuBoundSwitch.addEventListener("change", () => {
            label.textContent = cpuBoundSwitch.checked ? "Required" : "Not Required";
        });

        fieldset.querySelector(".remove-step").addEventListener("click", () => {
            stepsContainer.removeChild(fieldset);
            renumberSteps();
            updateDependencyOptions();
        });

        fieldset.querySelector(".add-dependency").addEventListener("click", () => {
            addDependencyOptions(fieldset);
        });

        const nameInput = fieldset.querySelector(`[id^="name_"]`);
        nameInput.addEventListener("input", updateDependencyOptions);

        renumberSteps();
    }

    function addDependencyOptions(fieldset) {
        const dependenciesContainer = fieldset.querySelector(".dependencies-container");
        const stepId = Array.from(stepsContainer.children).indexOf(fieldset) + 1;
        const availableSteps = Array.from(stepsContainer.children).filter((_, index) => index + 1 !== stepId);
        const maxDependencies = availableSteps.length;

        if (dependenciesContainer.querySelectorAll("select").length >= maxDependencies) {
            alert("All possible dependencies have been selected.");
            return;
        }

        const dependencyDiv = document.createElement("div");
        dependencyDiv.classList.add("dependency-item", "d-flex", "align-items-center", "mb-2");

        const select = document.createElement("select");
        select.classList.add("form-select", "me-2");
        select.required = true;
        select.name = `dependencies_${stepId}`;

        const defaultOption = document.createElement("option");
        defaultOption.textContent = "Select a step";
        defaultOption.disabled = true;
        defaultOption.selected = true;
        select.appendChild(defaultOption);

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

        dependencyDiv.appendChild(select);

        const removeDependencyButton = document.createElement("button");
        removeDependencyButton.type = "button";
        removeDependencyButton.classList.add("btn", "btn-danger", "btn-sm");
        removeDependencyButton.textContent = "Remove";
        removeDependencyButton.addEventListener("click", () => {
            dependenciesContainer.removeChild(dependencyDiv);
            updateDependencyOptions();
        });

        dependencyDiv.appendChild(removeDependencyButton);
        dependenciesContainer.appendChild(dependencyDiv);

        updateDependencyOptions();
        select.addEventListener("change", updateDependencyOptions);
    }

    function updateDependencyOptions() {
        const allDependencies = Array.from(stepsContainer.querySelectorAll(".dependencies-container select"));
        const selectedValues = allDependencies.map(s => s.value);
        const allSteps = Array.from(stepsContainer.children);

        allDependencies.forEach(select => {
            const currentValue = select.value;
            const fieldset = select.closest(".step-fieldset");
            const stepId = Array.from(stepsContainer.children).indexOf(fieldset) + 1;
            const availableSteps = allSteps.filter((_, index) => index + 1 !== stepId);

            select.innerHTML = "";

            const defaultOption = document.createElement("option");
            defaultOption.textContent = "Select a step";
            defaultOption.disabled = true;
            defaultOption.selected = true;
            select.appendChild(defaultOption);

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

    // Form submit edilirken CPU-bound işaretli değilse "no" gönder
    const form = document.querySelector("form");
    form.addEventListener("submit", function () {
        const steps = stepsContainer.querySelectorAll(".step-fieldset");
        steps.forEach((step, index) => {
            const cpuBoundInput = step.querySelector(`#cpu_bound_${index + 1}`);
            if (!cpuBoundInput.checked) {
                const hiddenInput = document.createElement("input");
                hiddenInput.type = "hidden";
                hiddenInput.name = `cpu_bound_${index + 1}`;
                hiddenInput.value = "no";
                form.appendChild(hiddenInput);
            }
        });
    });

    addStepButton.addEventListener("click", createStep);
    createStep();
});
