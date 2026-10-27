const wrap = document.querySelector("#wrap");
const exampleTextInput = document.querySelector("#example-text");
const fontFamilySelect = document.querySelector("#font-family");
const selectedFont = document.querySelector("#selected-font");
const fontStatus = document.querySelector("#font-status");
const viewportWidthLabel = document.querySelector("#viewport-width");

const columns = {
  left: document.querySelector("#drawer-left"),
  mid: document.querySelector("#preview"),
  right: document.querySelector("#drawer-right"),
};

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

function createSystem(index, defaultInterval) {
  const system = {
    widthInput: document.querySelector(`#width-${index}`),
    sizeInput: document.querySelector(`#base-size-${index}`),
    intervalSelect: document.querySelector(`#interval-${index}`),
    ratioDescription: document.querySelector(`#ratio-description-${index}`),
  };
  intervals.forEach((interval, i) => {
    const ratio = interval.numerator / interval.denominator;
    system.intervalSelect.append(
      new Option(`${ratio.toFixed(4)} ${interval.name}`, i + 1),
    );
  });
  system.intervalSelect.value = String(defaultInterval);
  system.lastWidth = Number(system.widthInput.value);
  system.lastSize = Number(system.sizeInput.value);
  return system;
}

const systems = [createSystem(1, 4), createSystem(2, 4)];

function readValid(input, last, max) {
  const value = input.valueAsNumber;
  return Number.isFinite(value) && value > 0 && value <= max ? value : last;
}

function readSystem(system) {
  system.lastWidth = readValid(system.widthInput, system.lastWidth, 10000);
  system.lastSize = readValid(system.sizeInput, system.lastSize, 500);
  const interval = intervals[Number(system.intervalSelect.value) - 1];
  system.ratioDescription.textContent = `${interval.numerator}/${interval.denominator}`;
  return {
    width: system.lastWidth,
    size: system.lastSize,
    multiplier: interval.numerator / interval.denominator,
  };
}

const num = (value) => Number(value.toFixed(4));

// 두 기준 너비 사이는 선형 보간하고, 바깥쪽은 각 끝 크기로 고정한다.
function fluidSize(a, b, step, viewportWidth) {
  const sizeA = a.size * a.multiplier ** step;
  const sizeB = b.size * b.multiplier ** step;
  if (a.width === b.width || sizeA === sizeB) {
    return { sizeA, sizeB, current: sizeA, css: `${num(sizeA)}px` };
  }
  const min = Math.min(sizeA, sizeB);
  const max = Math.max(sizeA, sizeB);
  const slope = (sizeB - sizeA) / (b.width - a.width);
  const intercept = sizeA - slope * a.width;
  const current = Math.min(max, Math.max(min, intercept + slope * viewportWidth));
  const css = `clamp(${num(min)}px, calc(${num(intercept)}px + ${num(slope * 100)}cqw), ${num(max)}px)`;
  return { sizeA, sizeB, current, css };
}

// 스텝은 세 열이 공유한다. 한 곳에서 추가/삭제하면 모든 열에 반영된다.
let minStep = -1;
let maxStep = 1;

function addStep(direction) {
  if (direction === "negative") minStep -= 1;
  else maxStep += 1;
  renderSteps();
}

function removeStep(step) {
  // 연속성을 유지하도록 바깥쪽 스텝이 0 방향으로 당겨진다.
  if (step > 0) maxStep -= 1;
  else minStep += 1;
  renderSteps();
}

function createAddLine(direction) {
  const line = document.createElement("div");
  line.className = "add-line";
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "스텝 추가";
  button.setAttribute(
    "aria-label",
    direction === "negative" ? "음수 방향 스텝 추가" : "양수 방향 스텝 추가",
  );
  button.addEventListener("click", () => addStep(direction));
  line.append(button);
  return line;
}

function createLine(getStep) {
  const line = document.createElement("div");
  line.className = "line";
  const step = document.createElement("span");
  step.className = "step";
  const sample = document.createElement("span");
  sample.className = "sample";
  const size = document.createElement("span");
  size.className = "size";
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "삭제";
  button.addEventListener("click", () => removeStep(getStep()));
  line.append(step, sample, size, button);
  return { line, step, sample, size, button };
}

// 미리보기 너비: 기본은 창 전체(맞춤)이고, 조정하면 해당 너비로 고정한다.
const widthRange = document.querySelector("#preview-width-range");
const widthNumber = document.querySelector("#preview-width-number");
const widthFit = document.querySelector("#preview-width-fit");
let previewWidth = null;

function availableWidth() {
  return document.documentElement.clientWidth;
}

function stageWidth() {
  return previewWidth === null
    ? availableWidth()
    : Math.min(previewWidth, availableWidth());
}

function syncWidthControls() {
  const width = Math.round(stageWidth());
  widthRange.max = String(availableWidth());
  widthRange.value = String(width);
  widthNumber.value = String(width);
  widthFit.checked = previewWidth === null;
  wrap.style.setProperty(
    "--preview-width",
    previewWidth === null ? "100%" : `${width}px`,
  );
}

function setPreviewWidth(value) {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed >= 100) previewWidth = parsed;
  syncWidthControls();
  renderSteps();
}

widthRange.addEventListener("input", () => setPreviewWidth(widthRange.value));
widthNumber.addEventListener("input", () => setPreviewWidth(widthNumber.value));
widthNumber.addEventListener("change", syncWidthControls);
widthFit.addEventListener("change", () => {
  previewWidth = widthFit.checked ? null : availableWidth();
  syncWidthControls();
  renderSteps();
});

const demoColumn = columns.mid;

const sideColumns = [columns.left, columns.right];
const bottomAdds = sideColumns.map((column) => {
  column.append(createAddLine("negative"));
  const bottom = createAddLine("positive");
  column.append(bottom);
  return bottom;
});

const stepRows = [];

function createStepRow() {
  const item = { step: 0 };
  const getStep = () => item.step;

  item.demo = document.createElement("div");
  item.demo.className = "row";
  item.sample = document.createElement("span");
  item.sample.className = "sample";
  item.current = document.createElement("span");
  item.current.className = "current-size";
  item.demo.append(item.sample, item.current);
  demoColumn.append(item.demo);

  item.sides = sideColumns.map((_, i) => {
    const side = createLine(getStep);
    bottomAdds[i].before(side.line);
    return side;
  });
  return item;
}

function removeStepRow(item) {
  item.demo.remove();
  item.sides.forEach((side) => side.line.remove());
}

function renderSteps() {
  const a = readSystem(systems[0]);
  const b = readSystem(systems[1]);
  const viewportWidth = Math.round(stageWidth());
  viewportWidthLabel.textContent = `미리보기 너비 ${viewportWidth}px`;

  const count = maxStep - minStep + 1;
  while (stepRows.length < count) stepRows.push(createStepRow());
  while (stepRows.length > count) removeStepRow(stepRows.pop());
  // 입력 3행 + 위/아래 추가 행 2개 + 스텝 행. 서브그리드가 span할 명시적 행이 필요하다.
  wrap.style.gridTemplateRows = `repeat(${3 + 2 + count}, auto)`;

  stepRows.forEach((item, index) => {
    const step = minStep + index;
    const sizes = fluidSize(a, b, step, viewportWidth);
    const label = step > 0 ? `+${step}` : String(step);
    item.step = step;

    item.sample.textContent = exampleTextInput.value;
    item.sample.style.fontSize = sizes.css;
    item.current.textContent = `${sizes.current.toFixed(2)}px`;

    [sizes.sizeA, sizes.sizeB].forEach((size, i) => {
      const side = item.sides[i];
      side.step.textContent = label;
      side.sample.textContent = exampleTextInput.value;
      side.sample.style.fontSize = `${size}px`;
      side.size.textContent = `${size.toFixed(4)}px`;
      side.button.hidden = step === 0;
      side.button.setAttribute("aria-label", `${step} 스텝 삭제`);
    });
  });
}

systems.forEach((system) => {
  system.widthInput.addEventListener("input", renderSteps);
  system.sizeInput.addEventListener("input", renderSteps);
  system.widthInput.addEventListener("change", () => {
    system.widthInput.value = String(readSystem(system).width);
    renderSteps();
  });
  system.sizeInput.addEventListener("change", () => {
    system.sizeInput.value = String(readSystem(system).size);
    renderSteps();
  });
  system.intervalSelect.addEventListener("change", renderSteps);
});
exampleTextInput.addEventListener("input", renderSteps);
window.addEventListener("resize", () => {
  syncWidthControls();
  renderSteps();
});

const fontStylesheet = document.createElement("link");
fontStylesheet.rel = "stylesheet";
fontStylesheet.addEventListener("error", () => {
  fontStatus.textContent = "글꼴을 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.";
  fontStatus.hidden = false;
});
document.head.append(fontStylesheet);

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

// 두 드로워는 서로 독립적으로 열고 닫는다.
function setDrawer(side, open) {
  columns[side].classList.toggle("open", open);
  document
    .querySelector(`.drawer-toggle[data-drawer="${side}"]`)
    .setAttribute("aria-expanded", String(open));
}
document.querySelectorAll(".drawer-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const side = button.dataset.drawer;
    setDrawer(side, !columns[side].classList.contains("open"));
  });
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setDrawer("left", false);
    setDrawer("right", false);
  }
});

fontFamilySelect.dispatchEvent(new Event("change"));
syncWidthControls();
renderSteps();
