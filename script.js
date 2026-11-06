
"use strict";

// =====================================
// NOVACALC - JAVASCRIPT
// Developed by Abdul Hannan Kandhir
// CodeAlpha Frontend Internship
// =====================================

// HTML ELEMENTS

const display = document.getElementById("display");
const expression = document.getElementById("expression");
const keypad = document.getElementById("keypad");
const historyList = document.getElementById("historyList");
const historyCount = document.getElementById("historyCount");
const clearHistoryButton = document.getElementById("clearHistory");
const themeToggle = document.getElementById("themeToggle");
const themeLabel = document.getElementById("themeLabel");
const toast = document.getElementById("toast");

// SETTINGS

const HISTORY_KEY = "novacalc_history_v1";
const THEME_KEY = "novacalc_theme_v1";
const MAX_HISTORY = 20;

// CALCULATOR STATE

let current = "0";
let previous = null;
let operator = null;
let startFresh = false;
let expressionText = "Ready to calculate";
let history = readHistory();
let toastTimer;

// =====================================
// LOCAL STORAGE
// =====================================

function store(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (error) {
        // Storage might be unavailable
    }
}

function load(key) {
    try {
        return localStorage.getItem(key);
    } catch (error) {
        return null;
    }
}

function readHistory() {
    try {
        const data = JSON.parse(load(HISTORY_KEY) || "[]");

        if (!Array.isArray(data)) {
            return [];
        }

        return data.filter(item =>
            item &&
            typeof item.equation === "string" &&
            typeof item.result === "string" &&
            Number.isFinite(Number(item.result))
        ).slice(0, MAX_HISTORY);

    } catch (error) {
        return [];
    }
}

// =====================================
// NUMBER FORMATTING
// =====================================

function prettyOperator(op) {
    const symbols = {
        "+": "+",
        "-": "−",
        "*": "×",
        "/": "÷"
    };

    return symbols[op] || op;
}

function formatNumber(raw) {
    if (raw === "Error") {
        return "Error";
    }

    if (!/^-?\d*\.?\d*(?:e[+-]?\d+)?$/i.test(raw)) {
        return raw;
    }

    if (/e/i.test(raw)) {
        return raw;
    }

    const negative = raw.startsWith("-") ? "−" : "";

    const unsigned = raw.startsWith("-")
        ? raw.slice(1)
        : raw;

    const parts = unsigned.split(".");

    const whole = parts[0].replace(
        /\B(?=(\d{3})+(?!\d))/g,
        ","
    );

    return negative + whole +
        (parts.length > 1 ? "." + parts[1] : "");
}

// =====================================
// UPDATE DISPLAY
// =====================================

function render() {
    display.textContent = formatNumber(current);
    expression.textContent = expressionText;
}

// =====================================
// NOTIFICATIONS
// =====================================

function notify(message) {
    toast.textContent = message;
    toast.classList.add("visible");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("visible");
    }, 2000);
}

// =====================================
// CLEAR CALCULATOR
// =====================================

function clearAll() {
    current = "0";
    previous = null;
    operator = null;
    startFresh = false;
    expressionText = "Ready to calculate";

    render();
}

// =====================================
// NUMBER INPUT
// =====================================

function inputDigit(digit) {
    if (current === "Error" || startFresh) {
        current = digit;
        startFresh = false;
    }

    else if (current === "0") {
        current = digit;
    }

    else if (current === "-0") {
        current = digit === "0"
            ? "-0"
            : "-" + digit;
    }

    else if (current.replace(/[^0-9]/g, "").length < 14) {
        current += digit;
    }

    render();
}

// =====================================
// DECIMAL INPUT
// =====================================

function inputDecimal() {
    if (current === "Error" || startFresh) {
        current = "0.";
        startFresh = false;
    }

    else if (
        !current.includes(".") &&
        !current.toLowerCase().includes("e")
    ) {
        current += ".";
    }

    render();
}

// =====================================
// POSITIVE AND NEGATIVE NUMBERS
// =====================================

function toggleSign() {
    if (current === "Error") {
        return;
    }

    if (startFresh) {
        startFresh = false;
    }

    current = current.startsWith("-")
        ? current.slice(1)
        : "-" + current;

    render();
}

// =====================================
// PERCENTAGE
// =====================================

function percentage() {
    if (current === "Error") {
        return;
    }

    current = normalize(Number(current) / 100);
    startFresh = false;

    render();
}

// =====================================
// DELETE LAST DIGIT
// =====================================

function backspace() {
    if (current === "Error" || startFresh) {
        current = "0";
        startFresh = false;
    }

    else if (
        current.length <= 1 ||
        (current.length === 2 && current.startsWith("-"))
    ) {
        current = "0";
    }

    else {
        current = current.slice(0, -1);
    }

    render();
}

// =====================================
// PRECISION HANDLING
// =====================================

function normalize(number) {
    if (!Number.isFinite(number)) {
        return "Error";
    }

    return String(Number(number.toPrecision(12)));
}

// =====================================
// MATHEMATICAL OPERATIONS
// =====================================

function operate(a, b, op) {
    switch (op) {
        case "+":
            return a + b;

        case "-":
            return a - b;

        case "*":
            return a * b;

        case "/":
            return b === 0 ? NaN : a / b;

        default:
            return b;
    }
}

// =====================================
// SELECT OPERATOR
// =====================================

function selectOperator(nextOperator) {
    if (current === "Error") {
        return;
    }

    if (
        operator !== null &&
        previous !== null &&
        !startFresh
    ) {
        const combined = normalize(
            operate(previous, Number(current), operator)
        );

        current = combined;

        if (combined === "Error") {
            expressionText = "Cannot divide by zero";
            previous = null;
            operator = null;
            startFresh = true;
            render();
            return;
        }
    }

    previous = Number(current);
    operator = nextOperator;

    expressionText =
        `${formatNumber(current)} ${prettyOperator(operator)}`;

    startFresh = true;

    render();
}

// =====================================
// CALCULATE RESULT
// =====================================

function equals() {
    if (
        operator === null ||
        previous === null ||
        startFresh ||
        current === "Error"
    ) {
        return;
    }

    const second = Number(current);

    const equation =
        `${formatNumber(String(previous))} ` +
        `${prettyOperator(operator)} ` +
        `${formatNumber(current)}`;

    const result = normalize(
        operate(previous, second, operator)
    );

    current = result;

    expressionText = result === "Error"
        ? "Cannot divide by zero"
        : equation + " =";

    previous = null;
    operator = null;
    startFresh = true;

    if (result !== "Error") {
        history.unshift({
            equation: equation,
            result: result
        });

        history = history.slice(0, MAX_HISTORY);

        store(HISTORY_KEY, JSON.stringify(history));

        renderHistory();
    }

    render();
}

// =====================================
// CALCULATION HISTORY
// =====================================

function renderHistory() {
    historyCount.textContent = String(history.length);

    historyList.replaceChildren();

    if (history.length === 0) {
        const empty = document.createElement("div");
        empty.className = "history-empty";

        const icon = document.createElement("span");
        icon.className = "empty-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = "↗";

        const title = document.createElement("strong");
        title.textContent = "Nothing here yet";

        const subtitle = document.createElement("span");
        subtitle.textContent =
            "Your calculations will show up as you go.";

        empty.append(icon, title, subtitle);
        historyList.append(empty);

        return;
    }

    for (const item of history) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "history-item";
        button.title = "Use this result";

        const equation = document.createElement("span");
        equation.className = "history-equation";
        equation.textContent = item.equation + " =";

        const answer = document.createElement("span");
        answer.className = "history-answer";
        answer.textContent = formatNumber(item.result);

        button.append(equation, answer);

        button.addEventListener("click", () => {
            current = item.result;
            previous = null;
            operator = null;
            startFresh = true;

            expressionText =
                "From history: " + item.equation + " =";

            render();
        });

        historyList.append(button);
    }
}

// =====================================
// BUTTON ACTIONS
// =====================================

function handleAction(action) {
    switch (action) {
        case "clear":
            clearAll();
            break;

        case "sign":
            toggleSign();
            break;

        case "percent":
            percentage();
            break;

        case "decimal":
            inputDecimal();
            break;

        case "equals":
            equals();
            break;

        case "backspace":
            backspace();
            break;
    }
}

// =====================================
// BUTTON CLICK SUPPORT
// =====================================

keypad.addEventListener("click", event => {
    const button = event.target.closest("button");

    if (!button || !keypad.contains(button)) {
        return;
    }

    if (button.dataset.digit !== undefined) {
        inputDigit(button.dataset.digit);
    }

    else if (button.dataset.operator) {
        selectOperator(button.dataset.operator);
    }

    else if (button.dataset.action) {
        handleAction(button.dataset.action);
    }
});

document.getElementById("backspaceButton")
    .addEventListener("click", backspace);

// =====================================
// KEYBOARD SUPPORT
// =====================================

document.addEventListener("keydown", event => {
    if (
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        (event.target instanceof HTMLButtonElement &&
            event.key === " ")
    ) {
        return;
    }

    const key = event.key;

    if (/^[0-9]$/.test(key)) {
        inputDigit(key);
    }

    else if (key === ".") {
        inputDecimal();
    }

    else if (["+", "-", "*", "/"].includes(key)) {
        event.preventDefault();
        selectOperator(key);
    }

    else if (key === "Enter" || key === "=") {
        event.preventDefault();
        equals();
    }

    else if (key === "Backspace") {
        event.preventDefault();
        backspace();
    }

    else if (key === "Escape") {
        clearAll();
    }

    else if (key === "%") {
        percentage();
    }
});

// =====================================
// CLEAR HISTORY
// =====================================

clearHistoryButton.addEventListener("click", () => {
    history = [];

    store(HISTORY_KEY, "[]");

    renderHistory();

    notify("History cleared");
});

// =====================================
// COPY RESULT
// =====================================

document.getElementById("copyButton")
    .addEventListener("click", async () => {

        if (current === "Error") {
            notify("Nothing to copy");
            return;
        }

        try {
            if (
                navigator.clipboard &&
                window.isSecureContext
            ) {
                await navigator.clipboard.writeText(current);
            } else {
                const temp = document.createElement("textarea");

                temp.value = current;
                temp.style.position = "fixed";
                temp.style.opacity = "0";

                document.body.append(temp);
                temp.select();

                const copied = document.execCommand("copy");
                temp.remove();

                if (!copied) {
                    throw new Error("Copy failed");
                }
            }

            notify("Result copied");

        } catch (error) {
            notify("Copy not available in this browser");
        }
    });

// =====================================
// DARK AND LIGHT THEME
// =====================================

function applyTheme(theme) {
    const selected = theme === "light"
        ? "light"
        : "dark";

    document.documentElement.dataset.theme = selected;

    themeLabel.textContent = selected === "dark"
        ? "Light mode"
        : "Dark mode";

    themeToggle.setAttribute(
        "aria-label",
        selected === "dark"
            ? "Switch to light mode"
            : "Switch to dark mode"
    );

    document.querySelector('meta[name="theme-color"]')
        .content = selected === "dark"
            ? "#090e1b"
            : "#f1f5f9";

    store(THEME_KEY, selected);
}

themeToggle.addEventListener("click", () => {
    const nextTheme =
        document.documentElement.dataset.theme === "dark"
            ? "light"
            : "dark";

    applyTheme(nextTheme);
});

// =====================================
// START APPLICATION
// =====================================

applyTheme(load(THEME_KEY) || "dark");

renderHistory();

render();
