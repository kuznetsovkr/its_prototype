import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { AdminAccessContext, canManageCatalog, isAdminRole } from "./adminAccess";
import AdminInventory from "./AdminInventory";

vi.mock("../api", () => ({ default: {}, API_BASE: "/api" }));

describe("administrative roles", () => {
  it("does not grant full access to a warehouse admin, a missing or an unknown role", () => {
    expect(canManageCatalog({ role: "super_admin" })).toBe(true);
    for (const role of [undefined, "admin", "user", "SUPER_ADMIN"]) expect(canManageCatalog({ role })).toBe(false);
    expect(isAdminRole("super_admin")).toBe(true);
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("user")).toBe(false);
  });

  it.each(["admin", "super_admin"])("renders the correct sections for %s", (role) => {
    const html = renderToStaticMarkup(<MemoryRouter><AdminAccessContext.Provider value={{ role, name: "Сотрудник" }}>
      <AdminInventory />
    </AdminAccessContext.Provider></MemoryRouter>);
    expect(html).toContain("Складские позиции");
    expect(html).toContain("Добавить позицию");
    expect(html).toContain("Сотрудник");
    for (const title of ["Справочники", "Цены и параметры", "Сертификаты", "Заказы"]) {
      if (role === "super_admin") expect(html).toContain(title);
      else expect(html).not.toContain(title);
    }
  });

  it("gives the owner every existing section through the super admin role", () => {
    const owner = { role: "super_admin", name: "Заказчик" };
    expect(canManageCatalog(owner)).toBe(true);
    const html = renderToStaticMarkup(<MemoryRouter><AdminAccessContext.Provider value={owner}><AdminInventory /></AdminAccessContext.Provider></MemoryRouter>);
    for (const title of ["Складские позиции", "Сертификаты", "Заказы", "Справочники", "Цены и параметры"]) expect(html).toContain(title);
  });
});
