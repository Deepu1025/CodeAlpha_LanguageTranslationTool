// ========================================
// Get HTML Elements
// ========================================

const sourceLanguage = document.getElementById("sourceLanguage");
const targetLanguage = document.getElementById("targetLanguage");

const inputText = document.getElementById("inputText");
const characterCount = document.getElementById("characterCount");

const translateButton = document.getElementById("translateButton");
const swapButton = document.getElementById("swapButton");
const clearButton = document.getElementById("clearButton");

const loading = document.getElementById("loading");
const errorMessage = document.getElementById("errorMessage");

const resultSection = document.getElementById("resultSection");
const translatedText = document.getElementById("translatedText");

const copyButton = document.getElementById("copyButton");
const speakButton = document.getElementById("speakButton");

const historySection = document.getElementById("historySection");
const historyList = document.getElementById("historyList");
const clearHistoryButton = document.getElementById("clearHistoryButton");


// ========================================
// Translation History
// ========================================

let translationHistory = [];


// ========================================
// Character Counter
// ========================================

inputText.addEventListener("input", function () {

    characterCount.textContent =
        `Characters: ${inputText.value.length}`;

});


// ========================================
// Show Error Message
// ========================================

function showError(message) {

    errorMessage.textContent = `❌ ${message}`;

    errorMessage.classList.remove("hidden");

}


// ========================================
// Hide Error Message
// ========================================

function hideError() {

    errorMessage.textContent = "";

    errorMessage.classList.add("hidden");

}


// ========================================
// Show Loading
// ========================================

function showLoading() {

    loading.classList.remove("hidden");

    translateButton.disabled = true;

    translateButton.textContent = "Translating...";

}


// ========================================
// Hide Loading
// ========================================

function hideLoading() {

    loading.classList.add("hidden");

    translateButton.disabled = false;

    translateButton.textContent = "🌐 Translate";

}


// ========================================
// Translate Text
// ========================================

translateButton.addEventListener("click", async function () {

    hideError();

    const text = inputText.value.trim();

    const source = sourceLanguage.value;

    const target = targetLanguage.value;


    // Check empty text

    if (!text) {

        showError("Please enter some text.");

        inputText.focus();

        return;

    }


    // Check same languages

    if (source === target) {

        showError(
            "Source and target languages must be different."
        );

        return;

    }


    showLoading();


    try {

        const response = await fetch("/translate", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                text: text,

                source: source,

                target: target

            })

        });


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.error || "Translation failed."
            );

        }


        // Display translation

        translatedText.textContent = data.translation;

        resultSection.classList.remove("hidden");


        // Add to history

        addToHistory(
            text,
            data.translation,
            source,
            target
        );


    } catch (error) {

        showError(error.message);

    } finally {

        hideLoading();

    }

});


// ========================================
// Swap Languages
// ========================================

swapButton.addEventListener("click", function () {

    const oldSource = sourceLanguage.value;

    sourceLanguage.value = targetLanguage.value;

    targetLanguage.value = oldSource;


    // If translation already exists,
    // move it to the input box.

    if (
        !resultSection.classList.contains("hidden") &&
        translatedText.textContent.trim()
    ) {

        inputText.value =
            translatedText.textContent;

        characterCount.textContent =
            `Characters: ${inputText.value.length}`;

        resultSection.classList.add("hidden");

    }

});


// ========================================
// Clear Input Text
// ========================================

clearButton.addEventListener("click", function () {

    inputText.value = "";

    characterCount.textContent =
        "Characters: 0";

    resultSection.classList.add("hidden");

    hideError();

    inputText.focus();

});


// ========================================
// Copy Translation
// ========================================

copyButton.addEventListener("click", async function () {

    const text = translatedText.textContent.trim();


    if (!text) {

        showError("There is no translation to copy.");

        return;

    }


    try {

        await navigator.clipboard.writeText(text);

        copyButton.textContent = "✅ Copied!";


        setTimeout(function () {

            copyButton.textContent = "📋 Copy";

        }, 1500);


    } catch (error) {

        showError(
            "Unable to copy the translation."
        );

    }

});


// ========================================
// Text-to-Speech
// ========================================

speakButton.addEventListener("click", function () {

    const text = translatedText.textContent.trim();


    if (!text) {

        showError("There is no translation to read.");

        return;

    }


    // Check browser support

    if (!("speechSynthesis" in window)) {

        showError(
            "Text-to-speech is not supported by your browser."
        );

        return;

    }


    // Stop previous speech

    window.speechSynthesis.cancel();


    const speech =
        new SpeechSynthesisUtterance(text);


    speech.lang =
        getSpeechLanguage(targetLanguage.value);


    speech.rate = 0.9;

    speech.pitch = 1;


    window.speechSynthesis.speak(speech);

});


// ========================================
// Speech Language Mapping
// ========================================

function getSpeechLanguage(languageCode) {

    const speechLanguages = {

        "en": "en-US",

        "te": "te-IN",

        "hi": "hi-IN",

        "ta": "ta-IN",

        "kn": "kn-IN",

        "ml": "ml-IN",

        "fr": "fr-FR",

        "es": "es-ES",

        "de": "de-DE"

    };


    return speechLanguages[languageCode]
        || "en-US";

}


// ========================================
// Add Translation to History
// ========================================

function addToHistory(
    original,
    translation,
    source,
    target
) {

    const historyItem = {

        original: original,

        translation: translation,

        source: source,

        target: target

    };


    translationHistory.unshift(historyItem);


    // Keep only the latest 10 translations

    if (translationHistory.length > 10) {

        translationHistory.pop();

    }


    displayHistory();

}


// ========================================
// Display Translation History
// ========================================

function displayHistory() {

    historyList.innerHTML = "";


    if (translationHistory.length === 0) {

        historySection.classList.add("hidden");

        return;

    }


    historySection.classList.remove("hidden");


    translationHistory.forEach(function (item) {

        const historyElement =
            document.createElement("div");

        historyElement.className =
            "history-item";


        historyElement.innerHTML = `

            <div class="history-languages">

                ${item.source.toUpperCase()}
                →
                ${item.target.toUpperCase()}

            </div>

            <div class="history-original">

                <strong>Original:</strong>
                ${escapeHTML(item.original)}

            </div>

            <div class="history-translation">

                <strong>Translation:</strong>
                ${escapeHTML(item.translation)}

            </div>

        `;


        historyList.appendChild(historyElement);

    });

}


// ========================================
// Clear Translation History
// ========================================

clearHistoryButton.addEventListener(
    "click",
    function () {

        translationHistory = [];

        displayHistory();

    }
);


// ========================================
// Security Helper
// ========================================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}