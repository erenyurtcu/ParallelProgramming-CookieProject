import pytest
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_index_page(client):
    """
    Test if the index page loads successfully.
    """
    try:
        response = client.get('/')
        assert response.status_code == 200
        assert b'Recipe Planner' in response.data
    except Exception as e:
        pytest.fail(f"Index page test failed: {e}")

def test_valid_form_submission(client):
    """
    Test if the form submission works properly with valid data.
    """
    form_data = {
        'name_1': 'Step 1',
        'duration_1': '10',
        'cpu_bound_1': 'yes',
        'name_2': 'Step 2',
        'duration_2': '5',
        'cpu_bound_2': 'no',
        'dependencies_2': 'Step 1',
    }
    try:
        response = client.post('/', data=form_data)
        assert response.status_code == 200
        assert b'Recipe Schedule' in response.data
        assert b'Step 1' in response.data
        assert b'Step 2' in response.data
        assert b'Total Duration:' in response.data
    except Exception as e:
        pytest.fail(f"Valid form submission test failed: {e}")

def test_missing_name(client):
    """
    Test if the form submission returns an error for missing step name.
    """
    form_data = {
        'name_1': '',  # Missing name for step 1
        'duration_1': '10',
        'cpu_bound_1': 'yes'
    }
    try:
        response = client.post('/', data=form_data)
        assert response.status_code == 400
        assert b'Error: Step 1 is missing a valid name.' in response.data
    except Exception as e:
        pytest.fail(f"Missing name test failed: {e}")

def test_invalid_duration(client):
    """
    Test if the form submission returns an error for an invalid duration value.
    """
    form_data = {
        'name_1': 'Step 1',
        'duration_1': 'invalid_duration',  # Invalid duration
        'cpu_bound_1': 'yes'
    }
    try:
        response = client.post('/', data=form_data)
        assert response.status_code == 400
        assert b'Error: Step 1 has an invalid duration value.' in response.data
    except Exception as e:
        pytest.fail(f"Invalid duration test failed: {e}")

def test_empty_form_submission(client):
    """
    Test if submitting an empty form returns an error.
    """
    form_data = {}
    try:
        response = client.post('/', data=form_data)
        assert response.status_code == 400 or b'Error: No steps provided' in response.data
    except Exception as e:
        pytest.fail(f"Empty form submission test failed: {e}")

def test_invalid_dependency(client):
    """
    Test if the form submission handles a dependency that does not exist.
    """
    form_data = {
        'name_1': 'Step 1',
        'duration_1': '10',
        'cpu_bound_1': 'yes',
        'name_2': 'Step 2',
        'duration_2': '5',
        'cpu_bound_2': 'no',
        'dependencies_2': 'NonExistentStep'  # Invalid dependency
    }
    try:
        response = client.post('/', data=form_data)
        assert response.status_code == 400 or b"Error: Dependency 'NonExistentStep' does not exist." in response.data
    except Exception as e:
        pytest.fail(f"Invalid dependency test failed: {e}")

def test_no_cpu_bound_selection(client):
    """
    Test if the form submission returns an error if cpu_bound is not selected.
    """
    form_data = {
        'name_1': 'Step 1',
        'duration_1': '10'
    }
    try:
        response = client.post('/', data=form_data)
        assert response.status_code == 400 or b'Error: Step 1 is missing CPU-bound information.' in response.data
    except Exception as e:
        pytest.fail(f"No CPU-bound selection test failed: {e}")
