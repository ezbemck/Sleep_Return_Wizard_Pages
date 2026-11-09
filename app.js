function updateConditionalFields() {
  document.querySelectorAll("[data-reveals]").forEach((control) => {
    const target = document.getElementById(control.dataset.reveals);
    if (!target) return;
    const revealValue = control.dataset.revealsValue || "yes";
    const controls = document.querySelectorAll(`[data-reveals="${control.dataset.reveals}"]`);
    const shouldShow = [...controls].some((input) => input.checked && input.value === revealValue);
    target.classList.toggle("visible", shouldShow);
  });
  const unusualDaySelected = document.querySelector('input[name="usual_day"]:checked')?.value === "yes";
  document.getElementById("day_description").required = unusualDaySelected;
  const caffeineVisible = document.getElementById("caffeine-details").classList.contains("visible");
  document.querySelectorAll(".caffeine-row").forEach((row, index) => {
    const required = caffeineVisible && index === 0;
    row.querySelectorAll(".caffeine-amount, .caffeine-type, .caffeine-time").forEach((field) => {
      field.required = required;
    });
    const otherSelected = row.querySelector(".caffeine-type").value === "other";
    row.querySelector(".caffeine-other").required = required && otherSelected;
  });
}

function value(name, fallback = "") {
  const selected = document.querySelector(`[name="${name}"]:checked`);
  const field = selected || document.querySelector(`[name="${name}"]`);
  return field ? field.value.trim() : fallback;
}

function text(name, fallback = "") {
  const field = document.querySelector(`[name="${name}"]`);
  return field && field.value.trim() ? field.value.trim() : fallback;
}

function rawText(name) {
  const field = document.querySelector(`[name="${name}"]`);
  return field ? field.value : "";
}

function formattedTime(name) {
  return text(name).replace(":", "") || "____";
}

function createCaffeineRow() {
  const row = document.createElement("div");
  row.className = "caffeine-row";
  row.dataset.optional = document.querySelectorAll(".caffeine-row").length > 0 ? "true" : "false";
  row.innerHTML = `
    <span>Pt had</span>
    <select class="caffeine-amount" aria-label="Caffeine amount">
      ${Array.from({ length: 10 }, (_, index) => `<option value="${index + 1}">${index + 1}</option>`).join("")}
    </select>
    <select class="caffeine-type" aria-label="Caffeine type">
      <option value="coffee">coffee</option>
      <option value="tea">tea</option>
      <option value="soft drink">soft drink</option>
      <option value="other">other</option>
    </select>
    <input class="caffeine-other" type="text" maxlength="300" aria-label="Other caffeine type" placeholder="Type of caffeine" hidden>
    <span>at</span>
    <input class="caffeine-time" type="time" step="60" aria-label="Time consumed">
  `;
  const typeSelect = row.querySelector(".caffeine-type");
  const otherInput = row.querySelector(".caffeine-other");
  typeSelect.addEventListener("change", () => {
    otherInput.hidden = typeSelect.value !== "other";
    otherInput.required = !otherInput.hidden && !row.dataset.optional && document.getElementById("caffeine-details").classList.contains("visible");
    if (otherInput.hidden) otherInput.value = "";
  });
  const caffeineVisible = document.getElementById("caffeine-details").classList.contains("visible");
  row.querySelectorAll(".caffeine-amount, .caffeine-type, .caffeine-time").forEach((field) => {
    field.required = caffeineVisible && row.dataset.optional === "false";
  });
  return row;
}

function updateCaffeineAddButton() {
  const rows = document.querySelectorAll(".caffeine-row");
  const addButton = document.getElementById("add-caffeine");
  addButton.disabled = rows.length >= 4;
  addButton.hidden = rows.length >= 4;
}

function formatQuestionnaire() {
  const daySentence = value("usual_day") === "yes"
    ? rawText("day_description")
    : "Pt had usual day.";

  let medicationSentence;
  if (value("medication") === "no") {
    medicationSentence = "Pt does not take any prescribed medication.";
  } else if (value("medication_as_listed") === "yes") {
    medicationSentence = "Pt took medication as listed.";
  } else {
    medicationSentence = `Pt took ${text("medication_details")}.`;
  }

  const caffeineRows = [...document.querySelectorAll(".caffeine-row")].map((row) => {
    const amount = row.querySelector(".caffeine-amount").value;
    const typeSelect = row.querySelector(".caffeine-type");
    const type = typeSelect.value === "other" ? row.querySelector(".caffeine-other").value.trim() : typeSelect.value;
    const plural = { coffee: "coffees", tea: "teas", "soft drink": "soft drinks" }[type] || `${type}${type.endsWith("s") ? "" : "s"}`;
    const article = /^[aeiou]/i.test(type) ? "an" : "a";
    const quantity = amount === "1" ? `${article} ${type}` : `${amount} ${plural}`;
    const time = row.querySelector(".caffeine-time").value.trim().replace(":", "");
    return time && type ? `${quantity} at ${time}` : "";
  }).filter(Boolean);
  let caffeineSentence = "Pt had no caffeine.";
  if (value("caffeine") === "yes" && caffeineRows.length) {
    const joinedCaffeine = caffeineRows.length < 2
      ? caffeineRows[0]
      : `${caffeineRows.slice(0, -1).join(", ")}, and ${caffeineRows.at(-1)}`;
    caffeineSentence = `Pt had ${joinedCaffeine}.`;
  }
  const alcoholSentence = value("alcohol") === "yes" ? `Pt had ${text("alcohol_details", "alcohol")}.` : "Pt had no alcohol.";
  const painSentence = value("pain") === "yes"
    ? `Pt experiencing ${text("pain_description", "pain")} ${value("pain_frequency", "infrequently")} affecting ${value("pain_effect", "sleep onset")}.`
    : "Pt experienced no pain affecting sleep.";
  const activitySentence = value("in_bed_activity") === "yes"
    ? `pt ${text("in_bed_activity_details", "read or watched TV")} in bed`
    : "no reading/TV in bed";

  const comparison = { much_better: "much better", better: "better", same: "the same", worse: "worse", much_worse: "much worse" }[value("sleep_comparison", "same")];
  const sleepSentence = comparison === "the same" ? "Pt slept the same as usual." : `Pt slept ${comparison} than usual.`;
  const latency = { much_longer: "much longer", longer: "longer", same: "the same", shorter: "shorter", much_shorter: "much shorter" }[value("sleep_latency", "same")];
  const feeling = { alert: "alert", refreshed: "refreshed", awake_alert: "awake - alert", awake_not_refreshed: "awake - not refreshed", sleepy: "sleepy" }[value("waking_feeling", "")];
  const feelingSentence = feeling ? `Pt felt ${feeling} upon waking.` : "Pt's feeling upon waking was not recorded.";
  const sensorDetails = rawText("sensor_details").trimEnd();
  const sensorPrefix = "Pt mentioned that the";
  const sensorComment = sensorDetails.startsWith(sensorPrefix)
    ? sensorDetails
    : `${sensorPrefix}${sensorDetails ? ` ${sensorDetails}` : ""}`;
  const sensorSentence = value("sensors") === "yes"
    ? `${sensorComment}${/[.!?]$/.test(sensorComment) ? "" : "."}`
    : "Pt said no leads/sensors came off to their knowledge.";
  const comment = rawText("morning_comment");

  const bedtimeTime = formattedTime("bedtime");
  const lightsOutTime = formattedTime("lights_out");
  const bedtimeSentence = bedtimeTime === lightsOutTime
    ? `Pt went to bed + lights out ${bedtimeTime}, ${activitySentence}.`
    : `Pt went to bed ${bedtimeTime}, ${activitySentence}, and lights out ${lightsOutTime}.`;
  const bedtime = [daySentence, medicationSentence, caffeineSentence, alcoholSentence, painSentence, bedtimeSentence];

  const morning = [`Pt woke at ${formattedTime("wake_time")}.`, sleepSentence, `Pt perceived sleep latency as ${latency}.`, feelingSentence, sensorSentence];
  if (comment) morning.push(comment);

  return `BEDTIME QUESTIONNAIRE:\n${bedtime.join(" ")}\nMORNING QUESTIONNAIRE:\n${morning.join(" ")}`;
}

document.querySelectorAll("input[type=radio]").forEach((input) => input.addEventListener("change", updateConditionalFields));
updateConditionalFields();

const caffeineRows = document.getElementById("caffeine-rows");
document.getElementById("add-caffeine").addEventListener("click", () => {
  if (caffeineRows.children.length < 4) {
    caffeineRows.append(createCaffeineRow());
    updateCaffeineAddButton();
  }
});
caffeineRows.append(createCaffeineRow());
updateCaffeineAddButton();

document.querySelectorAll("[data-prefill]").forEach((field) => {
  field.addEventListener("focus", () => {
    if (!field.value.trim()) {
      field.value = field.dataset.prefill;
      field.setSelectionRange(field.value.length, field.value.length);
    }
  });
});

document.querySelectorAll('input[type="text"]:not([data-time-input]):not(.caffeine-time), textarea:not([readonly])').forEach((field) => {
  field.maxLength = 300;
});

document.getElementById("questionnaire-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const generateButton = document.getElementById("generate-button");
  generateButton.classList.remove("is-whooshing");
  requestAnimationFrame(() => generateButton.classList.add("is-whooshing"));
  window.setTimeout(() => generateButton.classList.remove("is-whooshing"), 750);
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
