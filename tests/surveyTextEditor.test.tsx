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
    screen.getByRole("textbox", { name: "Ajánlat feltételei", exact: true }),
    { target: { value: "Módosított feltételek" } },
  );
  fireEvent.keyDown(
    screen.getByRole("tab", { name: "Feltételek", exact: true }),
    { key: "ArrowRight" },
  );
  expect(
    screen.getByRole("tab", { name: "Megjegyzés", exact: true }),
  ).toHaveFocus();
  expect(
    screen.getByRole("textbox", { name: "Megjegyzés", exact: true }),
  ).toHaveValue("Másik leírás");
  fireEvent.click(screen.getByRole("tab", { name: "Feltételek", exact: true }));
  expect(
    screen.getByRole("textbox", { name: "Ajánlat feltételei", exact: true }),
  ).toHaveValue("Módosított feltételek");
});
