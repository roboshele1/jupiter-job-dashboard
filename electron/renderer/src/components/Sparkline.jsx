import React from "react";
import { Sparklines, SparklinesLine } from "react-sparklines";

export default function Sparkline({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="sparkline-container">
      <Sparklines data={data} limit={30} width={100} height={40} margin={5}>
        <SparklinesLine color="#4caf50" style={{ strokeWidth: 2, fill: "none" }} />
      </Sparklines>
    </div>
  );
}

