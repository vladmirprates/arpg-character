import { render } from "@testing-library/react";
import { I18nProvider } from "../i18n/I18nProvider";
import { Modal } from "./Modal";

const modal = (open: boolean, id: string) => (
  <Modal open={open} onClose={() => {}} title={id} titleId={id}>
    <p>{id}</p>
  </Modal>
);

describe("<Modal />", () => {
  test("flags the root while any modal is open (the background-animation pause keys off it)", () => {
    const root = document.documentElement;
    const { rerender, unmount } = render(
      <I18nProvider initialLocale="en">
        {modal(true, "a")}
        {modal(false, "b")}
      </I18nProvider>,
    );
    expect(root).toHaveAttribute("data-dialog-open");
    // A second one opens, then the first closes: still flagged.
    rerender(
      <I18nProvider initialLocale="en">
        {modal(false, "a")}
        {modal(true, "b")}
      </I18nProvider>,
    );
    expect(root).toHaveAttribute("data-dialog-open");
    rerender(
      <I18nProvider initialLocale="en">
        {modal(false, "a")}
        {modal(false, "b")}
      </I18nProvider>,
    );
    expect(root).not.toHaveAttribute("data-dialog-open");
    unmount();
  });
});
