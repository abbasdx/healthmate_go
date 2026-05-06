const Doctor = require("../models/Doctor");
const { askGemini } = require("../services/geminiService");

/* =====================================================
   SMART SYMPTOM → SPECIALIST MATCHER
===================================================== */

const symptomMap = [
  {
    specialty: "General Physician",
    keywords: [
      "fever",
      "cold",
      "cough",
      "flu",
      "viral",
      "weakness",
      "fatigue",
      "body pain",
      "infection",
      "vomiting",
      "stomach pain",
    ],
  },

  {
    specialty: "Neurologist",
    keywords: [
      "headache",
      "migraine",
      "brain",
      "memory",
      "seizure",
      "numbness",
      "dizziness",
      "vertigo",
    ],
  },

  {
    specialty: "Dermatologist",
    keywords: [
      "skin",
      "rash",
      "itching",
      "acne",
      "eczema",
      "allergy",
      "hair fall",
      "pimples",
      "fungal",
    ],
  },

  {
    specialty: "Cardiologist",
    keywords: [
      "heart",
      "chest pain",
      "bp",
      "blood pressure",
      "palpitations",
      "cardiac",
      "heartbeat",
    ],
  },

  {
    specialty: "Orthopedic",
    keywords: [
      "back pain",
      "joint pain",
      "bone",
      "knee pain",
      "shoulder pain",
      "fracture",
      "arthritis",
      "neck pain",
    ],
  },

  {
    specialty: "Pediatrician",
    keywords: [
      "baby",
      "child",
      "kid",
      "newborn",
      "vaccination",
      "infant",
    ],
  },

  {
    specialty: "Gynecologist",
    keywords: [
      "pregnancy",
      "period",
      "pcos",
      "women",
      "uterus",
      "gynae",
      "menstrual",
    ],
  },

  {
    specialty: "ENT Specialist",
    keywords: [
      "ear",
      "nose",
      "throat",
      "sinus",
      "tonsil",
      "hearing",
      "voice",
    ],
  },

  {
    specialty: "Psychiatrist",
    keywords: [
      "stress",
      "anxiety",
      "panic",
      "depression",
      "mental",
      "sleep issue",
      "insomnia",
    ],
  },

  {
    specialty: "Ophthalmologist",
    keywords: [
      "eye",
      "vision",
      "blurred",
      "red eye",
      "glasses",
      "watering eyes",
    ],
  },
];

/* =====================================================
   DETECT SPECIALTY
===================================================== */

function detectSpecialty(text = "") {
  const lower = text.toLowerCase();

  for (const item of symptomMap) {
    for (const keyword of item.keywords) {
      if (lower.includes(keyword)) {
        return item.specialty;
      }
    }
  }

  return "General Physician";
}

/* =====================================================
   SYMPTOM CHECKER
===================================================== */

exports.symptomCheck = async (req, res) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms) {
      return res.status(400).json({
        success: false,
        error: "Symptoms are required",
      });
    }

    const specialty = detectSpecialty(symptoms);

    const prompt = `
You are HealthMate AI for an ONLINE telemedicine platform.

User symptoms: ${symptoms}

Respond in this short format:

Possible Causes:
• item 1
• item 2

Severity:
Low / Medium / High

Recommended Online Specialist:
${specialty}

Advice:
One short practical sentence.

Keep under 90 words.
`;

    const reply = await askGemini(prompt);

    return res.json({
      success: true,
      specialty,
      result: reply,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

/* =====================================================
   DOCTOR RECOMMENDATION
===================================================== */

exports.recommendDoctor = async (req, res) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms) {
      return res.status(400).json({
        success: false,
        error: "Symptoms are required",
      });
    }

    const specialty = detectSpecialty(symptoms);

    const doctors = await Doctor.find({
      specialization: { $regex: specialty, $options: "i" },
    }).limit(5);

    return res.json({
      success: true,
      specialty,
      message: `Best specialist for "${symptoms}" is ${specialty}.`,
      doctors,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

/* =====================================================
   UNIVERSAL CHATBOT
===================================================== */

exports.chatbot = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    const specialty = detectSpecialty(message);

    const prompt = `
You are HealthMate AI assistant for an ONLINE healthcare platform.

RULES:
- HealthMate offers ONLINE consultations only.
- Never ask for zip code or nearby location.
- Never suggest local clinics unless emergency.
- Keep replies short (max 100 words).
- Use clean bullets when useful.
- Friendly, modern, premium tone.

If symptoms are mentioned, recommend:
${specialty}

You can help with:
• symptoms
• doctor recommendations
• booking appointments
• health tips
• platform support

If emergency signs appear (severe chest pain, stroke symptoms, breathing trouble), advise urgent emergency care.

User message:
${message}
`;

    const reply = await askGemini(prompt);

    return res.json({
      success: true,
      specialty,
      reply,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};