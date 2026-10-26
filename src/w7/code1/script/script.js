const baseSizeSelect = document.querySelector("#base-size");
const intervalSelect = document.querySelector("#interval");
const ratioDescription = document.querySelector("#ratio-description");
const exampleTextInput = document.querySelector("#example-text");
const fontFamilySelect = document.querySelector("#font-family");
const selectedFont = document.querySelector("#selected-font");
const fontStatus = document.querySelector("#font-status");
const stepList = document.querySelector("#step-list");
let minStep = -1;
let maxStep = 1;
const intervals = [
  { name: "단2도", numerator: 16, denominator: 15 },
  { name: "장2도", numerator: 9, denominator: 8 },
  { name: "단3도", numerator: 6, denominator: 5 },
  { name: "장3도", numerator: 5, denominator: 4 },
  { name: "완전4도", numerator: 4, denominator: 3 },
  { name: "증4도 / 감5도", numerator: 45, denominator: 32 },
  { name: "완전5도", numerator: 3, denominator: 2 },
  { name: "단6도", numerator: 8, denominator: 5 },
  { name: "장6도", numerator: 5, denominator: 3 },
  { name: "단7도", numerator: 16, denominator: 9 },
  { name: "장7도", numerator: 15, denominator: 8 },
];
const fontStylesheet = document.createElement("link");
fontStylesheet.rel = "stylesheet";
fontStylesheet.addEventListener("error", () => {
  fontStatus.textContent = "글꼴을 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.";
  fontStatus.hidden = false;
});
document.head.append(fontStylesheet);

intervalSelect.querySelectorAll("option").forEach((option) => {
  const interval = intervals[Number(option.value) - 1];
  const ratio = interval.numerator / interval.denominator;
  option.textContent = `${ratio.toFixed(4)} ${interval.name}`;
});

let lastValidBaseSize = Number(baseSizeSelect.value);

function readBaseSize() {
  const value = baseSizeSelect.valueAsNumber;
  if (Number.isFinite(value) && value > 0 && value <= 500) {
    lastValidBaseSize = value;
  }
  return lastValidBaseSize;
}

const stepRows = [];
const topAddRow = createAddRow("negative");
const bottomAddRow = createAddRow("positive");
stepList.append(topAddRow, bottomAddRow);

function createStepRow() {
  const row = document.createElement("div");
  row.className = "step";

  const stepLabel = document.createElement("span");
  stepLabel.className = "step-number";

  const sample = document.createElement("span");
  sample.className = "sample";

  const side = document.createElement("div");
  side.className = "step-side";

  const sizeLabel = document.createElement("span");
  sizeLabel.className = "step-size";

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-step";
  deleteButton.type = "button";
  deleteButton.textContent = "삭제";
  deleteButton.addEventListener("click", () => {
    // 연속성을 유지하도록 바깥쪽 스텝이 0 방향으로 당겨진다.
    if (row.step > 0) maxStep -= 1;
    else minStep += 1;
    renderSteps();
  });

  side.append(sizeLabel, deleteButton);
  row.append(stepLabel, sample, side);
  return { row, stepLabel, sample, sizeLabel, deleteButton };
}

// 행 요소를 재사용해 클릭 후에도 호버·커서 상태가 유지되도록 한다.
function renderSteps() {
  const baseSize = readBaseSize();
  const interval = intervals[Number(intervalSelect.value) - 1];
  const multiplier = interval.numerator / interval.denominator;
  ratioDescription.textContent = `${interval.numerator}/${interval.denominator}`;

  const count = maxStep - minStep + 1;
  while (stepRows.length < count) {
    const created = createStepRow();
    stepRows.push(created);
    bottomAddRow.before(created.row);
  }
  while (stepRows.length > count) stepRows.pop().row.remove();

  stepRows.forEach((item, index) => {
    const step = minStep + index;
    const size = baseSize * multiplier ** step;
    item.row.step = step;
    item.stepLabel.textContent = step > 0 ? `+${step}` : String(step);
    item.sample.textContent = exampleTextInput.value;
    item.sample.style.fontSize = `${size}px`;
    item.sizeLabel.textContent = `${size.toFixed(4)}px`;
    item.deleteButton.hidden = step === 0;
    item.deleteButton.setAttribute("aria-label", `${step} 스텝 샘플 삭제`);
  });
}

function createAddRow(direction) {
  const row = document.createElement("div");
  row.className = "step step-add";

  const spacer = document.createElement("span");
  spacer.className = "add-spacer";

  const button = document.createElement("button");
  button.className = "add-step";
  button.type = "button";
  button.textContent = "스텝 추가";
  button.setAttribute(
    "aria-label",
    direction === "negative" ? "음수 방향 스텝 추가" : "양수 방향 스텝 추가",
  );
  button.addEventListener("click", () => {
    if (direction === "negative") minStep -= 1;
    else maxStep += 1;
    renderSteps();
  });

  row.append(spacer, button);
  return row;
}

baseSizeSelect.addEventListener("input", renderSteps);
baseSizeSelect.addEventListener("change", () => {
  baseSizeSelect.value = String(readBaseSize());
  renderSteps();
});
intervalSelect.addEventListener("change", renderSteps);
exampleTextInput.addEventListener("input", renderSteps);

fontFamilySelect.addEventListener("change", () => {
  const fontFamily = fontFamilySelect.value;
  const fontQuery = encodeURIComponent(fontFamily).replace(/%20/g, "+");
  fontStylesheet.href = `https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap`;
  document.documentElement.style.setProperty(
    "--sample-font-family",
    `"${fontFamily}", sans-serif`,
  );
  selectedFont.textContent = fontFamily;
  fontStatus.hidden = true;
});

fontFamilySelect.dispatchEvent(new Event("change"));
renderSteps();
