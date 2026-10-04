from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)

# Supported languages
languages = {
    "English": "en",
    "Telugu": "te",
    "Hindi": "hi",
    "Tamil": "ta",
    "Kannada": "kn",
    "Malayalam": "ml",
    "French": "fr",
    "Spanish": "es",
    "German": "de"
}

TRANSLATION_API = "https://api.mymemory.translated.net/get"
CHUNK_SIZE = 450


def translate_chunk(text, source, target):
    """Translate one chunk of text using MyMemory API."""

    params = {
        "q": text,
        "langpair": f"{source}|{target}"
    }

    response = requests.get(
        TRANSLATION_API,
        params=params,
        timeout=20
    )

    response.raise_for_status()

    data = response.json()

    if "responseData" not in data:
        raise ValueError("Unexpected API response.")

    return data["responseData"]["translatedText"]


def translate_text(text, source, target):
    """Translate short or long text."""

    # Short text
    if len(text) <= CHUNK_SIZE:
        return translate_chunk(text, source, target)

    # Long text
    words = text.split()
    chunks = []
    current_chunk = ""

    for word in words:

        if len(current_chunk) + len(word) + 1 <= CHUNK_SIZE:

            if current_chunk:
                current_chunk += " " + word
            else:
                current_chunk = word

        else:

            if current_chunk:
                chunks.append(current_chunk)

            current_chunk = word

    if current_chunk:
        chunks.append(current_chunk)

    translated_chunks = []

    for chunk in chunks:
        translated_chunks.append(
            translate_chunk(chunk, source, target)
        )

    return " ".join(translated_chunks)


@app.route("/")
def home():
    """Display the main translation page."""

    return render_template(
        "index.html",
        languages=languages
    )


@app.route("/translate", methods=["POST"])
def translate():
    """Receive text from frontend and return translation."""

    try:

        data = request.get_json()

        if not data:
            return jsonify({
                "error": "No data received."
            }), 400

        text = data.get("text", "").strip()
        source = data.get("source", "")
        target = data.get("target", "")

        # Validate text
        if not text:
            return jsonify({
                "error": "Please enter some text."
            }), 400

        # Validate languages
        if source not in languages.values():
            return jsonify({
                "error": "Invalid source language."
            }), 400

        if target not in languages.values():
            return jsonify({
                "error": "Invalid target language."
            }), 400

        # Same language check
        if source == target:
            return jsonify({
                "error": "Source and target languages must be different."
            }), 400

        # Translate
        translated_text = translate_text(
            text,
            source,
            target
        )

        return jsonify({
            "success": True,
            "translation": translated_text
        })

    except requests.exceptions.Timeout:

        return jsonify({
            "error": "Translation service timed out. Please try again."
        }), 504

    except requests.exceptions.RequestException:

        return jsonify({
            "error": "Unable to connect to the translation service. Please check your internet connection."
        }), 500

    except (KeyError, ValueError):

        return jsonify({
            "error": "The translation service returned an unexpected response."
        }), 500

    except Exception as error:

        print("Error:", error)

        return jsonify({
            "error": "Something went wrong while translating."
        }), 500


if __name__ == "__main__":

    app.run(
        debug=True,
        host="127.0.0.1",
        port=5000
    )