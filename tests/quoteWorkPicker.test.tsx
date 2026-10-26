import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QuoteWorkPicker } from "../src/QuoteWorkPicker";
import type { Context } from "../src/ui";
import { line } from "./fixtures";
afterEach(cleanup);
function context() {
  return {
    projectId: "project",
    data: {
      work_items: [
        {
          id: "a",
          name: "Dugalj",
          category: "Szerelvény",
          unit: "db",
          price_minor: 100000,
          description: "Rejtett kivitel",
          archived: false,
        },
        {
          id: "b",
          name: "Vezeték",
          category: "Kábel",
          unit: "m",
          price_minor: 20000,
          description: "",
          archived: false,
        },
        {
          id: "c",
          name: "Archív",
          category: "",
          unit: "db",
          price_minor: 0,
          description: "",
          archived: true,
        },
      ],
      entries: [
        {
          id: "survey",
          project_id: "project",
          payload: {
            type: "survey",
            name: "Felmérés",
            whole_property: [],
            rooms: [
              {
                id: "room",
                name: "Konyha",
                lines: [{ ...line, price_text: "Egyeztetendő" }],
              },
            ],
          },
        },
        {
          id: "other",
          project_id: "other",
          payload: {
            type: "survey",
            name: "Másik projekt",
            rooms: [],
            whole_property: [],
          },
        },
        {
          payload: {
            type: "recipe",
            work_id: "a",
            lines: [
              {
                material_id: "material",
                name: "Doboz",
                quantity_milli: 1000,
                unit: "db",
              },
            ],
          },
        },
      ],
    },
  } as unknown as Context;
}
it("szűrés közben megőrzi a kijelölést, mennyiséget és receptet; csak kijelölteket ad hozzá", () => {
  const onAdd = vi.fn();
  render(<QuoteWorkPicker ctx={context()} onAdd={onAdd} />);
  expect(screen.queryByText("Archív")).toBeNull();
  fireEvent.click(screen.getByRole("checkbox", { name: /Dugalj/ }));
  fireEvent.change(screen.getByLabelText("Dugalj mennyisége"), {
    target: { value: "2,5" },
  });
  fireEvent.change(screen.getByLabelText("Helyiség a hozzáadott munkákhoz"), {
    target: { value: "Nappali" },
  });
  fireEvent.change(screen.getByLabelText("Munka keresése"), {
    target: { value: "Vezeték" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Kijelöltek hozzáadása" }),
  );
  const added = onAdd.mock.calls[0][0];
  expect(added).toHaveLength(1);
  expect(added[0]).toMatchObject({
    name: "Dugalj",
    quantity_milli: 2500,
    location: "Nappali",
    price_minor: 100000,
    notes: "Rejtett kivitel",
  });
  expect(added[0].id).not.toBe("a");
  expect(added[0].recipe).toHaveLength(1);
  expect(
    (
      screen.getByRole("button", {
        name: "Kijelöltek hozzáadása",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
});
it("felmérésből csak kiválasztás után másol, megőrzi a helyiséget és szöveges árat, hibás mennyiséget blokkol", () => {
  const onAdd = vi.fn();
  render(<QuoteWorkPicker ctx={context()} onAdd={onAdd} />);
  expect(screen.queryByRole("option", { name: "Másik projekt" })).toBeNull();
  fireEvent.change(screen.getByLabelText("Tételek forrása"), {
    target: { value: "survey" },
  });
  expect(onAdd).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Találatok kijelölése" }));
  const input = screen.getByLabelText(`${line.name} mennyisége`);
  fireEvent.change(input, { target: { value: "0" } });
  expect(
    (
      screen.getByRole("button", {
        name: "Kijelöltek hozzáadása",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  fireEvent.change(input, { target: { value: "3" } });
  fireEvent.click(
    screen.getByRole("button", { name: "Kijelöltek hozzáadása" }),
  );
  expect(onAdd.mock.calls[0][0][0]).toMatchObject({
    quantity_milli: 3000,
    location: "Konyha / Konyha",
    price_text: "Egyeztetendő",
  });
});
