import { formatDate, initials, splitTags } from "./format";

describe("format utils", () => {
  it("formats ISO dates as month and year", () => {
    expect(formatDate("2026-03-15")).toBe("March 2026");
    expect(formatDate("2026-03-15", true)).toBe("15 March 2026");
  });

  it("returns an empty string for missing or invalid dates", () => {
    expect(formatDate(null)).toBe("");
    expect(formatDate("not-a-date")).toBe("");
  });

  it("builds initials from the first two words", () => {
    expect(initials("School Management System")).toBe("SM");
    expect(initials("")).toBe("");
  });

  it("splits comma separated tags and drops blanks", () => {
    expect(splitTags(" Django, ,Next.js ,")).toEqual(["Django", "Next.js"]);
  });
});
