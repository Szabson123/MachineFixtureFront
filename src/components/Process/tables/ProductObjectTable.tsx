import React from "react";

interface ProductObjectTableProps {
  objects: any[];
  childrenMap: Record<number, any[]>;
  onMotherClick: (obj: any) => void;
  expandedMotherId: number | null;
  onSortChange: (field: string) => void;
  ordering: string;
}

export const ProductObjectTable: React.FC<ProductObjectTableProps> = ({
  objects,
  childrenMap,
  onMotherClick,
  expandedMotherId,
  onSortChange,
  ordering,
}) => {
  const formatDate = (d: string) => new Date(d).toLocaleDateString("pl-PL");
  const formatDateTime = (d: string) => new Date(d).toLocaleString("pl-PL");

  // 1) Zbierz ID matek obecnych w tej liście
  const motherIds = new Set<number>(
    objects.filter((o) => o.is_mother).map((o) => o.id)
  );

  // 2) Odfiltruj dzieci, których matka też jest na liście
  const visibleObjects = objects.filter(
    (o) => !(o.mother_object && motherIds.has(o.mother_object))
  );

  const hasQuarantine = visibleObjects.some((obj) => !!obj.quranteen_time);

  const isExpiringSoon = (obj: any) => {
    const expDateStr = obj.exp_date_in_process || obj.expire_date;
    if (!expDateStr) return false;

    const expDate = new Date(expDateStr);
    const now = new Date();
    const diff = expDate.getTime() - now.getTime();
    const daysLeft = diff / (1000 * 60 * 60 * 24);

    return daysLeft < 2;
  };

  // helper do strzałek sortowania
  const renderSortArrow = (field: string) => {
    if (!ordering.includes(field)) return null;
    return ordering.startsWith("-") ? "↓" : "↑";
  };

  return (
    <div className="table-wrapper">
      <table className="fixtures-table">
        <thead>
          <tr>
            <th>Typ</th>
            <th onClick={() => onSortChange("serial_number")}>
              Serial {renderSortArrow("serial_number")}
            </th>
            <th onClick={() => onSortChange("product__name")}>
              Produkt {renderSortArrow("product__name")}
            </th>
            <th onClick={() => onSortChange("created_at")}>
              Dodano {renderSortArrow("created_at")}
            </th>
            <th
              onClick={() =>
                onSortChange(hasQuarantine ? "quranteen_time" : "production_date")
              }
            >
              {hasQuarantine ? "Data kwarantanny" : "Data produkcji"}{" "}
              {renderSortArrow(hasQuarantine ? "quranteen_time" : "production_date")}
            </th>
            <th onClick={() => onSortChange("expire_date_final")}>
              Data ważności {renderSortArrow("expire_date_final")}
            </th>
            <th onClick={() => onSortChange("current_place")}>
              Miejsce {renderSortArrow("current_place")}</th>
            <th>Wprowadził</th>
          </tr>
        </thead>
        <tbody>
          {visibleObjects.map((obj) => (
            <React.Fragment key={obj.id}>
              <tr
                onClick={() => obj.is_mother && onMotherClick(obj)}
                style={{
                  cursor: obj.is_mother ? "pointer" : "default",
                  backgroundColor: isExpiringSoon(obj)
                    ? "#FFE5B4"
                    : obj.is_mother
                    ? "#f0f9ff"
                    : "inherit",
                }}
              >
                <td>{obj.is_mother ? "Karton" : "Produkt"}</td>
                <td>{obj.serial_number}</td>
                <td>{obj.sub_product_name || "-"}</td>
                <td>{formatDateTime(obj.created_at)}</td>
                <td>
                  {obj.quranteen_time
                    ? formatDateTime(obj.quranteen_time)
                    : formatDate(obj.production_date)}
                </td>
                <td>
                  {obj.exp_date_in_process
                    ? formatDate(obj.exp_date_in_process)
                    : formatDate(obj.expire_date)}
                </td>
                <td>{obj.current_place_name || "-"}</td>
                <td>{obj.initial_who_entry}</td>
              </tr>

              {expandedMotherId === obj.id && childrenMap[obj.id] && (
                <tr>
                  <td colSpan={9}>
                    <table className="child-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Serial</th>
                          <th>Dodano</th>
                          <th>Data produkcji</th>
                          <th>Data ważności</th>
                        </tr>
                      </thead>
                      <tbody>
                        {childrenMap[obj.id].map((child, index) => (
                          <tr key={child.id}>
                            <td>{index + 1}.</td>
                            <td>{child.serial_number}</td>
                            <td>{formatDateTime(child.created_at)}</td>
                            <td>{formatDate(child.production_date)}</td>
                            <td>
                              {formatDate(
                                child.exp_date_in_process || child.expire_date
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};
