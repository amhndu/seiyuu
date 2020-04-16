import React from "react"

import { Tooltip } from "@material-ui/core";

export const ElidedText = ({ children, maxLength }) => {
  let s = children;

  if (s.length >= maxLength) {
    s = s.substring(0, maxLength) + '...';
    return (
      <Tooltip title={children} interactive>
        <span>{s}</span>
      </Tooltip>
    )
  }

  return (
    <>
      {s}
    </>
  );
};