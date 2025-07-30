import React from "react";
import { ProductObjectTable } from "../tables/ProductObjectTable";

type Props = {
    title: string;
    totalCount: number;
    onAddClick: () => void;
    objects: any[];
    loaderRef: React.RefObject<HTMLDivElement | null>;
    childrenMap: Record<number, any[]>;
    expandedMotherId: number | null;
    onMotherClick: (obj: any) => void;
    modalComponent?: React.ReactNode;
  };
  
const ProcessActionWrapper: React.FC<Props> = ({
  title,
  totalCount,
  onAddClick,
  objects,
  loaderRef,
  childrenMap,
  expandedMotherId,
  onMotherClick,
  modalComponent,
}) => {
  return (
    <div className="fixture-table-container">
      <h2>{title}</h2>
      <button onClick={onAddClick}>+ Dodaj</button>
      <p>Liczba obiektów: {totalCount}</p>

      <ProductObjectTable
        objects={objects}
        childrenMap={childrenMap}
        expandedMotherId={expandedMotherId}
        onMotherClick={onMotherClick}
      />

      <div ref={loaderRef} style={{ height: "40px" }} />
      {modalComponent}
    </div>
  );
};

export default ProcessActionWrapper;
