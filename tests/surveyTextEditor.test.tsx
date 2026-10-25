import { useState } from "react";
import { afterEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SurveyTextEditor } from "../src/SurveyTextEditor";
afterEach(cleanup);

it("a szöveg nevű mező is egyértelműen elérhető, fülváltáskor megőrzi a módosítást", async () => {
  function Editor() {
    const [text, setText] = useState("Korábban mentett feltételek");
    return (
      <>
        <button onClick={() => setText("**Módosított feltételek**")}>
          Külső módosítás
        </button>
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
      </>
    );
  }
  render(<Editor />);
  expect(
    await screen.findByRole("textbox", { name: "Ajánlat feltételei" }),
  ).toHaveTextContent("Korábban mentett feltételek");
  fireEvent.click(screen.getByRole("button", { name: "Külső módosítás" }));
  fireEvent.keyDown(screen.getByRole("tab", { name: "Feltételek" }), {
    key: "ArrowRight",
  });
  expect(screen.getByRole("tab", { name: "Megjegyzés" })).toHaveFocus();
  expect(screen.getByRole("textbox", { name: "Megjegyzés" })).toHaveTextContent(
    "Másik leírás",
  );
  fireEvent.click(screen.getByRole("tab", { name: "Feltételek" }));
  expect(
    await screen.findByRole("textbox", { name: "Ajánlat feltételei" }),
  ).toHaveTextContent("Módosított feltételek");
});
