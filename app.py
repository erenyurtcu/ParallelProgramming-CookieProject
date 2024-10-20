# Import necessary components from the Flask library.
# - Flask: Used to initialize the web application instance.
# - render_template: Used to render HTML templates and return them as web pages to the client.
# - request: Handles incoming HTTP requests and extracts data from submitted forms.
from flask import Flask, render_template, request

# Import data structures from the collections module.
# - defaultdict: A specialized dictionary that provides default values for missing keys.
#   It is useful for constructing graphs with lists as values.
# - deque: A double-ended queue that allows efficient insertion and deletion from both ends.
#   It will be used for processing steps in the topological sorting algorithm.
from collections import defaultdict, deque

# Initialize the Flask web application instance.
# The `app` object will be the core of the application, handling configuration and routing.
app = Flask(__name__)

class RecipeStep:
    """
    Represents a step in a recipe with key attributes:
    - name: A unique name for the step.
    - duration: Time required to complete the step (in minutes or another unit).
    - cpu_bound: Boolean flag indicating whether the step is CPU-intensive.
    - dependencies: List of other steps that must be completed before this one can start.

    :param str name: Name of the step.
    :param int duration: Duration of the step.
    :param bool cpu_bound: Whether this step is CPU-bound (True/False).
    :param list dependencies: Names of steps that must be completed first.
    """
    def __init__(self, name, duration, cpu_bound, dependencies):
        self.name = name  # Store the step name.
        self.duration = duration  # Store the duration.
        self.cpu_bound = cpu_bound  # Store whether it is CPU-bound.
        self.dependencies = dependencies or []  # Store the dependencies (default to an empty list).

def build_graph(steps):
    """
    Builds a graph and in-degree dictionary from the given steps.
    - The graph is a defaultdict where keys are step names, and values are lists of dependent steps.
    - The in-degree dictionary stores how many dependencies each step has.

    :param list steps: List of RecipeStep objects.
    :return: A tuple containing the graph and in-degree dictionary.
    :rtype: tuple(defaultdict, defaultdict)
    """
    graph = defaultdict(list)  # Adjacency list to represent the graph.
    in_degree = defaultdict(int)  # Dictionary to store the in-degrees of steps. (dependencies of step)

    # Loop through each step and its dependencies to populate the graph and in-degrees. (covering each step)
    for step in steps:
        for dependency in step.dependencies:
            graph[dependency].append(step.name)  # Add the step to the graph as a dependent.
            in_degree[step.name] += 1  # Increment the in-degree for the current step.

    return graph, in_degree  # Return the constructed graph and in-degree dictionary.

def sort_with_times(steps):
    """
    Performs a sort to determine the earliest start times for all steps.
    It also calculates the total time needed to complete all steps.

    :param list steps: List of RecipeStep objects.
    :return: A tuple containing the start times and total duration.
    :rtype: tuple(dict, int)
    """
    graph, in_degree = build_graph(steps)  # Build the graph and in-degree dictionary.

    # Initialize the queue with steps that have no dependencies (in-degree = 0).
    queue = deque([(step.name, 0) for step in steps if in_degree[step.name] == 0])

    start_times = {}  # Store the earliest start times for steps.
    durations = {step.name: step.duration for step in steps}  # Map step names to their durations.
    steps_dict = {step.name: step for step in steps}  # Map step names to their objects.
    end_times = defaultdict(int)  # Store the end times of steps.

    # Process the queue in topological order.
    while queue:
        current, start_time = queue.popleft()  # Dequeue the next step.
        start_times[current] = start_time  # Record the start time.
        end_times[current] = start_time + durations[current]  # Calculate and store the end time.

        # Process all steps dependent on the current step.
        for neighbor in graph[current]:
            in_degree[neighbor] -= 1  # Decrement the in-degree.
            if in_degree[neighbor] == 0:  # If no more dependencies, add to queue.
                next_start_time = max(end_times[dep] for dep in steps_dict[neighbor].dependencies)
                queue.append((neighbor, next_start_time))  # Enqueue the dependent step.

    # Assign default start times for any unprocessed steps.
    for step in steps:
        if step.name not in start_times:
            start_times[step.name] = 0

    # Calculate the total duration as the maximum end time.
    total_duration = max(end_times.values()) if end_times else 0

    return start_times, total_duration  # Return the start times and total duration.

@app.route("/", methods=["GET", "POST"])
def index():
    """
    Handles the main route ("/") of the web application.

    - GET: Renders the input form (index.html).
    - POST: Processes the form submission, validates the data, and calculates the schedule.

    :return: Either the input form or the schedule page with the results.
    :rtype: str
    """
    if request.method == "POST":
        try:
            steps = []  # List to store RecipeStep objects.
            step_count = len([key for key in request.form.keys() if key.startswith("name_")])

            if step_count == 0:  # Ensure at least one step is provided.
                return "Error: No steps provided.", 400

            # Extract data for each step from the form.
            for i in range(step_count):
                name = request.form.get(f"name_{i + 1}", "").strip()
                duration = request.form.get(f"duration_{i + 1}", "").strip()

                if not name:  # Validate name.
                    return f"Error: Step {i + 1} is missing a valid name.", 400
                if not duration.isdigit():  # Validate duration.
                    return f"Error: Step {i + 1} has an invalid duration value.", 400

                cpu_bound = request.form.get(f"cpu_bound_{i + 1}")
                if cpu_bound not in ["yes", "no"]:  # Validate CPU-bound flag.
                    return f"Error: Step {i + 1} is missing CPU-bound information.", 400

                dependencies = request.form.getlist(f"dependencies_{i + 1}")  # Get dependencies.
                steps.append(RecipeStep(name, int(duration), cpu_bound == "yes", dependencies))

            # Validate that all dependencies exist.
            step_names = {step.name for step in steps}
            for step in steps:
                for dep in step.dependencies:
                    if dep not in step_names:
                        return f"Error: Dependency '{dep}' does not exist.", 400

            # Calculate start times and total duration.
            start_times, total_duration = sort_with_times(steps)

            # Render the schedule template with the calculated data.
            return render_template("schedule.html", start_times = start_times, total_duration = total_duration)

        except Exception as e:  # Handle any unexpected errors.
            return f"An unexpected error occurred: {str(e)}", 500

    # Render the input form on GET requests.
    return render_template("index.html")

# Run the Flask application.
if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)  # Start the server in debug mode.
