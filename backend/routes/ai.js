const express = require("express");
const router = express.Router();

const {
  symptomCheck,
  recommendDoctor,
  chatbot,
} = require("../controllers/aiController");

router.post("/symptom-check", symptomCheck);
router.post("/recommend-doctor", recommendDoctor);
router.post("/chat", chatbot);

module.exports = router;