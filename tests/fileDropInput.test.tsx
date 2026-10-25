import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { FileDropInput } from "../src/FileDropInput";
afterEach(cleanup);
const file = new File(["test"], "photo.png", { type: "image/png" });
const transfer = { types: ["Files"], files: [file] };

it("behúzáskor az egész fájllistát egyszer adja át, folyamatban nem indít párhuzamos feltöltést", async () => {
  let finish!: () => void;
  const upload = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  render(<FileDropInput label="Fotók" accept="image/png" onFiles={upload} />);
  const zone = screen.getByRole("group");
  fireEvent.dragEnter(zone, { dataTransfer: transfer });
  expect(zone).toHaveClass("is-dragging");
  fireEvent.drop(zone, { dataTransfer: { ...transfer, files: [file, file] } });
  fireEvent.drop(zone, { dataTransfer: transfer });
  expect(upload).toHaveBeenCalledTimes(1);
  expect(upload).toHaveBeenCalledWith([file, file]);
  expect(screen.getByLabelText("Fotók")).toBeDisabled();
  finish();
  await waitFor(() =>
    expect(screen.getByLabelText("Fotók")).not.toBeDisabled(),
  );
});

it("letiltott feltöltőnél a behúzás nem ment fájlt", () => {
  const upload = vi.fn(async () => {});
  render(
    <FileDropInput
      label="Fotók"
      accept="image/png"
      disabled
      onFiles={upload}
    />,
  );
  fireEvent.drop(screen.getByRole("group"), { dataTransfer: transfer });
  expect(upload).not.toHaveBeenCalled();
});

it("az egyfájlos mezőbe húzott csoportot visszautasítja", () => {
  const upload = vi.fn(async () => {});
  render(
    <FileDropInput
      label="Logó"
      accept="image/png"
      multiple={false}
      onFiles={upload}
    />,
  );
  fireEvent.drop(screen.getByRole("group"), {
    dataTransfer: { ...transfer, files: [file, file] },
  });
  expect(upload).not.toHaveBeenCalled();
  expect(screen.getByRole("alert")).toHaveTextContent("egyszerre egy fájl");
});
