import React from "react";

export default function Loader() {
  return (
    <div className="flex justify-center items-center h-full">
      <div className="w-8 h-8 border-4 border-white border-dashed rounded-full animate-spin" />
    </div>
  );
}
