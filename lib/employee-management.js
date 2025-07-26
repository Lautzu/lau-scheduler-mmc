// Employee Management Module
// Following CLAUDE.md best practices for modular code organization

// ==================== Employee Management ==================== //

function showEmployeeModal() {
  renderEmployeeSelectOptions();
  clearEmployeeForm();
  document.getElementById("employeeModal").style.display = "block";
}

function closeEmployeeModal() {
  document.getElementById("employeeModal").style.display = "none";
}

function renderEmployeeSelectOptions() {
  const select = document.getElementById("employeeSelect");
  select.innerHTML = '<option value="">➕ Add New Employee</option>';
  appState.employees.forEach((emp) => {
    const option = document.createElement("option");
    option.value = emp.id;
    option.textContent = `${emp.name} (${emp.role})`;
    select.appendChild(option);
  });
}

function clearEmployeeForm() {
  document.getElementById("employeeName").value = "";
  document.getElementById("employeeRole").value = "Senior-on-Duty";
  document.getElementById("employeeCanSeniorDuty").checked = false;
}

function populateEmployeeFields() {
  const empId = document.getElementById("employeeSelect").value;
  if (!empId) {
    clearEmployeeForm();
    return;
  }
  const emp = appState.employees.find((e) => e.id == empId);
  if (emp) {
    document.getElementById("employeeName").value = emp.name;
    document.getElementById("employeeRole").value = emp.role;
    document.getElementById("employeeCanSeniorDuty").checked =
      emp.canSeniorDuty;
  }
}

function saveEmployee() {
  const empData = getEmployeeFormData();

  if (!validateEmployeeData(empData)) return;

  if (!empData.id) {
    addNewEmployee(empData);
  } else {
    updateExistingEmployee(empData);
  }

  saveEmployees();
  refreshUIAfterEmployeeChange();
}

function getEmployeeFormData() {
  return {
    id: document.getElementById("employeeSelect").value,
    name: document.getElementById("employeeName").value.trim(),
    role: document.getElementById("employeeRole").value,
    canSeniorDuty: document.getElementById("employeeCanSeniorDuty").checked,
  };
}

function validateEmployeeData(empData) {
  // Validate name using InputValidator
  const nameValidation = InputValidator.validateEmployeeName(empData.name);
  if (!nameValidation.isValid) {
    ErrorHandler.displayValidationError(nameValidation.error, "employeeName");
    return false;
  }

  // Validate role using InputValidator
  const roleValidation = InputValidator.validateEmployeeRole(empData.role);
  if (!roleValidation.isValid) {
    ErrorHandler.displayValidationError(roleValidation.error, "employeeRole");
    return false;
  }

  // Check for duplicate names
  const isDuplicate = appState.employees.some(
    (emp) => emp.name === nameValidation.value && emp.id != empData.id,
  );

  if (isDuplicate) {
    ErrorHandler.displayValidationError(
      "An employee with this name already exists",
      "employeeName",
    );
    return false;
  }

  return true;
}

function addNewEmployee(empData) {
  const newId = generateNewEmployeeId();
  const newEmp = {
    id: newId,
    name: empData.name,
    role: empData.role,
    tenure: newId,
    canSeniorDuty: empData.canSeniorDuty,
  };
  appState.employees.push(newEmp);
  addEmployeeToSchedule(newId);
  showAlert("Employee added successfully", "success");
}

function updateExistingEmployee(empData) {
  const emp = appState.employees.find((e) => e.id == empData.id);
  if (emp) {
    emp.name = empData.name;
    emp.role = empData.role;
    emp.canSeniorDuty = empData.canSeniorDuty;
    showAlert("Employee updated successfully", "success");
  }
}

function generateNewEmployeeId() {
  return appState.employees.length
    ? Math.max(...appState.employees.map((e) => e.id)) + 1
    : 1;
}

function deleteEmployee() {
  const empId = document.getElementById("employeeSelect").value;
  if (!empId) {
    showAlert("Please select an employee to delete", "error");
    return;
  }

  if (!confirmEmployeeDeletion()) return;

  const idNum = parseInt(empId);
  removeEmployeeFromSystem(idNum);
  refreshUIAfterEmployeeChange();
  clearEmployeeForm();
  showAlert("Employee deleted successfully", "success");
}

function confirmEmployeeDeletion() {
  const empName = appState.employees.find(
    (e) => e.id == document.getElementById("employeeSelect").value,
  ).name;
  return confirm(
    `Are you sure you want to delete ${empName}? This action cannot be undone.`,
  );
}

function removeEmployeeFromSystem(empId) {
  appState.employees = appState.employees.filter((e) => e.id !== empId);
  removeEmployeeFromSchedule(empId);
  delete appState.leaveRequests[empId];
}

function addEmployeeToSchedule(empId) {
  Object.keys(appState.schedule).forEach((date) => {
    appState.schedule[date][empId] = "off";
  });
}

function removeEmployeeFromSchedule(empId) {
  Object.keys(appState.schedule).forEach((date) => {
    delete appState.schedule[date][empId];
  });
}

function refreshUIAfterEmployeeChange() {
  saveEmployees();
  populateLeaveEmployeeSelect();
  renderSchedule();
  updateStatistics();
  validateSchedule();
  renderEmployeeSelectOptions();
}
