
/* =====================================
   DSA TRACKER — FRONTEND + BACKEND
===================================== */

const API_URL = "https://dsa-preparation-tracker.onrender.com/api/questions";

let questions = [];
let toastTimeout;


/* =====================================
   1. DOM ELEMENTS
===================================== */

const questionForm = document.getElementById("questionForm");
const questionModal = document.getElementById("questionModal");
const questionsTableBody = document.getElementById("questionsTableBody");
const emptyState = document.getElementById("emptyState");

const searchInput = document.getElementById("searchInput");
const platformFilter = document.getElementById("platformFilter");
const topicFilter = document.getElementById("topicFilter");
const difficultyFilter = document.getElementById("difficultyFilter");
const statusFilter = document.getElementById("statusFilter");

const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const themeText = document.getElementById("themeText");

const toast = document.getElementById("toast");


/* =====================================
   2. THEME: LIGHT / DARK MODE
===================================== */

function applyTheme(theme) {
    document.body.classList.toggle("dark-mode", theme === "dark");

    if (theme === "dark") {
        themeIcon.textContent = "☀";
        themeText.textContent = "Light mode";
    } else {
        themeIcon.textContent = "☾";
        themeText.textContent = "Dark mode";
    }

    localStorage.setItem("dsaTrackerTheme", theme);
}

function toggleTheme() {
    const isDark = document.body.classList.contains("dark-mode");
    applyTheme(isDark ? "light" : "dark");
}

function loadSavedTheme() {
    const savedTheme = localStorage.getItem("dsaTrackerTheme") || "light";
    applyTheme(savedTheme);
}


/* =====================================
   3. TOAST NOTIFICATIONS
===================================== */

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}


/* =====================================
   4. LOAD QUESTIONS FROM BACKEND
===================================== */

async function loadQuestions() {
    questionsTableBody.innerHTML = `
        <tr>
            <td colspan="6">Loading questions...</td>
        </tr>
    `;

    try {
        const response = await fetch(API_URL, {
        credentials: "include"
        });

        if (!response.ok) {
            throw new Error("Could not load questions from the server.");
        }

        // Load shared question bank
        const allQuestions = await response.json();

        const userProgress = await loadUserProgress();
                // Load progress of the logged-in user

    // Combine each question with this user's progress
        questions = allQuestions.map(question => {
           const progress = userProgress.find(
                item => item.question.id === question.id
            );
        
           return {
               ...question,
                solved: progress ? progress.solved : false,
                solvedDate: progress ? progress.solvedDate : null
            };
        });
        
        renderQuestions();
                updateDashboardStats();

    } catch (error) {
        console.error("Error loading questions:", error);

        questionsTableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    Could not connect to the backend.
                    Make sure Spring Boot is running on port 8080.
                </td>
            </tr>
        `;

        emptyState.classList.remove("visible");
        showToast("Could not connect to the backend.");
    }
}
// 
//  LOAD LOGGED-IN USER'S QUESTION PROGRESS
// 
async function loadUserProgress() {
    try {
        const response = await fetch("https://dsa-preparation-tracker.onrender.com/api/progress", {
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error("Could not load user progress.");
        }

        return await response.json();

    } catch (error) {
        console.error("Error loading user progress:", error);
        return [];
    }
}

/* =====================================
   5. RENDER QUESTIONS TABLE
===================================== */

function renderQuestions() {
    const filteredQuestions = getFilteredQuestions();

    questionsTableBody.innerHTML = "";

    if (filteredQuestions.length === 0) {
        emptyState.classList.add("visible");
        return;
    }

    emptyState.classList.remove("visible");

    filteredQuestions.forEach((question, index) => {
        const row = document.createElement("tr");

        const difficultyClass = getDifficultyClass(question.difficulty);
        const statusClass = question.solved
            ? "status-solved"
            : "status-unsolved";

        const statusText = question.solved ? "Solved" : "Unsolved";

        row.innerHTML = `
            <td>
                <div class="question-title">
                    <span class="question-number">${index + 1}</span>
                    <a
                        class="question-link"
                        href="${escapeHTML(question.problemUrl || "#")}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        ${escapeHTML(question.title)}
                    </a>
                </div>
            </td>

            <td>
                <span class="topic-label">
                    ${escapeHTML(question.topic)}
                </span>
            </td>

            <td>
                <span class="platform-label">
                    ${escapeHTML(question.platform)}
                </span>
            </td>

            <td>
                <span class="difficulty-badge ${difficultyClass}">
                    ${escapeHTML(question.difficulty)}
                </span>
            </td>

            <td>
                <span class="status-badge ${statusClass}">
                    ${statusText}
                </span>
            </td>

            <td>
                <div class="action-buttons">
                    <button
                        class="icon-button"
                        type="button"
                        data-action="toggle-solved"
                        data-id="${question.id}"
                        title="${question.solved ? "Mark as unsolved" : "Mark as solved"}"
                        aria-label="${question.solved ? "Mark as unsolved" : "Mark as solved"}"
                    >
                        ${question.solved ? "↻" : "✓"}
                    </button>

                    
                </div>
            </td>
        `;

        questionsTableBody.appendChild(row);
    });
}


/* =====================================
   6. SEARCH AND FILTERS
===================================== */

function getFilteredQuestions() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedPlatform = platformFilter.value;
    const selectedTopic = topicFilter.value;
    const selectedDifficulty = difficultyFilter.value;
    const selectedStatus = statusFilter.value;

    return questions.filter(question => {
        const matchesSearch =
            question.title.toLowerCase().includes(searchTerm) ||
            question.topic.toLowerCase().includes(searchTerm) ||
            question.platform.toLowerCase().includes(searchTerm);

        const matchesPlatform =
            !selectedPlatform || question.platform === selectedPlatform;

        const matchesTopic =
            !selectedTopic || question.topic === selectedTopic;

        const matchesDifficulty =
            !selectedDifficulty || question.difficulty === selectedDifficulty;

        const matchesStatus =
            !selectedStatus ||
            (selectedStatus === "solved" && question.solved) ||
            (selectedStatus === "unsolved" && !question.solved);

        return (
            matchesSearch &&
            matchesPlatform &&
            matchesTopic &&
            matchesDifficulty &&
            matchesStatus
        );
    });
}

function applyFilters() {
    renderQuestions();
}


/* =====================================
   7. DASHBOARD STATISTICS
===================================== */

function updateDashboardStats() {
    const total = questions.length;
    const solved = questions.filter(question => question.solved).length;
    const unsolved = total - solved;

    const percentage = total === 0
        ? 0
        : Math.round((solved / total) * 100);

    document.getElementById("totalQuestions").textContent = total;
    document.getElementById("solvedQuestions").textContent = solved;
    document.getElementById("unsolvedQuestions").textContent = unsolved;
    document.getElementById("completionPercentage").textContent =
        `${percentage}%`;

    document.getElementById("completionProgress").style.width =
        `${percentage}%`;
}


/* =====================================
   8. ADD QUESTION — POST REQUEST
===================================== */

async function addQuestion(event) {
    event.preventDefault();

    const question = {
        title: document.getElementById("title").value.trim(),
        platform: document.getElementById("platform").value,
        topic: document.getElementById("topic").value.trim(),
        difficulty: document.getElementById("difficulty").value,
        problemUrl: document.getElementById("problemUrl").value.trim(),
        solved: false,
        solvedDate: null
    };

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(question)
        });

        if (!response.ok) {
            throw new Error("Could not save the question.");
        }

        questionForm.reset();
        closeQuestionModal();

        await loadQuestions();

        showToast("Question added successfully!");

    } catch (error) {
        console.error("Error adding question:", error);
        showToast("Could not save question. Check your backend.");
    }
}


/* =====================================
   9. MARK QUESTION SOLVED / UNSOLVED
   Uses PUT request
===================================== */
// 17. TOGGLE LOGGED-IN USER'S QUESTION PROGRESS
async function toggleSolved(questionId) {
    const question = questions.find(
        item => item.id === Number(questionId)
    );

    if (!question) {
        showToast("Question not found.");
        return;
    }

    const newSolvedStatus = !question.solved;

    try {
        const response = await fetch(
            `https://dsa-preparation-tracker.onrender.com/api/progress/${questionId}?solved=${newSolvedStatus}`,
            {
                method: "PUT",
                credentials: "include"
            }
        );

        if (!response.ok) {
            throw new Error("Could not update user progress.");
        }

        // Reload questions and this user's progress
        await loadQuestions();

        showToast(
            newSolvedStatus
                ? "Question marked as solved!"
                : "Question marked as unsolved."
        );

    } catch (error) {
        console.error("Error updating user progress:", error);
        showToast("Could not update question progress.");
    }
}

/* =====================================
   10. DELETE QUESTION
   Uses DELETE request
===================================== */

async function deleteQuestion(questionId) {
    const confirmDelete = confirm(
        "Are you sure you want to delete this question?\n\nThis action cannot be undone."
    );

    if (!confirmDelete) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${questionId}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Failed to delete question");
        }

        showToast("Question deleted successfully");
        await loadQuestions();

    } catch (error) {
        console.error("Error deleting question:", error);
        showToast("Could not delete question", "error");
    }
}


/* =====================================
   11. TABLE ACTION HANDLER
===================================== */

questionsTableBody.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const action = button.dataset.action;
    const questionId = button.dataset.id;

    if (action === "toggle-solved") {
        toggleSolved(questionId);
    }

    if (action === "delete") {
        deleteQuestion(questionId);
    }
});


/* =====================================
   12. MODAL CONTROLS
===================================== */

function openQuestionModal() {
    questionModal.classList.add("open");
    questionModal.setAttribute("aria-hidden", "false");

    document.getElementById("title").focus();
}

function closeQuestionModal() {
    questionModal.classList.remove("open");
    questionModal.setAttribute("aria-hidden", "true");
}

document.getElementById("openAddQuestion").addEventListener(
    "click",
    openQuestionModal
);

document.getElementById("sectionAddQuestion").addEventListener(
    "click",
    openQuestionModal
);

document.getElementById("emptyStateAddQuestion").addEventListener(
    "click",
    openQuestionModal
);

document.getElementById("closeQuestionModal").addEventListener(
    "click",
    closeQuestionModal
);

document.getElementById("cancelQuestion").addEventListener(
    "click",
    closeQuestionModal
);

questionModal.addEventListener("click", event => {
    if (event.target === questionModal) {
        closeQuestionModal();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeQuestionModal();
    }
});


/* =====================================
   13. EVENT LISTENERS
===================================== */

themeToggle.addEventListener("click", toggleTheme);

questionForm.addEventListener("submit", addQuestion);

searchInput.addEventListener("input", applyFilters);

platformFilter.addEventListener("change", applyFilters);
topicFilter.addEventListener("change", applyFilters);
difficultyFilter.addEventListener("change", applyFilters);
statusFilter.addEventListener("change", applyFilters);


/* =====================================
   14. HELPER FUNCTIONS
===================================== */

function getDifficultyClass(difficulty) {
    switch (difficulty) {
        case "Easy":
            return "difficulty-easy";

        case "Medium":
            return "difficulty-medium";

        case "Hard":
            return "difficulty-hard";

        default:
            return "";
    }
}

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =====================================
   15. INITIALIZE APP
===================================== */

// CHECK WHETHER USER IS ALREADY LOGGED IN

loadSavedTheme();
checkSession();
async function checkSession() {
    try {
        const response = await fetch("https://dsa-preparation-tracker.onrender.com/api/auth/me", {
            credentials: "include"
        });

        if (response.ok) {
            // Session valid: show dashboard
            document.getElementById("authScreen").style.display = "none";
            document.getElementById("dashboardScreen").style.display = "flex";

            await loadQuestions();
        } else {
            // Session missing/expired: show login
            document.getElementById("authScreen").style.display = "flex";
            document.getElementById("dashboardScreen").style.display = "none";
        }
    } catch (error) {
        console.error("Session check error:", error);

        // Server unavailable: keep login screen visible
        document.getElementById("authScreen").style.display = "flex";
        document.getElementById("dashboardScreen").style.display = "none";
    }
}

// Login form
const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
        const response = await fetch("https://dsa-preparation-tracker.onrender.com/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ email, password })
        });

        const message = await response.text();

        if (response.ok) {
            document.getElementById("authScreen").style.display = "none";
            document.getElementById("dashboardScreen").style.display = "flex";

            loadQuestions();
        } else {
            alert(message || "Login failed. Please check your email and password.");
        }
    } catch (error) {
        console.error("Login error:", error);
        alert("Could not connect to the server. Make sure Spring Boot is running.");
    }
});
// Form switching
const showRegisterButton = document.getElementById("showRegister");
const showLoginButton = document.getElementById("showLogin");

const loginRegisterText = document.getElementById("loginRegisterText");
const registerLoginText = document.getElementById("registerLoginText");

showRegisterButton.addEventListener("click", function () {
    loginForm.style.display = "none";
    loginRegisterText.style.display = "none";

    registerForm.style.display = "block";
    registerLoginText.style.display = "block";
});

showLoginButton.addEventListener("click", function () {
    registerForm.style.display = "none";
    registerLoginText.style.display = "none";

    loginForm.style.display = "block";
    loginRegisterText.style.display = "block";
});
// Registration form submission
registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;

    try {
        const response = await fetch("https://dsa-preparation-tracker.onrender.com/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ name, email, password })
        });

        const message = await response.text();

        if (response.ok) {
            alert(message || "Registration successful! Please log in.");

            registerForm.reset();
            registerForm.style.display = "none";
            registerLoginText.style.display = "none";

            loginForm.style.display = "block";
            loginRegisterText.style.display = "block";
        } else {
            alert(message || "Registration failed. Please try again.");
        }
    } catch (error) {
        console.error("Registration error:", error);
        alert("Could not connect to the server. Make sure Spring Boot is running.");
    }
});
