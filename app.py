from flask import Flask, render_template, request
from collections import defaultdict, deque

app = Flask(__name__)

class RecipeStep:
    def __init__(self, name, duration, cpu_bound, dependencies=None):
        self.name = name
        self.duration = duration
        self.cpu_bound = cpu_bound
        self.dependencies = dependencies or []

def build_graph(steps):
    graph = defaultdict(list)
    in_degree = defaultdict(int)

    for step in steps:
        for dependency in step.dependencies:
            graph[dependency].append(step.name)
            in_degree[step.name] += 1

    return graph, in_degree

def topological_sort_with_times(steps):
    graph, in_degree = build_graph(steps)
    queue = deque([(step.name, 0) for step in steps if in_degree[step.name] == 0])

    start_times = {}
    durations = {step.name: step.duration for step in steps}
    steps_dict = {step.name: step for step in steps}
    end_times = defaultdict(int)

    while queue:
        current, start_time = queue.popleft()
        start_times[current] = start_time
        end_times[current] = start_time + durations[current]

        for neighbor in graph[current]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                next_start_time = max(end_times[dep] for dep in steps_dict[neighbor].dependencies)
                queue.append((neighbor, next_start_time))

    return start_times, max(end_times.values())

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        try:
            steps = []
            # Calculate the total number of steps based on fieldsets
            step_count = len([key for key in request.form.keys() if key.startswith("name_")])

            # Iterate over each step submitted in the form
            for i in range(step_count):
                name = request.form.get(f"name_{i + 1}", "").strip()
                duration = request.form.get(f"duration_{i + 1}", "").strip()

                # Validate name and duration
                if not name:
                    return f"Error: Step {i + 1} is missing a valid name.", 400
                if not duration.isdigit():
                    return f"Error: Step {i + 1} has an invalid duration value.", 400

                cpu_bound = request.form.get(f"cpu_bound_{i + 1}") == "yes"
                dependencies = request.form.get(f"dependencies_{i + 1}", "").split(";")
                dependencies = [dep.strip() for dep in dependencies if dep.strip()]

                steps.append(RecipeStep(name, int(duration), cpu_bound, dependencies))

            start_times, total_duration = topological_sort_with_times(steps)
            return render_template("schedule.html", start_times=start_times, total_duration=total_duration)

        except Exception as e:
            return f"An unexpected error occurred: {str(e)}", 500

    return render_template("index.html")


if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)
