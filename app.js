function updateConditionalFields() {
  document.querySelectorAll("[data-reveals]").forEach((control) => {
    const target = document.getElementById(control.dataset.reveals);
    if (!target) return;
    const revealValue = control.dataset.revealsValue || "yes";
    const controls = document.querySelectorAll(`[data-reveals="${control.dataset.reveals}"]`);
    const shouldShow = [...controls].some((input) => input.checked && input.value === revealValue);
    target.classList.toggle("visible", shouldShow);
  });
}

function value(name, fallback = "") {
  const selected = document.querySelector(`[name="${name}"]:checked`);
  const field = selected || document.querySelector(`[name="${name}"]`);
  return field ? field.value.trim() : fallback;
}

function text(name, fallback = "") {
  const field = document.querySelector(`[name="${name}"]`);
  return field ? field.value.trim() : fallback;
}

function formatQuestionnaire() {
  const daySentence = value("usual_day") === "no"
    ? `Pt did not have a usual day - ${text("day_description")}`
    : "Pt had usual day.";

  let medicationSentence;
  if (value("medication") === "no") {
    medicationSentence = "Pt does not take any prescribed medication.";
  } else if (value("medication_as_listed") === "yes") {
    medicationSentence = "Pt took medication as listed.";
  } else {
    medicationSentence = `Pt took ${text("medication_details")}.`;
  }

  const caffeineSentence = value("caffeine") === "no"
    ? "Pt had no caffeine."
    : `Pt had ${text("caffeine_amount", "an unspecified amount")} of ${text("caffeine_type", "caffeine")} in the ${value("caffeine_time", "AM")}.`;
  const alcoholSentence = value("alcohol") === "yes" ? `Pt had ${text("alcohol_details", "alcohol")}.` : "Pt had no alcohol.";
  const painSentence = value("pain") === "yes" ? `Pt experienced ${text("pain_description", "pain")} affecting sleep.` : "Pt experienced no pain affecting sleep.";
  const activitySentence = value("in_bed_activity") === "yes" ? `Pt ${text("in_bed_activity_details", "read or watched TV")} in bed` : "";

  const comparison = { much_better: "much better", better: "better", same: "the same", worse: "worse", much_worse: "much worse" }[value("sleep_comparison", "same")];
  const sleepSentence = comparison === "the same" ? "Pt slept the same as usual." : `Pt slept ${comparison} than usual.`;
  const latency = { much_longer: "much longer", longer: "longer", same: "the same", shorter: "shorter", much_shorter: "much shorter" }[value("sleep_latency", "same")];
  const feeling = { alert: "alert", refreshed: "refreshed", awake_not_alert: "awake - not alert", awake_not_refreshed: "awake - not refreshed", sleepy: "sleepy" }[value("waking_feeling", "")];
  const feelingSentence = feeling ? `Pt felt ${feeling} upon waking.` : "Pt's feeling upon waking was not recorded.";
  const sensorSentence = value("sensors") === "yes" ? `Pt mentioned that ${text("sensor_details", "some")} sensors came off.` : "Pt said no leads/sensors came off to their knowledge.";
  const comment = text("morning_comment");

  const bedtime = [daySentence, medicationSentence, caffeineSentence, alcoholSentence, painSentence, `Pt went to bed ${text("bedtime", "____")}`];
  if (activitySentence) bedtime.push(activitySentence);
  bedtime.push(`lights out ${text("lights_out", "____")}.`);

  const morning = [`Pt woke at ${text("wake_time", "____")}.`, sleepSentence, `Pt perceived sleep latency as ${latency}.`, feelingSentence, sensorSentence];
  if (comment) morning.push(comment);

  return `BEDTIME QUESTIONNAIRE:\n${bedtime.join(" ")}\n\nMORNING QUESTIONNAIRE:\n${morning.join(" ")}`;
}

document.querySelectorAll("input[type=radio]").forEach((input) => input.addEventListener("change", updateConditionalFields));
updateConditionalFields();

document.getElementById("questionnaire-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const report = formatQuestionnaire();
  document.getElementById("report-output").value = report;
  document.getElementById("copy-button").disabled = false;
  document.getElementById("copy-status").textContent = "Report generated. The form resets when you start a new entry - no data is stored.";
});

document.getElementById("copy-button").addEventListener("click", async () => {
  const output = document.getElementById("report-output");
  try {
    await navigator.clipboard.writeText(output.value);
  } catch {
    output.select();
    document.execCommand("copy");
  }
  document.getElementById("copy-status").textContent = "Report copied to clipboard.";
});
