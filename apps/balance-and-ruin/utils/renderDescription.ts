import Mustache from "mustache";
import React from "react";
import { FlagValue } from "~/state/schemaSlice";

export const renderDescription = (
  template: React.ReactNode,
  value: FlagValue,
) => {
  if (typeof template !== "string") {
    return template;
  }
  if (Array.isArray(value)) {
    const isIdenticalRange =
      value.length > 0 && value.every((v) => v === value[0]);
    const displayValue = isIdenticalRange ? value[0] : value.join("-");
    return Mustache.render(template, displayValue);
  }
  return Mustache.render(template, value);
};
