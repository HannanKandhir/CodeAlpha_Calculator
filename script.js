
const display = document.getElementById("display");

let firstNumber = null;
let selectedOperator = null;
let startNewNumber = false;

// Show a number on the calculator display
function appendValue(value) {

    // Handle mathematical operators
    if (["+", "-", "*", "/"].includes(value)) {
        selectOperator(value);
        return;
    }

    // Start fresh after an operator or result
    if (startNewNumber || display.value === "Error") {
        display.value = "0";
        startNewNumber = false;
    }

    // Prevent multiple decimal points
    if (value === "." && display.value.includes(".")) {
        return;
    }

    // Add the new digit
    if (display.value === "0" && value !== ".") {
        display.value = value;
    } else {
        display.value += value;
    }
}

// Select addition, subtraction, etc.
function selectOperator(operator) {

    if (display.value === "Error") return;

    if (selectedOperator !== null && !startNewNumber) {
        calculate();
    }

    if (display.value === "Error") return;

    firstNumber = Number(display.value);
    selectedOperator = operator;
    startNewNumber = true;
}

// Perform the calculation
function calculate() {

    if (firstNumber === null ||
        selectedOperator === null ||
        startNewNumber) {
        return;
    }

    const secondNumber = Number(display.value);
    let result;

    switch (selectedOperator) {
        case "+":
            result = firstNumber + secondNumber;
            break;

        case "-":
            result = firstNumber - secondNumber;
            break;

        case "*":
            result = firstNumber * secondNumber;
            break;

        case "/":
            result = secondNumber === 0
                ? NaN
                : firstNumber / secondNumber;
            break;
    }

    // Handle errors and round long decimals
    if (!Number.isFinite(result)) {
        display.value = "Error";
    } else {
        display.value = String(
            Number(result.toPrecision(12))
        );
    }

    firstNumber = null;
    selectedOperator = null;
    startNewNumber = true;
}

// Clear the calculator
function clearDisplay() {
    display.value = "0";
    firstNumber = null;
    selectedOperator = null;
    startNewNumber = false;
}

// Delete the last digit
function deleteLast() {

    if (startNewNumber || display.value === "Error") {
        display.value = "0";
        startNewNumber = false;
        return;
    }

    if (display.value.length <= 1 ||
        (display.value.length === 2 &&
         display.value.startsWith("-"))) {
        display.value = "0";
    } else {
        display.value = display.value.slice(0, -1);
    }
}

// Support computer keyboard controls
document.addEventListener("keydown", function(event) {

    const key = event.key;

    if (/^[0-9.]$/.test(key)) {
        appendValue(key);
    }

    else if (["+", "-", "*", "/"].includes(key)) {
        appendValue(key);
    }

    else if (key === "Enter" || key === "=") {
        event.preventDefault();
        calculate();
    }

    else if (key === "Backspace") {
        deleteLast();
    }

    else if (key === "Escape") {
        clearDisplay();
    }
});
