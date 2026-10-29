document.querySelectorAll(".number-step").forEach((button) => {
  button.addEventListener("click", () => {
    const control = button.closest(".number-control");
    const input = control?.querySelector('input[type="number"]');
    const steps = Number(button.dataset.step);

    if (!input || !Number.isInteger(steps) || steps === 0) {
      return;
    }

    if (steps > 0) {
      input.stepUp(steps);
    } else {
      input.stepDown(Math.abs(steps));
    }

    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
});
