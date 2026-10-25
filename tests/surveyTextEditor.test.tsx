import { useState } from "react";
import { afterEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SurveyTextEditor } from "../src/SurveyTextEditor";
afterEach(cleanup);

it("a szöveg nevű mező is egyértelműen elérhető, fülváltáskor megőrzi a módosítást", () => {
  function Editor() {
    const [text, setText] = useState("Korábban mentett feltételek");
    return (
      <SurveyTextEditor
        fields={[
          {
            key: "text",
            tab: "Feltételek",
            label: "Ajánlat feltételei",
            value: text,
          },
          {
            key: "notes",
            tab: "Megjegyzés",
            label: "Megjegyzés",
            value: "Másik leírás",
          },
        ]}
        onChange={(key, value) => {
          if (key === "text") setText(value);
        }}
      />
    );
  }
  render(<Editor />);
  fireEvent.change(
    screen.getByRole("textbox", { name: "Ajánlat feltételei" }),
    { target: { value: "Módosított feltételek" } },
  );
  fireEvent.keyDown(screen.getByRole("tab", { name: "Feltételek" }), {
    key: "ArrowRight",
  });
  expect(screen.getByRole("tab", { name: "Megjegyzés" })).toHaveFocus();
  expect(screen.getByRole("textbox", { name: "Megjegyzés" })).toHaveValue(
    "Másik leírás",
  );
  fireEvent.click(screen.getByRole("tab", { name: "Feltételek" }));
  expect(
    screen.getByRole("textbox", { name: "Ajánlat feltételei" }),
  ).toHaveValue("Módosított feltételek");
});
