import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AddOrReceiveObjectView from "../components/ProcessChecker/AddOrReceiveObjectView";
import MoveObjectView from "../components/ProcessChecker/MoveObjectView";

const ProcessActionRouter: React.FC = () => {
  const { productId, actionType } = useParams<{ productId: string; actionType: string }>();
  const [viewType, setViewType] = useState<"add" | "receive" | "move" | null>(null);

  const selectedProcess = JSON.parse(localStorage.getItem("selectedProcess") || "{}");

  useEffect(() => {
    console.log("actionType:", actionType);
    console.log("selectedProcess:", selectedProcess);
    console.log("selectedProcess.order:", selectedProcess?.order);
    console.log("productId:", productId);
  
    if (!productId || !selectedProcess?.id) return;
  
    if (actionType === "add") {
      setViewType(selectedProcess.order === 1 ? "add" : "receive");
    } else if (actionType === "receive") {
      setViewType("receive");
    } else if (actionType === "move") {
      setViewType("move");
    }
  }, [actionType, productId, selectedProcess]);

  if (!viewType) return <p>Ładowanie widoku...</p>;

  return (
    <>
      {(viewType === "add" || viewType === "receive") ? (
        <AddOrReceiveObjectView endpointType={viewType} />
      ) : viewType === "move" ? (
        <MoveObjectView />
      ) : (
        <p>Błąd: Nieznany typ widoku.</p>
      )}
    </>
  );
};

export default ProcessActionRouter;
