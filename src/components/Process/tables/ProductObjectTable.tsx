import React from "react";

interface FieldsConfig {
  id?: number;
  product?: boolean;
  mother_object?: boolean;
  sub_product?: boolean;
  is_mother?: boolean;
  current_process?: boolean;
  current_place?: boolean;
  serial_number?: boolean;
  full_sn?: boolean;
  created_at?: boolean;
  expire_date?: boolean;
  production_date?: boolean;
  exp_date_in_process?: boolean;
  quranteen_time?: boolean;
  max_in_process?: boolean;
  ex_mother?: boolean;
  sito_cycle_limit?: boolean;
  sito_cycles_count?: boolean;
  end?: boolean;
  is_full?: boolean;
  last_move: boolean;
  sito_basic_unnamed_place: boolean;
  free_plain_text: boolean;
}

interface ProductObjectTableProps {
  objects: any[];
  childrenMap: Record<number, any[]>;
  onMotherClick: (obj: any) => void;
  expandedMotherId: number | null;
  onSortChange: (field: string) => void;
  ordering: string;
  fields?: FieldsConfig | null;
}
export const ProductObjectTable: React.FC<ProductObjectTableProps> = ({
  objects,
  childrenMap,
  onMotherClick,
  expandedMotherId,
  onSortChange,
  ordering,
  fields,
}) => {
  const formatDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("pl-PL") : "-";

const formatDateTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString("pl-PL") : "-";

const motherIds = new Set<number>(
  objects.filter((o) => o.is_mother).map((o) => o.id)
);

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

const renderSortArrow = (field: string) => {
  if (!ordering.includes(field)) return null;
  return ordering.startsWith("-") ? "↓" : "↑";
};

type ColumnKey =
  | "type"
  | "serial_number"
  | "full_sn"
  | "sub_product"
  | "created_at"
  | "prod_or_quar"
  | "expire"
  | "max_in_process"
  | "sito"
  | "current_place"
  | "last_move"
  | "sito_basic_unnamed_place"
  | "free_plain_text"
  | "initial_who_entry";

interface ColumnDef {
  key: ColumnKey;
  label: string;
  fieldFlag?: keyof FieldsConfig;
  sortableField?: string;
  render: (obj: any) => React.ReactNode;
}

const allColumns: ColumnDef[] = [
  {
    key: "type",
    label: "Typ",
    render: (obj) => (obj.is_mother ? "Karton" : "Produkt"),
  },
  {
    key: "serial_number",
    label: "Serial",
    fieldFlag: "serial_number",
    sortableField: "serial_number",
    render: (obj) => obj.serial_number || "-",
  },
  {
    key: "full_sn",
    label: "Pełny SN",
    fieldFlag: "full_sn",
    sortableField: "full_sn",
    render: (obj) => obj.full_sn || "-",
  },
  {
    key: "sito_basic_unnamed_place",
    label: "Miejsce w szafie",
    fieldFlag: "sito_basic_unnamed_place",
    sortableField: "sito_basic_unnamed_place",
    render: (obj) => obj.sito_basic_unnamed_place || "-",
  },
    {
    key: "free_plain_text",
    label: "Nazwa Programu",
    fieldFlag: "free_plain_text",
    sortableField: "free_plain_text",
    render: (obj) => obj.free_plain_text || "-",
  },
  {
    key: "sub_product",
    label: "Produkt",
    fieldFlag: "sub_product",
    sortableField: "sub_product__name",
    render: (obj) => obj.sub_product_name || "-",
  },
  
  {
    key: "created_at",
    label: "Dodano",
    fieldFlag: "created_at",
    sortableField: "created_at",
    render: (obj) => formatDateTime(obj.created_at),
  },
  {
    key: "last_move",
    label: "Ostatni Ruch",
    fieldFlag: "last_move",
    sortableField: "last_move",
    render: (obj) => formatDateTime(obj.last_move),
  },
  {
    key: "prod_or_quar",
    label: hasQuarantine ? "Data kwarantanny" : "Data produkcji",
    fieldFlag: hasQuarantine ? "quranteen_time" : "production_date",
    sortableField: hasQuarantine ? "quranteen_time" : "production_date",
    render: (obj) =>
      obj.quranteen_time
        ? formatDateTime(obj.quranteen_time)
        : formatDate(obj.production_date),
  },
  {
    key: "expire",
    label: "Data ważności",
    fieldFlag: "expire_date",
    sortableField: "expire_date_final",
    render: (obj) =>
      obj.exp_date_in_process
        ? formatDate(obj.exp_date_in_process)
        : formatDate(obj.expire_date),
  },
  {
    key: "max_in_process",
    label: "Max w procesie",
    fieldFlag: "max_in_process",
    sortableField: "max_in_process",
    render: (obj) => formatDateTime(obj.max_in_process),
  },
  {
    key: "sito",
    label: "Sito cykle",
    fieldFlag: "sito_cycles_count",
    sortableField: "sito_cycles_count",
    render: (obj) =>
      obj.sito_cycles_count != null && obj.sito_cycle_limit != null
        ? `${obj.sito_cycles_count} / ${obj.sito_cycle_limit}`
        : "-",
  },
  {
    key: "current_place",
    label: "Miejsce",
    fieldFlag: "current_place",
    sortableField: "current_place",
    render: (obj) => obj.current_place_name || "-",
  },
];

const visibleColumns = allColumns.filter((col) => {
  if (!col.fieldFlag) return true;
  if (!fields) return true;
  return fields[col.fieldFlag] === true;
});

  return (
  <div className="table-wrapper">
    <table className="fixtures-table">
      <thead>
        <tr>
          {visibleColumns.map((col) => (
            <th
              key={col.key}
              onClick={
                col.sortableField
                  ? () => onSortChange(col.sortableField!)
                  : undefined
              }
              style={{ cursor: col.sortableField ? "pointer" : "default" }}
            >
              {col.label}{" "}
              {col.sortableField && renderSortArrow(col.sortableField)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {visibleObjects.map((obj) => (
          <React.Fragment key={`mother-${obj.id}`}>
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
              {visibleColumns.map((col) => (
                <td key={col.key}>{col.render(obj)}</td>
              ))}
            </tr>

            {expandedMotherId === obj.id && childrenMap[obj.id] && (
              <tr>
                <td colSpan={visibleColumns.length}>
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
                        <tr key={`child-${obj.id}-${index}`}>
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
